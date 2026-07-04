import type { UploadSignature } from '../types';

/**
 * Uploads a local image URI directly to Cloudinary using a short-lived signature
 * obtained from our backend (POST /uploads/signature). The Cloudinary API secret
 * never touches the client — only the signed, time-boxed params do.
 */
export async function uploadImageToCloudinary(localUri: string, sig: UploadSignature): Promise<string> {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('file', { uri: localUri, name: filename, type: mimeType } as unknown as Blob);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const response = await fetch(sig.uploadUrl, { method: 'POST', body: formData });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Image upload failed');
  }
  return data.secure_url as string;
}
