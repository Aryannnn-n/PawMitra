import { v2 as cloudinary } from 'cloudinary';

// ! -> Non-null assertion
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ── Generate signed upload params for client-side direct upload ──────────────
// Frontend requests this first, then uploads directly to Cloudinary.
// Backend never touches the image file — zero server load.
export const generateUploadSignature = (folder = 'pawmitra/pets') => {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string,
  );

  return {
    timestamp,
    signature,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
};

// ── Delete image from Cloudinary when pet is deleted ─────────────────────────
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete failed for publicId:', publicId, err);
  }
};
