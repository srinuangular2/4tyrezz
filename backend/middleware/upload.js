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

  const fileFilter = (req, file, cb) => {
    if (subfolder === 'kyc') {
      const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
      if (!ok) return cb(new Error('Only PDF, JPG and PNG files are allowed (max 5MB)'));
      return cb(null, true);
    }
    if (subfolder === 'bulk') {
      const name = String(file.originalname || '').toLowerCase();
      const ok = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.txt');
      if (!ok) return cb(new Error('Upload a CSV or Excel file'));
      return cb(null, true);
    }
    return cb(null, true);
  };

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

module.exports = {
  uploadCarImages: makeUploader('cars'),
  uploadBrandLogo: makeUploader('brands'),
  uploadBannerImage: makeUploader('banners'),
  uploadKycDocument: makeUploader('kyc'),
  uploadBulkInventory: makeUploader('bulk'),
  uploadAvatar: makeUploader('avatars'),
  uploadSellPhotos: makeUploader('sell'),
};