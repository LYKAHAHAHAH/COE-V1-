import { CertificateData } from "../types";

export async function parsePastedData(text: string): Promise<Partial<CertificateData>> {
  if (!text.trim()) return {};

  try {
    const response = await fetch("/api/parse-pasted-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status} Error`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error parsing data with backend:", error);
    throw error;
  }
}

export async function parsePastedImage(imageBase64: string, mimeType: string): Promise<Partial<CertificateData>> {
  try {
    const response = await fetch("/api/parse-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status} Error`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error parsing image with backend:", error);
    throw error;
  }
}
