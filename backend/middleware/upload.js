// const multer = require('multer');
// const path = require('path');

// const makeUploader = (subfolder) => {
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', subfolder)),
//     filename: (req, file, cb) => {
//       const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       cb(null, unique + path.extname(file.originalname));
//     },
//   });
//   return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
// };

// module.exports = { uploadCarImages: makeUploader('cars'), uploadBrandLogo: makeUploader('brands'), uploadBannerImage: makeUploader('banners') };


const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeUploader = (subfolder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', subfolder);

      // Auto-create folder if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
};

module.exports = {
  uploadCarImages: makeUploader('cars'),
  uploadBrandLogo: makeUploader('brands'),
  uploadBannerImage: makeUploader('banners'),
};