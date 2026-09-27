export interface WebPConversionResult {
  file: File
  blob: Blob
  dataUrl: string
  filename: string
  originalSize: number
  convertedSize: number
}

export async function convertImageToWebP(
  inputFile: File,
  quality = 0.85,
  maxWidth = 1920,
  maxHeight = 1920
): Promise<WebPConversionResult> {
  return new Promise((resolve, reject) => {
    if (!inputFile.type.startsWith("image/")) {
      return reject(new Error("File yang dipilih bukan gambar valid."))
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          return reject(new Error("Gagal menginisialisasi canvas untuk konversi."))
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Gagal mengonversi gambar ke format WebP."))
            }

            const cleanBaseName = inputFile.name.replace(/\.[^/.]+$/, "")
            const webpFilename = `${cleanBaseName}.webp`

            const webpFile = new File([blob], webpFilename, {
              type: "image/webp",
              lastModified: Date.now(),
            })

            const dataUrl = canvas.toDataURL("image/webp", quality)

            resolve({
              file: webpFile,
              blob,
              dataUrl,
              filename: webpFilename,
              originalSize: inputFile.size,
              convertedSize: blob.size,
            })
          },
          "image/webp",
          quality
        )
      }

      img.onerror = () => {
        reject(new Error("Gagal membaca file gambar."))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error("Gagal membuka file dari perangkat."))
    }

    reader.readAsDataURL(inputFile)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

