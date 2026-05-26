const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_KEY &&
    process.env.CLOUDINARY_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });
}

const storage = cloudinaryEnabled
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'Outdoorsy',
        allowedFormats: ['jpeg', 'png', 'jpg'],
      },
    })
  : multer.memoryStorage();

module.exports = {
  cloudinary,
  cloudinaryEnabled,
  storage,
};
