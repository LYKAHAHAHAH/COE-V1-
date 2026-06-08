import { uploadFile } from "./storage";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed. Please use POST.` });
  }

  try {
    const { image, mimeType, type } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing 'image' base64 raw data in body." });
    }
    if (!type) {
      return res.status(400).json({ error: "Missing upload identifier 'type' (e.g., logo1, signature, etc.)." });
    }

    const hostUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const url = await uploadFile(image, mimeType || "image/png", type, hostUrl);

    return res.status(200).json({ success: true, url });
  } catch (error: any) {
    console.error("Vercel Serverless Error (upload):", error);
    return res.status(500).json({ error: error.message || "Failed to process the uploaded image file." });
  }
}
