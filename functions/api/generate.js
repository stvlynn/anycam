export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json()
    const { photo, location, time } = body || {}

    if (!photo || !location || !time) {
      return json({ error: 'Missing required fields' }, 400)
    }

    const googleKey = env.GOOGLE_CLOUD_API_KEY
    const lat = location?.coords?.lat
    const lng = location?.coords?.lng
    const streetBuf = await fetchStreetView(lat, lng, '600x300', googleKey)
    const prompt = buildPrompt(location, time, !!streetBuf)

    const apiKey = env.NANO_BANANA_API_KEY
    const apiUrl = env.NANO_BANANA_API_URL || 'https://api.tu-zi.com/v1/images/edits'
    const modelName = env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview'
    const responseFormat = String(env.NANO_BANANA_RESPONSE_FORMAT || 'url').trim()
    const quality = String(env.NANO_BANANA_QUALITY || '').trim()
    const size = String(env.NANO_BANANA_SIZE || '').trim()
    const timeoutMs = Number(env.TIMEOUT_MS || 60000)

    if (!apiKey) {
      return json({ error: 'Missing NANO_BANANA_API_KEY' }, 400)
    }

    const { buffer: imageBuf, contentType } = decodeDataUrl(photo)
    if (!imageBuf) {
      return json({ error: 'Invalid image payload' }, 400)
    }

    const form = new FormData()
    form.append('model', modelName)
    form.append('prompt', prompt)
    form.append('n', '1')
    form.append('response_format', responseFormat)
    if (quality) form.append('quality', quality)
    if (size) form.append('size', size)
    form.append('image', new Blob([imageBuf], { type: contentType || 'application/octet-stream' }), 'source')

    if (streetBuf) {
      form.append('image', new Blob([streetBuf], { type: 'image/png' }), 'street.png')
    }

    const started = Date.now()
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: form,
      cf: { timeout: timeoutMs }
    })

    if (!resp.ok) {
      const details = await safeJson(resp)
      return json({ error: 'Upstream generation failed', code: resp.status, details }, resp.status === 400 ? 400 : 502)
    }

    const data = await resp.json()
    const imageUrl = extractImageUrl(data)
    const elapsedMs = Date.now() - started
    const generationTime = `${(elapsedMs / 1000).toFixed(1)}s`

    if (!imageUrl) {
      const meta = { url: apiUrl, model: modelName, response_format: responseFormat, quality: quality || null, size }
      return json({ error: 'Invalid upstream response', generationTime, meta }, 502)
    }

    return json({ imageUrl, generationTime, streetview: streetBuf ? { status: 'ok' } : { status: 'skipped' } })
  } catch (err) {
    return json({ error: 'Unhandled server error', details: err?.message || String(err) }, 500)
  }
}

async function fetchStreetView(lat, lng, size, apiKey, timeoutMs = 2000) {
  try {
    if (!apiKey || lat == null || lng == null) return null
    const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&key=${apiKey}`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const buf = await r.arrayBuffer()
    return buf
  } catch {
    return null
  }
}

function buildPrompt(location, time, hasStreetView) {
  const timeDescription = `${time.timeOfDay} on ${time.date}`
  const locationName = location?.name
  const lat = location?.coords?.lat
  const lng = location?.coords?.lng
  const coordText = lat != null && lng != null ? ` (coordinates: ${Number(lng).toFixed(5)}, ${Number(lat).toFixed(5)})` : ''
  return `\n    Create a photorealistic image of a person at ${locationName}, detailed location: ${coordText} during ${timeDescription}.\n    ${hasStreetView ? 'Use the provided street view imagery as environmental reference for roads, buildings and lighting.' : ''}\n    The person should match the style and appearance from the reference photo.\n    The scene should capture the authentic atmosphere of ${locationName} at this time,\n    including accurate lighting, weather conditions, and architectural details.\n    Blend the person naturally into the environment.\n  `
}

function decodeDataUrl(dataUrlOrBase64) {
  try {
    const s = String(dataUrlOrBase64)
    const m = s.match(/^data:(.*?);base64,(.*)$/)
    if (m) {
      const mime = m[1] || 'application/octet-stream'
      const base64 = m[2] || ''
      return { buffer: base64ToUint8(base64), contentType: mime }
    }
    // raw base64 png/jpeg
    if (/^[A-Za-z0-9+/]+=*$/.test(s)) {
      return { buffer: base64ToUint8(s), contentType: 'application/octet-stream' }
    }
    return { buffer: null, contentType: null }
  } catch {
    return { buffer: null, contentType: null }
  }
}

function base64ToUint8(b64) {
  const bin = atob(b64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function extractImageUrl(d) {
  let imageUrl = null
  let base64 = null
  if (Array.isArray(d?.data)) {
    const first = d.data[0] || {}
    if (typeof first.url === 'string' && first.url.length) imageUrl = first.url
    if (!imageUrl && typeof first.b64_json === 'string' && first.b64_json.length) base64 = first.b64_json
  }
  if (!imageUrl && !base64 && typeof d?.image === 'string') {
    const v = d.image
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
          else if (/^[A-Za-z0-9+/]+=*$/.test(v)) base64 = v
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
  if (!imageUrl && !base64) walk(d)
  if (!imageUrl && base64) imageUrl = `data:image/png;base64,${base64}`
  return imageUrl
}

async function safeJson(resp) {
  try { return await resp.json() } catch { return await resp.text().catch(() => null) }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}

