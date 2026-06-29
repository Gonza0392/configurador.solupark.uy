/**
 * Procesa las PNG originales del catálogo GLG6000:
 *  1. Detecta el color de fondo en las 4 esquinas (promedio).
 *  2. Flood-fill desde los bordes → alpha=0 en todo lo que sea fondo.
 *  3. Recorta al bounding box de píxeles opacos.
 *  4. Resize al tamaño target de cada SKU (fit:'fill' fuerza aspect exacto).
 *  5. Guarda PNG-32 con alpha real en public/catalog/glg6000/.
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const TARGETS = {
  GLG6001: { w: 1360, h:  700 },
  GLG6002: { w: 1200, h: 4000 },
  GLG6003: { w: 1360, h: 1820 },
  GLG6004: { w: 1360, h: 1820 },
  GLG6005: { w: 1360, h: 1820 },
  GLG6006: { w: 2104, h: 1210 },
  GLG6007: { w: 2104, h: 1210 },
  GLG6011: { w: 1360, h: 1820 },
  GLG6012: { w: 1316, h: 1790 },
  GLG6013: { w: 1830, h: 4000 },
}

const TOLERANCE_DEFAULT = 38        // RGB distance threshold (Euclidean) for "background"
const TOLERANCE_PER_SKU = {
  GLG6003: 90,   // GPT regen, had gradient bg
  GLG6012: 110,  // anti-alias edge between black cabinet and white bg (wood top is far enough at d~147)
}
const ROOT = 'C:/Users/gonza/solupark-modulos'
const SRC_DIR = path.join(ROOT, 'public/catalog/glg6000/_originals')
const DST_DIR = path.join(ROOT, 'public/catalog/glg6000')

async function processOne(sku, target) {
  const srcPath = path.join(SRC_DIR, `${sku}.png`)
  if (!fs.existsSync(srcPath)) return { sku, status: 'SKIP (no source)' }

  const { data: rawBuf, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width, H = info.height, CH = info.channels
  const data = Buffer.from(rawBuf) // mutable copy

  // --- Detect bg color from 4 corners (avg) ---
  const at = (x, y) => {
    const i = (y * W + x) * CH
    return [data[i], data[i + 1], data[i + 2]]
  }
  const corners = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)]
  const bgR = Math.round(corners.reduce((s, c) => s + c[0], 0) / 4)
  const bgG = Math.round(corners.reduce((s, c) => s + c[1], 0) / 4)
  const bgB = Math.round(corners.reduce((s, c) => s + c[2], 0) / 4)
  const TOL = TOLERANCE_PER_SKU[sku] ?? TOLERANCE_DEFAULT
  const t2 = TOL * TOL * 3
  const isBg = (r, g, b) => {
    const dr = r - bgR, dg = g - bgG, db = b - bgB
    return dr * dr + dg * dg + db * db <= t2
  }

  // --- Flood fill from boundary ---
  const visited = new Uint8Array(W * H)
  const stack = []
  const pushIfBg = (x, y) => {
    const p = y * W + x
    if (visited[p]) return
    const i = p * CH
    if (isBg(data[i], data[i + 1], data[i + 2])) { visited[p] = 1; stack.push(p) }
  }
  for (let x = 0; x < W; x++) { pushIfBg(x, 0); pushIfBg(x, H - 1) }
  for (let y = 0; y < H; y++) { pushIfBg(0, y); pushIfBg(W - 1, y) }
  while (stack.length) {
    const p = stack.pop()
    const x = p % W, y = (p - x) / W
    if (x > 0)     pushIfBg(x - 1, y)
    if (x < W - 1) pushIfBg(x + 1, y)
    if (y > 0)     pushIfBg(x, y - 1)
    if (y < H - 1) pushIfBg(x, y + 1)
  }

  // --- Apply alpha=0 to flooded pixels ---
  let cleared = 0
  for (let p = 0; p < W * H; p++) {
    if (visited[p]) { data[p * CH + 3] = 0; cleared++ }
  }

  // --- BBox of opaque pixels (alpha > 32) ---
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * CH + 3] > 32) {
        if (x < minX) minX = x; if (y < minY) minY = y
        if (x > maxX) maxX = x; if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { sku, status: 'ERROR (no opaque pixels)' }

  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  const cropAR = (cropW / cropH).toFixed(4)
  const targetAR = (target.w / target.h).toFixed(4)

  // Sharp pipeline: raw RGBA → extract bbox → resize fit:'fill' (forces exact aspect) → PNG
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize(target.w, target.h, { fit: 'fill', kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(DST_DIR, `${sku}.png`))

  return {
    sku,
    bg: `rgb(${bgR},${bgG},${bgB})`,
    src: `${W}×${H}`,
    cleared: `${((cleared / (W * H)) * 100).toFixed(1)}%`,
    crop: `${cropW}×${cropH} (ar ${cropAR})`,
    out: `${target.w}×${target.h} (ar ${targetAR})`,
    status: 'OK',
  }
}

;(async () => {
  const results = []
  for (const [sku, target] of Object.entries(TARGETS)) {
    try { results.push(await processOne(sku, target)) }
    catch (e) { results.push({ sku, status: 'CRASH', error: String(e.message || e) }) }
  }
  console.table(results)
})()
