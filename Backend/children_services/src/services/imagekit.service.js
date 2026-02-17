
const ImageKit = require("imagekit");
const dotenv = require("dotenv");

dotenv.config();

if (
  !process.env.IMAGEKIT_PUBLIC_KEY ||
  !process.env.IMAGEKIT_PRIVATE_KEY ||
  !process.env.IMAGEKIT_URL_ENDPOINT
) {
  throw new Error("❌ ImageKit environment variables are missing");
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const normalizeFolder = (folder = '') => {
  if (!folder) return '';
  // remove leading/trailing slashes and normalize segments
  return String(folder)
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map(seg => seg.replace(/\s+/g, '_').toLowerCase())
    .join('/');
};

const uploadBuffer = (buffer, originalname = 'document.jpg', folder = 'documents', mimetype) => {
  return new Promise((resolve, reject) => {
    try {
      const base64 = buffer.toString('base64');
      const file = `data:${mimetype};base64,${base64}`;
      const normalizedFolder = normalizeFolder(folder || 'documents');

      imagekit.upload(
        {
          file,
          fileName: originalname,
          folder: normalizedFolder,
        },
        (error, result) => {
          if (error) {
            console.error('❌ ImageKit upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};


const getFileDetails = (fileId) => {
  return new Promise((resolve, reject) => {
    imagekit.getFileDetails(fileId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const listFiles = (opts = {}) => {
  return new Promise((resolve, reject) => {
    imagekit.listFiles(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const deleteFolderIfEmpty = async (folder) => {
  if (!folder) return;
  const normalized = normalizeFolder(folder);
  try {
    // try both param names 'path' and 'folder' to be robust against SDK versions
    let list = await listFiles({ path: `/${normalized}`, limit: 1 }).catch(() => null);
    if (!list) list = await listFiles({ folder: normalized, limit: 1 }).catch(() => null);
    const total = list?.totalCount ?? (Array.isArray(list?.files) ? list.files.length : undefined);
    if (total === 0 || total === undefined) {
      if (typeof imagekit.deleteFolder === 'function') {
        return new Promise((resolve, reject) => {
          imagekit.deleteFolder(`/${normalized}`, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      }
    }
  } catch (e) {
    // non-fatal: folder deletion best-effort
    console.warn('deleteFolderIfEmpty warning:', e.message || e);
  }
};

const deleteFile = async (fileId) => {
  try {
    // fetch file details first to determine its folder
    let details;
    try {
      details = await getFileDetails(fileId);
    } catch (e) {
      // continue: deletion may still succeed without details
      details = null;
    }

    const deleted = await new Promise((resolve, reject) => {
      imagekit.deleteFile(fileId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    // attempt to remove parent folder if empty
    try {
      const filePath = details?.filePath || details?.path || deleted?.filePath || deleted?.path;
      const folder = filePath ? filePath.replace(/\/[^\/]+$/, '') : null;
      await deleteFolderIfEmpty(folder);
    } catch (e) {
      // non-fatal
      console.warn('post-delete folder cleanup failed:', e.message || e);
    }

    return deleted;
  } catch (err) {
    console.error('❌ ImageKit delete error:', err);
    throw err;
  }
};



module.exports = { uploadBuffer, deleteFile }
