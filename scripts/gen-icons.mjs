// অ্যাপ আইকন তৈরি (কোনো লাইব্রেরি ছাড়াই PNG লেখে)
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  let o = 0
  for (let y = 0; y < height; y++) {
    raw[o++] = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      raw[o++] = pixels[i]
      raw[o++] = pixels[i + 1]
      raw[o++] = pixels[i + 2]
      raw[o++] = pixels[i + 3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// রঙ
const BG = [14, 122, 95]
const BG2 = [10, 92, 71]
const WHITE = [255, 255, 255]

function makeIcon(size) {
  const px = new Uint8Array(size * size * 4)
  const S = size

  // রাউন্ডেড বর্গ (corner radius)
  const r = S * 0.22

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4

      // রাউন্ডেড কর্নার বাইরে স্বচ্ছ
      const dx = Math.max(r - x, 0, x - (S - r))
      const dy = Math.max(r - y, 0, y - (S - r))
      if (dx * dx + dy * dy > r * r) {
        px[i + 3] = 0
        continue
      }

      // গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড
      const t = (x + y) / (2 * S)
      px[i] = BG[0] + (BG2[0] - BG[0]) * t
      px[i + 1] = BG[1] + (BG2[1] - BG[1]) * t
      px[i + 2] = BG[2] + (BG2[2] - BG[2]) * t
      px[i + 3] = 255
    }
  }

  const cx = S / 2
  const baseY = S * 0.72
  const domeR = S * 0.215
  const domeCy = S * 0.5

  // মসজিদ সিলুয়েট
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      if (px[i + 3] === 0) continue

      let inside = false

      // গম্বুজ
      const ddx = x - cx
      const ddy = y - domeCy
      if (ddx * ddx + ddy * ddy <= domeR * domeR) inside = true

      // মূল ভবন
      const bw = S * 0.31
      if (x >= cx - bw / 2 && x <= cx + bw / 2 && y >= domeCy && y <= baseY) inside = true

      // দরজা (কেটে ফেলা)
      const dw = S * 0.105
      const dh = S * 0.145
      if (
        x >= cx - dw / 2 &&
        x <= cx + dw / 2 &&
        y >= baseY - dh &&
        y <= baseY
      ) {
        inside = false
      }

      // চাঁদ (ডান পাশে ছোট বৃত্ত কেটে)
      const mx = S * 0.7
      const my = S * 0.28
      const mr = S * 0.085
      const mdx = x - mx
      const mdy = y - my
      if (mdx * mdx + mdy * mdy <= mr * mr) inside = true
      const m2x = x - (mx + S * 0.038)
      const m2y = y - (my - S * 0.012)
      if (m2x * m2x + m2y * m2y <= mr * mr * 0.86) inside = false

      if (inside) {
        px[i] = WHITE[0]
        px[i + 1] = WHITE[1]
        px[i + 2] = WHITE[2]
      }
    }
  }

  return png(S, S, px)
}

const out = path.resolve('public')
fs.mkdirSync(out, { recursive: true })
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(out, `icon-${size}.png`), makeIcon(size))
  console.log('✓', `public/icon-${size}.png`)
}
