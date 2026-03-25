import { GoogleGenAI, Type } from "@google/genai";
import { CertificateData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parsePastedData(text: string): Promise<Partial<CertificateData>> {
  if (!text.trim()) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the following information from this text for a Certificate of Eligibility (Indigency):
      - Patient Name
      - Address
      - Classification (e.g., Indigent, Needy)
      - Assistance/Service Type (e.g., medical assistance, financial assistance)
      - Issuance Date (format as Month Day, Year)
      
      Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            address: { type: Type.STRING },
            classification: { type: Type.STRING },
            assistanceType: { type: Type.STRING },
            issuanceDate: { type: Type.STRING },
          },
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Error parsing data with Gemini:", error);
    return {};
  }
}
