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
      const ok = /\.(csv|tsv|txt|xlsx|xls|xlsm|xlsb|ods|xml)$/.test(name);
      if (!ok) return cb(new Error('Upload a spreadsheet: CSV, Excel, ODS or TSV'));
      return cb(null, true);
    }
    return cb(null, true);
  };

  const maxBytes = subfolder === 'bulk' ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
  return multer({ storage, fileFilter, limits: { fileSize: maxBytes } });
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