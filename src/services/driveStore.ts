/**
 * Google Drive API Client Store Service
 */

/**
 * Searches for a file in Google Drive by name.
 */
export async function searchConfigFile(accessToken: string, name: string = "coe_assets_config.json"): Promise<string | null> {
  try {
    const query = encodeURIComponent(`name = '${name}' and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed to search config file in Google Drive:", text);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  } catch (err) {
    console.error("Error searching in Google Drive:", err);
  }
  return null;
}

/**
 * Creates a new file in Google Drive and uploads its initial JSON content.
 */
export async function createConfigFile(accessToken: string, content: any, name: string = "coe_assets_config.json"): Promise<string> {
  // Step 1: Create the file metadata
  const metadataResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/json",
    }),
  });

  if (!metadataResponse.ok) {
    const text = await metadataResponse.text();
    throw new Error(`Failed to create metadata in Google Drive: ${text}`);
  }

  const fileData = await metadataResponse.json();
  const fileId = fileData.id;

  // Step 2: Upload the JSON content to the created file ID
  await updateConfigFile(accessToken, fileId, content);

  return fileId;
}

/**
 * Updates an existing file content in Google Drive.
 */
export async function updateConfigFile(accessToken: string, fileId: string, content: any): Promise<void> {
  const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content, null, 2),
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Failed to upload content to Google Drive: ${text}`);
  }
}

/**
 * Reads a JSON file content from Google Drive.
 */
export async function readConfigFile(accessToken: string, fileId: string): Promise<any> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to read file content from Google Drive: ${text}`);
  }

  return await response.json();
}

/**
 * Uploads an image File object to Google Drive and sets public access permission so it can render consistently on any device.
 */
export async function uploadImageToDrive(file: File, accessToken: string): Promise<string> {
  // Step 1: Create metadata
  const metadata = {
    name: `coe_asset_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`,
    mimeType: file.type,
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", file);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${errText}`);
  }

  const uploadData = await uploadRes.json();
  const fileId = uploadData.id;

  // Step 2: Update file permissions to public "reader" so anyone can print/view the image
  const permissionRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    }
  );

  if (!permissionRes.ok) {
    const errText = await permissionRes.text();
    console.warn("Failed to apply public reader permission directly, rendering might require auth session context:", errText);
  }

  // Step 3: Return the standard direct-accessible link for rendering
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
