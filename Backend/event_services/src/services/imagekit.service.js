const ImageKit = require("imagekit");
const dotenv = require("dotenv");

dotenv.config();

let imagekit = null;

if (
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

const normalizeFolder = (folder = '') => {
  if (!folder) return '';
  return String(folder)
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map(seg => seg.replace(/\s+/g, '_').toLowerCase())
    .join('/');
};

const uploadBuffer = (buffer, originalname = 'image.jpg', folder = 'events', mimetype) => {
  if (!imagekit) return Promise.reject(new Error('ImageKit is not configured'));
  return new Promise((resolve, reject) => {
    try {
      const base64 = buffer.toString('base64');
      const file = `data:${mimetype};base64,${base64}`;
      const normalizedFolder = normalizeFolder(folder || 'events');
      imagekit.upload(
        { file, fileName: originalname, folder: normalizedFolder },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

const deleteFile = async (fileId) => {
  if (!imagekit) return;
  return new Promise((resolve, reject) => {
    imagekit.deleteFile(fileId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

module.exports = { uploadBuffer, deleteFile };
