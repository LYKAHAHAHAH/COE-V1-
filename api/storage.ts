import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const s3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_S3_BUCKET
);

let s3Client: S3Client | null = null;
if (s3Configured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Helper to ensure the local uploads directory exists
function ensureLocalUploadsDir() {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

function getExtension(mimeType: string): string {
  if (mimeType.includes("image/jpeg") || mimeType.includes("image/jpg")) return "jpg";
  if (mimeType.includes("image/gif")) return "gif";
  if (mimeType.includes("image/svg")) return "svg";
  if (mimeType.includes("image/webp")) return "webp";
  return "png"; // fallback
}

/**
 * Uploads a base64 encoded image to either AWS S3 or Local Disk storage.
 */
export async function uploadFile(
  base64Data: string,
  mimeType: string,
  type: string,
  hostUrl: string
): Promise<string> {
  const pureBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(pureBase64, "base64");
  const ext = getExtension(mimeType);
  const filename = `coe_${type}_${Date.now()}.${ext}`;

  if (s3Configured && s3Client) {
    const bucket = process.env.AWS_S3_BUCKET!;
    const region = process.env.AWS_REGION!;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    // Return absolute public S3 URL
    return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
  } else {
    // Local filesystem fallback
    ensureLocalUploadsDir();
    const filepath = path.join(LOCAL_UPLOADS_DIR, filename);
    await fs.promises.writeFile(filepath, buffer);
    
    // Build absolute host URL
    const cleanHost = hostUrl.replace(/\/$/, "");
    return `${cleanHost}/uploads/${filename}`;
  }
}

/**
 * Persists the centralized assets state.
 */
export async function saveCentralAssets(assets: any): Promise<void> {
  const configString = JSON.stringify(assets, null, 2);

  if (s3Configured && s3Client) {
    const bucket = process.env.AWS_S3_BUCKET!;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "assets_config.json",
        Body: configString,
        ContentType: "application/json",
      })
    );
  } else {
    ensureLocalUploadsDir();
    const configPath = path.join(LOCAL_UPLOADS_DIR, "assets_config.json");
    await fs.promises.writeFile(configPath, configString, "utf8");
  }
}

/**
 * Reads the centralized assets state.
 */
export async function getCentralAssets(): Promise<any | null> {
  if (s3Configured && s3Client) {
    const bucket = process.env.AWS_S3_BUCKET!;
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: "assets_config.json",
        })
      );
      if (response.Body) {
        const dataStr = await response.Body.transformToString();
        return JSON.parse(dataStr);
      }
    } catch (err: any) {
      if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      console.error("Error fetching assets_config.json from S3:", err);
    }
  } else {
    const configPath = path.join(LOCAL_UPLOADS_DIR, "assets_config.json");
    if (fs.existsSync(configPath)) {
      try {
        const dataStr = await fs.promises.readFile(configPath, "utf8");
        return JSON.parse(dataStr);
      } catch (err) {
        console.error("Error reading local assets_config.json:", err);
      }
    }
  }
  return null;
}
