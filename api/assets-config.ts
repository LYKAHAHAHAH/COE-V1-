import { getCentralAssets, saveCentralAssets } from "./storage";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const assets = await getCentralAssets();
      return res.status(200).json({ assets: assets || null });
    }

    if (req.method === 'POST') {
      const { assets } = req.body;
      if (!assets) {
        return res.status(400).json({ error: "Missing 'assets' parameter in request body." });
      }

      await saveCentralAssets(assets);
      return res.status(200).json({ success: true, message: "Central asset configurations saved successfully." });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  } catch (error: any) {
    console.error("Vercel Serverless Error (assets-config):", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
}
