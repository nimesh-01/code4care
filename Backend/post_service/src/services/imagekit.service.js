const ImageKit = require('imagekit')
const dotenv = require('dotenv')

dotenv.config()

if (
  !process.env.IMAGEKIT_PUBLIC_KEY ||
  !process.env.IMAGEKIT_PRIVATE_KEY ||
  !process.env.IMAGEKIT_URL_ENDPOINT
) {
  throw new Error('ImageKit environment variables are missing')
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

const uploadBuffer = (buffer, originalname = 'post.jpg', folder = 'posts', mimetype) => {
  return new Promise((resolve, reject) => {
    try {
      const base64 = buffer.toString('base64')
      const file = `data:${mimetype};base64,${base64}`

      imagekit.upload(
        {
          file,
          fileName: originalname,
          folder: folder.replace(/^\/+|\/+$/g, '').split('/').map(s => s.replace(/\s+/g, '_').toLowerCase()).join('/'),
        },
        (error, result) => {
          if (error) {
            console.error('ImageKit upload error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

const deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    imagekit.deleteFile(fileId, (error, result) => {
      if (error) {
        console.error('ImageKit delete error:', error)
        return reject(error)
      }
      resolve(result)
    })
  })
}

module.exports = { uploadBuffer, deleteFile }
