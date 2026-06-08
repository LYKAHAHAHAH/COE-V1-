import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// High body limits to allow base64 image transfers safely
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Shared Gemini SDK client check & initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please visit Settings > Secrets to add your Gemini API key.");
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

// REST API for Parsing Text
app.post("/api/parse-pasted-data", async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text element cannot be empty." });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
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

    const textResponse = response.text;
    if (!textResponse) {
      return res.status(500).json({ error: "Empty reply received from generative model." });
    }

    const result = JSON.parse(textResponse);
    return res.json(result);
  } catch (error: any) {
    console.error("Error with Gemini Text Extraction:", error);
    return res.status(500).json({ error: error.message || "An error occurred while parsing text using Gemini AI." });
  }
});

// REST API for Parsing Image
app.post("/api/parse-image", async (req, res) => {
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
    return res.json(result);
  } catch (error: any) {
    console.error("Error with Gemini Image Extraction:", error);
    return res.status(500).json({ error: error.message || "An error occurred while parsing image using Gemini AI." });
  }
});

// Configure Vite or Static Files
async function setupViteAndListen() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteAndListen();
