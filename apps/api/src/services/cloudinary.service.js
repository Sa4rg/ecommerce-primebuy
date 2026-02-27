const cloudinary = require("cloudinary").v2;

function ensureCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

function uploadBuffer(buffer, options = {}) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "products",
        resource_type: "image",
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    stream.end(buffer);
  });
}

async function deleteByPublicId(publicId) {
  ensureCloudinaryConfigured();
  if (!publicId) return true;
  // cloudinary devuelve { result: "ok" } o "not found"
  const res = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  return res;
}

module.exports = {
  uploadBuffer,
  deleteByPublicId,
};