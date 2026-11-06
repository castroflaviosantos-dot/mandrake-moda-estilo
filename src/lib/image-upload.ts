import { supabase, isSupabaseEnabled, currentAccessToken } from '@/lib/supabase'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif'

const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif'])

export class ImageUploadError extends Error {}

/*
 * Envio de imagem para o Storage do Supabase.
 * O caminho no bucket é <folder>/<id-aleatório>.<ext>, sem depender de cache HTTP.
 * Lança ImageUploadError com mensagem pronta para o usuário.
 */
export async function uploadImageToBucket(file: File, bucket: string, folder: string): Promise<string> {
  if (!isSupabaseEnabled || !supabase) {
    throw new ImageUploadError('Envio de arquivos indisponível: conexão com o banco não configurada.')
  }
  if (!file.size) throw new ImageUploadError(`${file.name}: arquivo vazio.`)
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError(`${file.name}: máximo de 5 MB.`)

  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  if (!ALLOWED_EXT.has(ext)) throw new ImageUploadError(`${file.name}: use PNG, JPG, WEBP ou AVIF.`)

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${folder}/${safeName}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })

  if (error) {
    const detail = error.message || 'erro desconhecido'
    if (/bucket|not found/i.test(detail)) {
      throw new ImageUploadError(`Armazenamento "${bucket}" não encontrado no Supabase. Crie o bucket público "${bucket}".`)
    }
    if (/policy|permission|denied|unauthorized|jwt|row-level|not authorized/i.test(detail)) {
      throw new ImageUploadError(
        currentAccessToken()
          ? `O banco recusou o envio (${detail}). Confirme a permissão de envio do bucket "${bucket}" para administradores.`
          : `Sessão de administrador expirada (${detail}). Saia e entre novamente no painel para enviar imagens.`,
      )
    }
    if (/mime|content[- ]type|type/i.test(detail)) {
      throw new ImageUploadError(`Formato não aceito pelo armazenamento (${detail}). Use PNG, JPG, WEBP ou AVIF.`)
    }
    if (/size|too large|exceeded/i.test(detail)) {
      throw new ImageUploadError(`A imagem excede o limite do armazenamento (${detail}).`)
    }
    throw new ImageUploadError(`Falha no envio: ${detail}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  const publicUrl = data.publicUrl
  if (!publicUrl) throw new ImageUploadError('O arquivo subiu, mas a URL pública não foi gerada. Confira se o bucket é público.')
  return publicUrl
}
