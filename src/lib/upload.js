import { supabase } from './supabase'
import { DEMO_MODE } from './db'

/** ছবি রাখার bucket (Supabase Storage) */
export const MEDIA_BUCKET = 'media'

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('ছবিটা পড়া যাচ্ছে না'))
    }
    img.src = url
  })
}

/**
 * বড় ছবি ছোট করে JPEG বানায় — Facebook-এর মতো দ্রুত আপলোডের জন্য।
 * ৯০০px-এর বেশি হলে ছোট করা হয়, তাই ৪–৫ MB ছবিও হালকা হয়ে যায়।
 */
export async function compressImage(file, { max = 900, quality = 0.82 } = {}) {
  if (!file.type?.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  try {
    const img = await loadImage(file)
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    return blob || file
  } catch {
    return file
  }
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('ছবিটা পড়া যাচ্ছে না'))
    reader.readAsDataURL(file)
  })
}

function friendly(error) {
  const msg = String(error?.message || error || '')
  if (msg.toLowerCase().includes('bucket not found'))
    return 'ছবি রাখার জায়গা (storage) তৈরি হয়নি — Supabase-এ supabase/storage.sql ফাইলটা একবার চালান'
  if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('unauthorized'))
    return 'ছবি আপলোডের অনুমতি নেই — supabase/storage.sql চালান, আর অ্যাডমিন হিসেবে লগইন করা আছে কিনা দেখুন'
  if (msg.toLowerCase().includes('exceeded') || msg.toLowerCase().includes('too large'))
    return 'ছবিটা অনেক বড় — ছোট ছবি দিয়ে চেষ্টা করুন'
  if (msg.toLowerCase().includes('mime') || msg.toLowerCase().includes('not supported'))
    return 'এই ধরনের ছবি চলবে না — JPG / PNG / WebP / GIF দিন'
  return msg || 'ছবি আপলোড হয়নি'
}

/**
 * ছবি আপলোড করে public URL ফেরত দেয়।
 * ডেমো মোডে ছবিটা সরাসরি data-URL হিসেবে সেভ হয়।
 */
export async function uploadImage(file, folder = 'avatars', madrasaId = 'general') {
  if (!file) throw new Error('কোনো ছবি বেছে নেওয়া হয়নি')

  if (DEMO_MODE) return await toDataUrl(file)
  if (!supabase) throw new Error('Supabase যুক্ত নেই')

  const blob = await compressImage(file)
  const isPng = blob.type === 'image/png'
  const ext = isPng ? 'png' : 'jpg'
  const safeFolder = String(folder).replace(/[^a-z0-9-]/gi, '') || 'avatars'
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = `${safeFolder}/${madrasaId}/${id}.${ext}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false
    })

  if (error) throw new Error(friendly(error))

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('ছবির লিংক পাওয়া যায়নি')
  return data.publicUrl
}
