/**
 * Media upload abstraction: local disk paths today, Cloudinary when configured.
 */
const path = require('path');

const cloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

function localUrl(filename, folder = 'cars') {
  return `/uploads/${folder}/${filename}`;
}

async function uploadBuffer({ buffer, folder = 'cars', filename, mimetype }) {
  if (!cloudinaryConfigured()) {
    // Multer already wrote to disk — caller passes relative path
    return {
      url: localUrl(filename, folder),
      provider: 'local',
      stub: !cloudinaryConfigured(),
    };
  }

  // Lazy require so missing SDK doesn't break local mode
  let cloudinary;
  try {
    cloudinary = require('cloudinary').v2;
  } catch {
    return { url: localUrl(filename, folder), provider: 'local-fallback', stub: true };
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `4tyrezz/${folder}`, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, provider: 'cloudinary', stub: false, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

function resolvePublicUrl(storedPath) {
  if (!storedPath) return '';
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}${storedPath.startsWith('/') ? '' : '/'}${storedPath}`;
}

module.exports = {
  cloudinaryConfigured,
  uploadBuffer,
  localUrl,
  resolvePublicUrl,
};
