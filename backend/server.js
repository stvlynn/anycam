import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import FormData from 'form-data'
import sharp from 'sharp'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Increase limit for base64 images

// Upload configuration (Memory storage for demo purposes)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const streetCache = new Map()

async function fetchStreetView(lat, lng, size, apiKey, ttlMs = 24 * 60 * 60 * 1000, timeoutMs = 2000) {
  if (!apiKey || lat == null || lng == null) return null
  const key = `streetview:${lat.toFixed(5)}:${lng.toFixed(5)}:${size}`
  const cached = streetCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.buffer
  const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&key=${apiKey}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer', signal: ctrl.signal })
    clearTimeout(timer)
    const buf = Buffer.from(resp.data)
    streetCache.set(key, { buffer: buf, expiresAt: Date.now() + ttlMs })
    return buf
  } catch {
    clearTimeout(timer)
    return null
  }
}

async function composeWithHeader(headerBuf, aiUrlOrData) {
  if (!headerBuf) return aiUrlOrData
  let aiBuf = null
  if (typeof aiUrlOrData === 'string' && aiUrlOrData.startsWith('data:')) {
    const m = aiUrlOrData.match(/^data:(.*?);base64,(.*)$/)
    aiBuf = m ? Buffer.from(m[2], 'base64') : null
  } else if (typeof aiUrlOrData === 'string') {
    const r = await axios.get(aiUrlOrData, { responseType: 'arraybuffer' })
    aiBuf = Buffer.from(r.data)
  }
  if (!aiBuf) return aiUrlOrData
  const headerResized = await sharp(headerBuf).resize({ width: 600, height: 300 }).toBuffer()
  const aiResized = await sharp(aiBuf).resize({ width: 600 }).toBuffer()
  const aiMeta = await sharp(aiResized).metadata()
  const height = 300 + (aiMeta.height || 0)
  const canvas = await sharp({ create: { width: 600, height, channels: 3, background: '#000000' } })
    .composite([
      { input: headerResized, top: 0, left: 0 },
      { input: aiResized, top: 300, left: 0 }
    ])
    .png()
    .toBuffer()
  return `data:image/png;base64,${canvas.toString('base64')}`
}

// Routes
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  // In a real app, we would upload to S3/Cloudinary here
  // For now, we'll just return a success since the frontend handles base64
  res.json({ 
    url: 'mock_url_for_now', 
    message: 'Upload successful' 
  })
})

app.post('/api/generate', async (req, res) => {
  try {
    const { photo, location, time } = req.body

    if (!photo || !location || !time) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const googleKey = process.env.GOOGLE_CLOUD_API_KEY
    const lat = location?.coords?.lat
    const lng = location?.coords?.lng
    const streetBuf = await fetchStreetView(lat, lng, '600x300', googleKey)
    const prompt = buildPrompt(location, time, !!streetBuf)
    
    // Call Nano Banana API (images/edits)
    const apiKey = process.env.NANO_BANANA_API_KEY
    const apiUrl = process.env.NANO_BANANA_API_URL || 'https://api.tu-zi.com/v1/images/edits'
    const modelName = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview'
    const responseFormat = (process.env.NANO_BANANA_RESPONSE_FORMAT || 'url').trim()
    const quality = (process.env.NANO_BANANA_QUALITY || '').trim()
    const size = (process.env.NANO_BANANA_SIZE || '').trim()
    const timeoutMs = Number(process.env.TIMEOUT_MS || 60000)
    const useMask = String(process.env.NANO_BANANA_USE_MASK || 'false').toLowerCase() === 'true'

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing NANO_BANANA_API_KEY' })
    }

    // Prepare image: convert Base64 (JPEG) to square PNG <= 4MB
    const dataUrlMatch = String(photo).match(/^data:(.*?);base64,(.*)$/)
    const photoBase64 = dataUrlMatch ? dataUrlMatch[2] : photo
    const inputBuffer = Buffer.from(photoBase64, 'base64')
    const [wStr, hStr] = size.split('x')
    const targetW = Math.max(1, parseInt(wStr || '1024', 10))
    const targetH = Math.max(1, parseInt(hStr || '1024', 10))
    const targetSize = Math.min(4096, Math.max(targetW, targetH))

    const pngBuffer = await sharp(inputBuffer)
      .resize({
        width: targetSize,
        height: targetSize,
        fit: 'cover',
        position: 'centre'
      })
      .png({ compressionLevel: 9 })
      .toBuffer()

    if (pngBuffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Invalid image payload: PNG exceeds 4MB' })
    }

    const form = new FormData()
    form.append('model', modelName)
    form.append('prompt', prompt)
    form.append('n', '1')
    form.append('response_format', responseFormat)
    if (quality) form.append('quality', quality)
    if (size) form.append('size', size)
    form.append('image', pngBuffer, { filename: 'source.png', contentType: 'image/png' })
    // Append street view as second image when available
    let streetPngBuffer = null
    if (streetBuf) {
      try {
        // keep requested resolution 600x300, convert to PNG
        streetPngBuffer = await sharp(streetBuf)
          .resize({ width: 600, height: 300 })
          .png({ compressionLevel: 9 })
          .toBuffer()
        form.append('image', streetPngBuffer, { filename: 'street.png', contentType: 'image/png' })
      } catch {}
    }
    if (useMask) {
      // Provide a full transparent mask to edit the entire image when source lacks alpha
      const maskBuffer = await sharp({
        create: {
          width: targetSize,
          height: targetSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .png({ compressionLevel: 9 })
        .toBuffer()
      form.append('mask', maskBuffer, { filename: 'mask.png', contentType: 'image/png' })
    }

    const reqMeta = {
      url: apiUrl,
      method: 'POST',
      model: modelName,
      response_format: responseFormat,
      quality: quality || null,
      size,
      timeout_ms: timeoutMs,
      use_mask: useMask,
      prompt_chars: prompt.length,
      location: { name: location.name, lat, lng },
      image_bytes: pngBuffer.length,
      street_image_bytes: streetPngBuffer ? streetPngBuffer.length : 0,
      form_fields: ['model','prompt','n','response_format'].concat(quality ? ['quality'] : []).concat(size ? ['size'] : []).concat(['image' + (streetPngBuffer ? '(2)' : '(1)')])
    }
    try { console.log(JSON.stringify({ event: 'generate_request', meta: reqMeta })) } catch {}

    const started = Date.now()
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: timeoutMs
    })

    const resultData = response.data
    const summarizeResult = (d) => {
      const summary = {}
      if (Array.isArray(d?.data)) {
        summary.data_count = d.data.length
        const first = d.data[0] || {}
        summary.first_url = typeof first.url === 'string' ? first.url : null
        summary.first_b64_len = typeof first.b64_json === 'string' ? first.b64_json.length : 0
      }
      if (typeof d?.created !== 'undefined') summary.created = d.created
      if (typeof d?.usage === 'object') summary.usage = d.usage
      return summary
    }
    try { console.log(JSON.stringify({ event: 'generate_response_upstream', meta: { status: response.status, headers: response.headers, summary: summarizeResult(resultData) } })) } catch {}
    let imageUrl = null
    let base64 = null

    // Primary parse for images/edits schema
    if (Array.isArray(resultData?.data)) {
      const first = resultData.data[0] || {}
      if (typeof first.url === 'string' && first.url.length) imageUrl = first.url
      if (!imageUrl && typeof first.b64_json === 'string' && first.b64_json.length) base64 = first.b64_json
    }

    // Secondary parse (generic fallbacks)
    if (!imageUrl && !base64 && typeof resultData?.image === 'string') {
      const v = resultData.image
      if (v.startsWith('data:')) base64 = v.replace(/^data:[^,]+,/, '')
      else if (/^https?:\/\//.test(v)) imageUrl = v
      else if (/^[A-Za-z0-9+/]+=*$/.test(v)) base64 = v
    }

    function walk(o) {
      if (!o || imageUrl || base64) return
      if (Array.isArray(o)) {
        for (const v of o) walk(v)
        return
      }
      if (typeof o === 'object') {
        for (const k in o) {
          const v = o[k]
          if (!imageUrl && k === 'url' && typeof v === 'string') {
            if (v.startsWith('data:')) base64 = v.replace(/^data:[^,]+,/, '')
            else if (/^https?:\/\//.test(v)) imageUrl = v
          }
          if (!base64 && (k === 'b64_json' || k === 'base64' || k === 'image_base64') && typeof v === 'string') base64 = v
          if (!imageUrl && k === 'image_url' && v && typeof v === 'object') {
            const vu = v.url
            const vd = v.data
            const vb = v.b64_json || v.base64 || v.image_base64
            if (typeof vu === 'string') {
              if (vu.startsWith('data:')) base64 = vu.replace(/^data:[^,]+,/, '')
              else if (/^https?:\/\//.test(vu)) imageUrl = vu
              else if (/^[A-Za-z0-9+/]+=*$/.test(vu)) base64 = vu
            }
            if (!imageUrl && !base64 && typeof vd === 'string') base64 = vd
            if (!imageUrl && !base64 && typeof vb === 'string') base64 = vb
          }
          walk(v)
        }
        return
      }
      if (typeof o === 'string' && !imageUrl && !base64) {
        if (o.startsWith('data:')) base64 = o.replace(/^data:[^,]+,/, '')
        else if (/^https?:\/\//.test(o)) imageUrl = o
        else if (/^[A-Za-z0-9+/]+=*$/.test(o)) base64 = o
      }
    }

    if (!imageUrl && !base64) walk(resultData)
    if (!imageUrl && base64) imageUrl = `data:image/png;base64,${base64}`

    const elapsedMs = Date.now() - started
    const generationTime = `${(elapsedMs/1000).toFixed(1)}s`

    if (!imageUrl) {
      const meta = {
        url: apiUrl,
        model: modelName,
        response_format: responseFormat,
        quality: quality || null,
        size,
        image_bytes: pngBuffer.length,
        street_image_bytes: streetPngBuffer ? streetPngBuffer.length : 0,
        prompt_chars: prompt.length,
        timeout_ms: timeoutMs
      }
      return res.status(502).json({ error: 'Invalid upstream response', generationTime, meta })
    }

    const finalUrl = imageUrl
    try { console.log(JSON.stringify({ event: 'generate_response_final', meta: { generationTime, final_image_type: 'url', final_image_length: finalUrl ? finalUrl.length : 0, streetview_status: streetBuf ? 'ok' : 'skipped' } })) } catch {}
    res.json({ imageUrl: finalUrl, generationTime, streetview: streetBuf ? { status: 'ok' } : { status: 'skipped' } })

  } catch (error) {
    const code = error.response?.status
    const details = error.response?.data || error.message
    const meta = {
      url: process.env.NANO_BANANA_API_URL || 'https://api.tu-zi.com/v1/images/edits',
      model: process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview',
      response_format: (process.env.NANO_BANANA_RESPONSE_FORMAT || 'url').trim(),
      quality: (process.env.NANO_BANANA_QUALITY || '').trim() || null,
      size: (process.env.NANO_BANANA_SIZE || '').trim(),
      timeout_ms: Number(process.env.TIMEOUT_MS || 60000),
      use_mask: String(process.env.NANO_BANANA_USE_MASK || 'false')
    }
    const upstream = {
      status: code,
      data: error.response?.data,
      headers: error.response?.headers
    }
    try {
      console.error(JSON.stringify({ event: 'nano_banana_error', meta, upstream }))
    } catch {}
    res.status(code === 400 ? 400 : 502).json({ error: 'Upstream generation failed', code, details, meta })
  }
})

function buildPrompt(location, time, hasStreetView) {
  const timeDescription = `${time.timeOfDay} on ${time.date}`
  const locationName = location.name
  const lat = location?.coords?.lat
  const lng = location?.coords?.lng
  const coordText = lat != null && lng != null ? ` (coordinates: ${lng.toFixed(5)}, ${lat.toFixed(5)})` : ''
  
  return `
    Create a photorealistic image of a person at ${locationName}, detailed location: ${coordText} during ${timeDescription}.
    ${hasStreetView ? 'Use the provided street view imagery as environmental reference for roads, buildings and lighting.' : ''}
    The person should match the style and appearance from the reference photo.
    The scene should capture the authentic atmosphere of ${locationName} at this time,
    including accurate lighting, weather conditions, and architectural details.
    Blend the person naturally into the environment.
  `
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
