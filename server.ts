import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

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

// Robust retry wrapper for Gemini requests with exponential backoff and multi-model fallback rotation
async function callGeminiWithRetry(ai: any, params: any, maxRetries = 3) {
  const requestedModel = params.model || "gemini-3.5-flash";
  const defaultRotation = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  
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
        const errorMessage = String(error.message || (error.error && error.error.message) || error);
        const status = error.status || (error.error && error.error.code);
        
        // 1. If model is Not Found / Not Supported (404), go to next model immediately (no retry)
        const isNotFound = 
          status === 404 || 
          errorMessage.toLowerCase().includes("not found") || 
          errorMessage.toLowerCase().includes("not supported");
          
        if (isNotFound) {
          console.warn(`Model [${modelName}] is not found or unsupported. Skipping to next fallback model if available...`);
          break; // Break retry loop to proceed to next model in candidate array
        }

        // 2. If it's a hard quota exhaustion (daily limit or similar), skip to next model immediately
        const isHardQuotaExceeded = 
          status === 429 && (
            errorMessage.toLowerCase().includes("quota exceeded") ||
            errorMessage.toLowerCase().includes("exhausted") ||
            errorMessage.toLowerCase().includes("limit: 20") ||
            errorMessage.toLowerCase().includes("free_tier_requests")
          );

        if (isHardQuotaExceeded) {
          console.warn(`Model [${modelName}] daily quota is exhausted. Skipping to next fallback model immediately...`);
          break; // Break retry loop to proceed to next model in candidate array
        }

        const isTransient = 
          status === 429 ||
          status === 503 ||
          status === 504 ||
          errorMessage.includes("503") || 
          errorMessage.includes("UNAVAILABLE") || 
          errorMessage.includes("demand") ||
          errorMessage.toLowerCase().includes("resource has been exhausted") ||
          errorMessage.toLowerCase().includes("exhausted");
        
        attempt++;
        
        if (isTransient && attempt < maxRetries) {
          console.warn(`Gemini call with model [${modelName}] failed with transient error ${status || "unknown"}. Retrying in ${delay}ms... Details: ${errorMessage}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          if (isTransient) {
            console.warn(`Model [${modelName}] failed all ${maxRetries} retries with transient error. Trying next fallback model if available...`);
            break; // Break retry loop to proceed to next model in candidate array
          } else {
            console.error(`Non-transient error in model [${modelName}]. Propagating error...`);
            throw error; // For non-transient mistakes (e.g. invalid arguments or key issues), fail fast
          }
        }
      }
    }
  }
  
  throw lastError || new Error("All models in the rotation list failed to generate a response.");
}

// REST API for Parsing Text
app.post("/api/parse-pasted-data", async (req, res) => {
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

    const response = await callGeminiWithRetry(ai, {
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

    const textResponse = response?.text;
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

// Shared assets state persistent file path
const assetsPath = path.join(process.cwd(), "uploads", "assets.json");

// Maintain an active list of connected clients for global sync (SSE)
let sseClients: any[] = [];

// Helper function to broadcast to all connected clients
function broadcastAssetsUpdate(assets: any) {
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify({ type: "assets-updated", assets })}\n\n`);
    } catch (err) {
      console.error("Failed to write to SSE client:", err);
    }
  });
}

// GET API to fetch currently persisted logo and signature assets
app.get("/api/assets", (req, res) => {
  if (fs.existsSync(assetsPath)) {
    try {
      const data = fs.readFileSync(assetsPath, "utf-8");
      return res.json(JSON.parse(data));
    } catch (e: any) {
      console.error("Error reading assets.json:", e);
      return res.json({ default: true });
    }
  } else {
    return res.json({ default: true });
  }
});

// POST API to update/delete logo and signature assets and trigger global sync
app.post("/api/assets/update", (req, res) => {
  const assets = req.body;
  try {
    const uploadsDir = path.dirname(assetsPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2), "utf-8");
    
    // Broadcast the updated assets to all active accounts immediately
    broadcastAssetsUpdate(assets);
    
    return res.json({ success: true, message: "Assets saved and broadcasted successfully." });
  } catch (error: any) {
    console.error("Error saving assets:", error);
    return res.status(500).json({ error: "Failed to save assets on the server." });
  }
});

// GET endpoint for Server-Sent Events (SSE) synchronization stream
app.get("/api/assets/sync", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.flushHeaders();

  // Send an initial handshake event
  res.write("data: " + JSON.stringify({ type: "connected" }) + "\n\n");

  sseClients.push(res);

  // Set up keepalive interval to maintain connection alive across idle proxies or load balancers
  const keepAliveInterval = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    sseClients = sseClients.filter((client) => client !== res);
  });
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
