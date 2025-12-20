import { createClient } from './client'

const BUCKET_NAME = 'equipos-fotos'

export interface UploadResult {
  url: string;
  path: string;
  error: Error | null;
}

/**
 * Sube una foto al bucket de Supabase Storage
 * @param file - Archivo a subir
 * @param sucursalId - ID de la sucursal
 * @param ordenId - ID de la orden de servicio
 * @returns URL pública, path y error si existe
 */
export async function uploadFotoEquipo(
  file: File,
  sucursalId: string,
  ordenId: string
): Promise<UploadResult> {
  try {
    const supabase = createClient()
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${sucursalId}/${ordenId}/foto_${timestamp}.${extension}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      return { url: '', path: '', error }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return { url: publicUrl, path: data.path, error: null }
  } catch (error) {
    return { url: '', path: '', error: error as Error }
  }
}

/**
 * Sube múltiples fotos en paralelo
 * @param files - Array de archivos
 * @param sucursalId - ID de la sucursal
 * @param ordenId - ID de la orden
 * @returns Array de resultados
 */
export async function uploadMultiplesFotos(
  files: File[],
  sucursalId: string,
  ordenId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file =>
    uploadFotoEquipo(file, sucursalId, ordenId)
  );

  return Promise.all(uploadPromises);
}

/**
 * Elimina una foto del storage
 * @param url - URL completa de la foto
 * @returns error si existe
 */
export async function deleteFotoEquipo(url: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const path = url.split(`${BUCKET_NAME}/`)[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Elimina una foto por path
 * @param path - Ruta del archivo en storage
 * @returns error si existe
 */
export async function deleteFotoByPath(path: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Elimina múltiples fotos
 * @param paths - Array de rutas de archivos
 * @returns error si existe
 */
export async function deleteMultiplesFotos(paths: string[]): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths)

    return { error }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Obtiene URL pública de una foto
 * @param path - Ruta del archivo
 * @returns URL pública
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient()

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return data.publicUrl
}
