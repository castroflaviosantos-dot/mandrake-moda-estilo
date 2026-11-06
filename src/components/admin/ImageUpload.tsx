import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { IMAGE_ACCEPT, ImageUploadError, MAX_IMAGE_BYTES, uploadImageToBucket } from '@/lib/image-upload'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  max?: number
  bucket?: string
  folder?: string
  hint?: string
  allowUrl?: boolean
  /** Chamado a cada mudança de estado do envio (útil para bloquear o salvamento). */
  onBusyChange?: (busy: boolean) => void
}

const isHttp = (value: string) => /^https?:\/\//i.test(value)

export function ImageUpload({
  images,
  onChange,
  max = 4,
  bucket = 'product-images',
  folder = 'products',
  hint,
  allowUrl = true,
  onBusyChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState<Record<string, string>>({})
  const [url, setUrl] = useState('')

  const setBusyState = (value: boolean) => {
    setBusy(value)
    onBusyChange?.(value)
  }

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const slots = max - images.length
    if (slots <= 0) {
      toast.error(`Máximo de ${max} imagem(ns)`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const picked = Array.from(files).slice(0, slots)

    /* Prévia local imediata, antes do envio terminar. */
    const previews = new Map<string, string>()
    picked.forEach((file, index) => {
      const key = `${Date.now()}-${index}-${file.name}`
      previews.set(key, URL.createObjectURL(file))
    })
    setPending((prev) => ({ ...prev, ...Object.fromEntries(previews) }))
    setFailed({})
    setBusyState(true)

    const uploaded: string[] = []
    try {
      for (const [index, file] of picked.entries()) {
        try {
          const publicUrl = await uploadImageToBucket(file, bucket, folder)
          uploaded.push(publicUrl)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha no envio.'
          const key = `${Date.now()}-${index}-${file.name}`
          setFailed((prev) => ({ ...prev, [key]: message }))
          toast.error(message)
        }
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded].slice(0, max))
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`)
      } else if (picked.length > 0) {
        toast.error('Nenhuma imagem foi salva. Corrija o erro exibido abaixo e envie novamente.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no envio.')
    } finally {
      Object.values(Object.fromEntries(previews)).forEach((src) => URL.revokeObjectURL(src))
      setPending({})
      setBusyState(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const addUrl = () => {
    const clean = url.trim()
    if (!clean) return
    if (!isHttp(clean)) {
      toast.error('Informe uma URL válida começando com https://')
      return
    }
    if (images.length >= max) {
      toast.error(`Máximo de ${max} imagem(ns)`)
      return
    }
    onChange([...images, clean])
    setUrl('')
  }

  const pendingEntries = Object.entries(pending)
  const failedEntries = Object.entries(failed)

  return (
    <div className="space-y-2">
      <div className={cn('grid gap-2', max > 1 ? 'grid-cols-4' : 'grid-cols-1')}>
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={cn(
              'group relative overflow-hidden border border-border bg-secondary',
              max > 1 ? 'aspect-square' : 'aspect-[16/7]',
            )}
          >
            {isHttp(src) ? (
              <img src={src} alt={`Imagem ${i + 1}`} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center p-2 text-center text-[10px] text-muted-foreground">Imagem sem endereço válido</div>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              disabled={busy}
              className={cn(
                'absolute right-1 top-1 grid size-6 place-items-center bg-black/70 text-white transition-opacity',
                max > 1 ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
                busy && 'cursor-not-allowed opacity-40',
              )}
              aria-label="Remover imagem"
            >
              <X className="size-3" />
            </button>
            {i === 0 && max > 1 && <span className="absolute bottom-0 left-0 bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">Capa</span>}
          </div>
        ))}

        {pendingEntries.map(([key, src]) => (
          <div key={key} className={cn('relative overflow-hidden border border-dashed border-white/40 bg-secondary', max > 1 ? 'aspect-square' : 'aspect-[16/7]')}>
            <img src={src} alt="Enviando" className="size-full object-cover opacity-60" />
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] uppercase tracking-[0.14em] text-white">
              <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Enviando</span>
            </span>
          </div>
        ))}

        {images.length + pendingEntries.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              'grid place-items-center border border-dashed border-border text-muted-foreground transition-colors hover:border-white/50 hover:text-foreground',
              max > 1 ? 'aspect-square' : 'aspect-[16/7]',
              busy && 'cursor-wait opacity-60',
            )}
            aria-label="Enviar imagem"
          >
            {busy ? (
              <span className="flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"><Loader2 className="size-4 animate-spin" /> Enviando</span>
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"><ImagePlus className="size-4" /> {max > 1 ? 'Adicionar' : 'Escolher imagem'}</span>
            )}
          </button>
        )}
      </div>

      {failedEntries.length > 0 && (
        <div className="space-y-1 border border-destructive/50 bg-destructive/10 p-2 text-[11px] text-destructive">
          {failedEntries.map(([key, message]) => (
            <p key={key}>{message}</p>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={max > 1}
        hidden
        onChange={(e) => void upload(e.target.files)}
      />

      {allowUrl && (
        <div className="flex gap-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ou cole uma URL de imagem"
            className="h-9 flex-1 border border-border bg-background px-2 text-xs outline-none focus:border-white/50"
          />
          <button type="button" onClick={addUrl} disabled={busy} className="h-9 border border-border px-3 text-[10px] uppercase tracking-[0.12em] transition-colors hover:border-white/50 disabled:opacity-50">
            Adicionar
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {hint ?? `Até ${max} imagem(ns) · PNG, JPG, WEBP ou AVIF com no máximo ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`}
      </p>
      <p className="text-[10px] text-muted-foreground">A prévia aparece na hora; a imagem só é gravada depois que o envio termina.</p>
    </div>
  )
}

export { ImageUploadError }
