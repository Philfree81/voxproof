import multer from 'multer'

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/flac',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`))
    }
  },
})
