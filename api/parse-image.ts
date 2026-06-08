import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API key into your Vercel or environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export default async function handler(req: any, res: any) {
  // Handle CORS and preflight options
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "No image file data supplied." });
  }

  // Clean pure base64 if it has standard data:image header prefix
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const standardMime = mimeType || "image/png";

  try {
    const ai = getGeminiClient();
    const imagePart = {
      inlineData: {
        mimeType: standardMime,
        data: pureBase64,
      },
    };

    const textPart = {
      text: `You are an expert data extractor and OCR specialist for clinical materials and patient documents.
      Your task is to analyze the attached image (which could be a referral letter, lab request form, medical certificate, ID card, clinical note, or utility bill)
      and extract appropriate details required to fill out a "Certificate of Eligibility (Indigency)".

      EXTRACT THESE EXACT FIELDS:
      1. **Patient Name**: Look for the full name of the patient. Look for cues like "Patient Name", "Client", "Name", or top bold clinical lines.
      2. **Address**: Complete residential/billing address of the patient.
      3. **Classification**: Maps to one of these EXACT values: "Financially Capacicated (W/ CHS)", "Financially Incapacitated (C2)", "Financially Incapacitated (C1)", or "Indigent". If not specified or if terms like "poor", "needy", "no income" are implied, use "Indigent".
      4. **Assistance Type**: Identify any requested medical assistance, services, or procedures. Examples: "Laboratory", "Medicine", "Hospital Bill", "CT Scan", "X-ray", "MRI", "Ultrasound", "Physical Therapy", "Supply", "ECG", "2D Echo". If multiple are listed, separate them with " / ".
      5. **Issuance Date**: The date mentioned on the document or the current date. Format as "Month Day, Year" (e.g. "June 8, 2026"). If no date can be found at all, map to today's date formatted similarly.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING, description: "Full name of the patient" },
            address: { type: Type.STRING, description: "Complete residential address" },
            classification: { type: Type.STRING, description: "One of the specific classification categories" },
            assistanceType: { type: Type.STRING, description: "Type of assistance requested, multiple items separated by ' / '" },
            issuanceDate: { type: Type.STRING, description: "Date in Month Day, Year format" },
          },
          required: ["patientName", "address", "classification", "assistanceType", "issuanceDate"]
        },
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      return res.status(500).json({ error: "Empty reply received from multimodal model." });
    }

    const result = JSON.parse(textResponse);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Vercel Serverless Error with Gemini Image Extraction:", error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: error.message || "An error occurred while parsing image using Gemini AI." });
  }
}
