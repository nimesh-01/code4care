const multer = require('multer')

// Store files in memory for streaming to cloud storage
const storage = multer.memoryStorage()

const ALLOWED_TYPES = ['image/', 'video/']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (for videos)

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.some(type => file.mimetype.startsWith(type))) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files are allowed'), false)
    }
  }
})

module.exports = upload
