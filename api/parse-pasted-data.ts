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

// Robust retry wrapper for Gemini requests with exponential backoff and multi-model fallback rotation
async function callGeminiWithRetry(ai: any, params: any, maxRetries = 3) {
  const requestedModel = params.model || "gemini-3.5-flash";
  const defaultRotation = ["gemini-3.4-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  
  // Create a filtered list of unique candidates, starting with requested model
  const candidates = [requestedModel, ...defaultRotation.filter(m => m !== requestedModel)];
  
  let lastError: any = null;
  
  for (const modelName of candidates) {
    let attempt = 0;
    let delay = 1000;
    
    while (attempt < maxRetries) {
      try {
        console.log(`Attempting Gemini call with model [${modelName}] (Attempt ${attempt + 1}/${maxRetries})`);
        return await ai.models.generateContent({
          ...params,
          model: modelName
        });
      } catch (error: any) {
        lastError = error;
        attempt++;
        const errorMessage = error.message || "";
        const status = error.status || (error.error && error.error.code);
        const isTransient = 
          status === 429 ||
          status === 503 ||
          status === 504 ||
          errorMessage.includes("503") || 
          errorMessage.includes("UNAVAILABLE") || 
          errorMessage.includes("demand") ||
          errorMessage.includes("Resource has been exhausted") ||
          errorMessage.includes("exhausted");
        
        if (isTransient && attempt < maxRetries) {
          console.warn(`Gemini call with model [${modelName}] failed with transient error ${status || "unknown"}. Retrying in ${delay}ms... Details: ${errorMessage}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          if (isTransient) {
            console.warn(`Model [${modelName}] failed all ${maxRetries} retries with transient error. Trying next fallback model if available...`);
            break; // Break retry loop to proceed to next model in candidate array
          } else {
            throw error; // For non-transient mistakes (e.g. invalid arguments or key issues), fail fast
          }
        }
      }
    }
  }
  
  throw lastError || new Error("All models in the rotation list failed to generate a response due to transient errors.");
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

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text element cannot be empty." });
  }

  try {
    const ai = getGeminiClient();
    const response = await callGeminiWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: `You are an expert data extractor representing an eligibility verification system.
      Your task is to extract details from the provided clinical text or notes to fill out a "Certificate of Eligibility (Indigency)".

      EXTRACT THESE EXACT FIELDS:
      1. **Patient Name**: Full name of the person seeking medical assistance. Look for lines like "Patient:", "Name:", or general subject references.
      2. **Address**: Complete residential address of the patient. Often includes barangay, city, street, or province.
      3. **Classification**: Maps to one of these EXACT values: "Financially Capacicated (W/ CHS)", "Financially Incapacitated (C2)", "Financially Incapacitated (C1)", or "Indigent". If not specified or if terms like "poor", "needy", "no income" are mentioned, use "Indigent".
      4. **Assistance Type**: Identify what the patient needs help with. Map or list them separated by " / " if multiple. Examples: "Laboratory", "Medicine", "Hospital Bill", "CT Scan", "X-ray", "MRI", "Ultrasound", "Physical Therapy", "Occupational Therapy", "Supply", "Instrumentation Fee", "Implant Fee", "ECG", "2D Echo", "NST & Scanning". If none mentioned, leave blank or empty.
      5. **Issuance Date**: Date the certificate is being issued. If today's date or current date is implied, use that in format "Month Day, Year" (e.g. "March 25, 2026").

      TEXT CONTENT TO PARSE:
      """
      ${text}
      """`,
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

    const textResponse = response?.text;
    if (!textResponse) {
      return res.status(500).json({ error: "Empty reply received from generative model." });
    }

    const result = JSON.parse(textResponse);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Vercel Serverless Error with Gemini Text Extraction:", error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: error.message || "An error occurred while parsing text using Gemini AI." });
  }
}
