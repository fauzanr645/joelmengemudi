import { NextResponse } from "next/server"
import { auth } from "@/auth"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Maksimal ukuran file upload: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Validasi Magic Numbers / Bytes untuk format gambar yang diizinkan
function isValidImageBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false

  // 1. WebP: Bytes 0-3 = "RIFF", Bytes 8-11 = "WEBP"
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50

  // 2. JPEG / JPG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

  // 3. PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a

  return isWebp || isJpeg || isPng
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate Limiting: Maksimal 15 upload per menit per pengguna
    const clientKey = `upload:${session.user.id || getClientIp(request)}`
    const rateLimit = checkRateLimit(clientKey, 15, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan upload. Harap tunggu beberapa saat sebelum mencoba kembali." },
        { status: 429 }
      )
    }

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const contentType = request.headers.get("content-type") || ""
    let fileBuffer: Buffer | null = null
    let baseName = "bukti"

    // 1. Handle JSON Payload with Base64 DataURL
    if (contentType.includes("application/json")) {
      const body = await request.json()
      const { dataUrl, filename } = body

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Data gambar tidak ditemukan" }, { status: 400 })
      }

      // Format: "data:image/webp;base64,....."
      const matches = dataUrl.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { error: "Format base64 tidak valid atau bukan bertipe gambar" },
          { status: 400 }
        )
      }

      fileBuffer = Buffer.from(matches[2], "base64")
      if (filename && typeof filename === "string") {
        baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "") || "bukti"
      }
    } else {
      // 2. Handle Multipart FormData
      const formData = await request.formData()
      const file = (formData.get("file") || formData.get("image")) as File | null

      if (!file) {
        return NextResponse.json({ error: "File gambar tidak ditemukan dalam request" }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      fileBuffer = Buffer.from(bytes)

      if (file.name) {
        baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "") || "bukti"
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "File kosong atau tidak dapat dibaca" }, { status: 400 })
    }

    // Periksa Batas Ukuran File (Max 5 MB)
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 5 MB" },
        { status: 413 }
      )
    }

    // Validasi Signature / Magic Bytes Asli File (Cegah upload file berbahaya bertopeng gambar)
    if (!isValidImageBytes(fileBuffer)) {
      return NextResponse.json(
        { error: "File yang diunggah bukan format gambar valid (hanya WebP, JPG, PNG yang diizinkan)" },
        { status: 400 }
      )
    }

    // Buat nama file aman dengan UUID / random bytes acak (Mencegah Directory Traversal & Overwrite)
    const randomSuffix = crypto.randomBytes(8).toString("hex")
    const cleanFilename = `upload-${baseName.substring(0, 30)}-${Date.now()}-${randomSuffix}.webp`
    const targetFilePath = path.join(uploadsDir, cleanFilename)

    // Validasi Path Traversal: pastikan target file berada di dalam uploadsDir
    if (!targetFilePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Upaya direktori ilegal terdeteksi" }, { status: 400 })
    }

    fs.writeFileSync(targetFilePath, fileBuffer)

    return NextResponse.json({
      url: `/uploads/${cleanFilename}`,
      filename: cleanFilename,
      size: fileBuffer.length,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Gagal memproses file upload" }, { status: 500 })
  }
}
