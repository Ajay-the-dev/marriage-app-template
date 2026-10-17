// Image uploads go straight from the browser to Cloudinary using an
// *unsigned* upload preset (no API secret in the app). Configure the preset
// in Cloudinary console → Settings → Upload → Upload presets.
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = !!(cloudName && uploadPreset)

const MAX_DIMENSION = 1920
const QUALITY = 0.82

// Resize + re-encode to WebP before upload. Phone photos usually drop from
// several MB to a few hundred KB, which keeps us inside the free tier.
export const compressImage = async (file) => {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

// Serve every image as the best format/quality for the viewer's browser
const optimizedUrl = (url) => url.replace('/image/upload/', '/image/upload/f_auto,q_auto/')

// Uploads an image into weddings/<uid>/<key> and returns its delivery URL
export const uploadImage = async (file, { uid, key }) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured (see .env.example)')
  }
  // Every image lives under its owner's folder, never a shared one
  if (!uid) throw new Error('Please sign in again to upload images')
  const body = new FormData()
  body.append('file', await compressImage(file))
  body.append('upload_preset', uploadPreset)
  body.append('folder', `weddings/${uid}/${key}`)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error?.message || `Upload failed (${res.status})`)
  return optimizedUrl(data.secure_url)
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

// Uploads a PDF into weddings/<uid>/<key> as a raw file (kept exactly as it is) and returns its URL.
// New Cloudinary accounts block PDF delivery: enable
// Settings → Security → "Allow delivery of PDF and ZIP files".
export const uploadDocument = async (file, { uid, key }) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured (see .env.example)')
  }
  if (!uid) throw new Error('Please sign in again to upload files')
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('The PDF is larger than 10 MB')
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', uploadPreset)
  body.append('folder', `weddings/${uid}/${key}`)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error?.message || `Upload failed (${res.status})`)
  return data.secure_url
}

// A Cloudinary link that downloads the file instead of opening it
export const downloadUrl = (url) => (url.includes('res.cloudinary.com/') ? url.replace('/upload/', '/upload/fl_attachment/') : url)
