import { GoogleGenAI, Type } from "@google/genai";
import { CertificateData } from "../types";

export async function parsePastedData(text: string): Promise<Partial<CertificateData>> {
  if (!text.trim()) return {};

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Please set it in the environment.");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are an expert data extractor for medical certificates. 
      Your task is to extract specific details from the provided text to fill out a "Certificate of Eligibility (Indigency)".

      EXTRACT THE FOLLOWING FIELDS:
      1. **Patient Name**: Look for the full name of the person seeking medical assistance. It might be preceded by "Patient:", "Name:", or just mentioned as the subject of the document.
      2. **Address**: Look for the residential address of the patient. It usually includes a street, barangay, city, or province.
      3. **Classification**: Identify the financial status. Map it to one of these EXACT values: "Financially Capacitated", "Financially Incapacitated (C2)", "Financially Incapacitated (C1)", or "Indigent". If not specified, default to "Indigent".
      4. **Assistance Type**: Identify what the patient needs help with. Examples: "Laboratory", "Medicine", "Hospital Bill", "CT Scan", "X-ray", "MRI", "Ultrasound", "Physical Therapy", "Occupational Therapy", "Supply", "Instrumentation Fee", "Implant Fee", "ECG", "2D Echo", "NST & Scanning". If multiple are mentioned, list them separated by " / ".
      5. **Issuance Date**: The date the certificate is being issued. If a date is mentioned as "today" or the current date in the text, use that. Format as "Month Day, Year" (e.g., "March 25, 2026").

      TEXT TO PARSE:
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
      console.error("Empty response from Gemini");
      return {};
    }

    const result = JSON.parse(textResponse);
    return result;
  } catch (error) {
    console.error("Error parsing data with Gemini:", error);
    return {};
  }
}
