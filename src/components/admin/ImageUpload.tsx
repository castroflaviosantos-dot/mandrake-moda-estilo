import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  max?: number
  bucket?: string
  folder?: string
  hint?: string
  allowUrl?: boolean
}

export function ImageUpload({
  images,
  onChange,
  max = 4,
  bucket = 'product-images',
  folder = 'products',
  hint,
  allowUrl = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState('')

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!isSupabaseEnabled) {
      toast.error('Envio de arquivos indisponível no modo demonstração. Use uma URL.')
      return
    }
    if (images.length >= max) {
      toast.error(`Máximo de ${max} imagem(ns)`)
      return
    }
    setBusy(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, max - images.length)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: máximo de 5 MB`)
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false })
        if (error) {
          toast.error(`Falha no envio: ${error.message}`)
          continue
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }
      if (uploaded.length) {
        onChange([...images, ...uploaded].slice(0, max))
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`)
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const addUrl = () => {
    const clean = url.trim()
    if (!clean) return
    if (images.length >= max) {
      toast.error(`Máximo de ${max} imagem(ns)`)
      return
    }
    onChange([...images, clean])
    setUrl('')
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative aspect-square overflow-hidden border border-border bg-secondary">
            <img src={src} alt={`Imagem ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 grid size-6 place-items-center bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover imagem"
            >
              <X className="size-3" />
            </button>
            {i === 0 && max > 1 && <span className="absolute bottom-0 left-0 bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">Capa</span>}
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn('grid aspect-square place-items-center border border-dashed border-border text-muted-foreground transition-colors hover:border-white/50 hover:text-foreground', busy && 'opacity-60')}
            aria-label="Enviar imagem"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple={max > 1} hidden onChange={(e) => void upload(e.target.files)} />
      {allowUrl && (
        <div className="flex gap-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ou cole uma URL de imagem"
            className="h-9 flex-1 border border-border bg-background px-2 text-xs outline-none focus:border-white/50"
          />
          <button type="button" onClick={addUrl} className="h-9 border border-border px-3 text-[10px] uppercase tracking-[0.12em] transition-colors hover:border-white/50">
            Adicionar
          </button>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">
        {hint ?? `Até ${max} imagem(ns) · PNG, JPG, WEBP ou AVIF com no máximo 5 MB.`}
      </p>
    </div>
  )
}
