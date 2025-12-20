import { MAX_FILE_SIZE } from '../constants'

export async function compressImage(file: File, maxSizeKB: number = 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calcular nuevas dimensiones manteniendo aspect ratio
        const maxDimension = 1920
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        // Comprimir con calidad ajustable
        let quality = 0.9
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir imagen'))
                return
              }

              // Si el archivo es más pequeño que el límite, devolver
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                // Reducir calidad y volver a intentar
                quality -= 0.1
                compress()
              }
            },
            'image/jpeg',
            quality
          )
        }

        compress()
      }

      img.onerror = () => reject(new Error('Error al cargar imagen'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Error al leer archivo'))
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de imagen no válido. Solo se permiten JPG, PNG y WEBP.',
    }
  }

  if (file.size > MAX_FILE_SIZE * 5) { // 5MB antes de comprimir
    return {
      valid: false,
      error: 'La imagen es demasiado grande. Máximo 5MB.',
    }
  }

  return { valid: true }
}
