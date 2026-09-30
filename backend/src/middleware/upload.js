const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// memoryStorage keeps the file in req.file.buffer; the controller
// then saves the bytes into the MenuItem document in MongoDB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Only JPEG, PNG or WEBP images are allowed'));
  },
});

// Field name used by the mobile app's FormData
module.exports = upload.single('image');
