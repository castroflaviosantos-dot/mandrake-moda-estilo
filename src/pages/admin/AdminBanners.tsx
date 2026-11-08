import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { newBannerId } from '@/lib/supabase'
import { AdminHeader, AdminField, Modal, Panel, adminInput } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import type { Banner } from '@/lib/types'

const empty = { title: '', subtitle: '', description: '', ctaLabel: 'Ver coleção', ctaLink: '/produtos', image: '' }

export default function AdminBanners() {
  const { state, saveBanner, deleteBanner, moveBanner } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  /* Id do banner em criação: mantém o mesmo identificador entre tentativas. */
  const [draftId, setDraftId] = useState('')
  const [form, setForm] = useState(empty)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const closeModal = () => {
    if (saving) return
    setOpen(false)
    setUploading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploading || saving) return
    if (!form.title.trim()) { toast.error('Informe o título do banner'); return }
    if (!form.image.trim()) { toast.error('Envie uma imagem para o banner'); return }
    const image = form.image.trim()
    if (!/^https?:\/\//i.test(image)) { toast.error('A imagem do banner não tem um endereço válido. Envie o arquivo novamente.'); return }
    setSaving(true)
    try {
      await saveBanner({
        id: editing?.id ?? draftId,
        order: editing?.order ?? state.banners.length + 1,
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        ctaLabel: form.ctaLabel,
        ctaLink: form.ctaLink,
        image,
      })
      if (editing && form.image !== editing.image) toast.success('Banner atualizado com a nova imagem')
      else toast.success(editing ? 'Banner atualizado' : 'Banner criado')
      setOpen(false)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'erro desconhecido'
      toast.error(`Não foi possível salvar o banner: ${detail}`)
    } finally {
      setSaving(false)
    }
  }

  const banners = [...state.banners].sort((a, b) => a.order - b.order)

  return (
    <div>
      <AdminHeader
        title="Banners"
        subtitle="Home — carrossel"
        action={<Button size="sm" onClick={() => { setEditing(null); setDraftId(newBannerId()); setForm(empty); setOpen(true) }} className="bg-white text-black"><Plus className="size-3.5" /> Novo banner</Button>}
      />
      <p className="mb-4 text-[11px] text-muted-foreground">Os banners são exibidos na ordem abaixo e alternam automaticamente na página inicial.</p>
      <div className="space-y-3">
        {banners.map((b, i) => (
          <Panel key={b.id}>
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <img src={b.image} alt={b.title} className="h-24 w-full object-cover sm:w-44" />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{b.subtitle}</p>
                <p className="font-display text-lg uppercase leading-tight">{b.title}</p>
                <p className="text-[11px] text-muted-foreground">{b.description}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">CTA: {b.ctaLabel} → {b.ctaLink}</p>
              </div>
              <div className="flex gap-1">
                <button disabled={i === 0} onClick={() => moveBanner(b.id, -1)} className="grid size-7 place-items-center border border-border disabled:opacity-30 hover:border-white/50" aria-label="Subir"><ArrowUp className="size-3" /></button>
                <button disabled={i === banners.length - 1} onClick={() => moveBanner(b.id, 1)} className="grid size-7 place-items-center border border-border disabled:opacity-30 hover:border-white/50" aria-label="Descer"><ArrowDown className="size-3" /></button>
                <button onClick={() => { setEditing(b); setForm({ title: b.title, subtitle: b.subtitle, description: b.description, ctaLabel: b.ctaLabel, ctaLink: b.ctaLink, image: b.image }); setOpen(true) }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Editar"><Pencil className="size-3" /></button>
                <button onClick={() => { deleteBanner(b.id); toast.success('Banner removido') }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Excluir"><Trash2 className="size-3" /></button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Editar banner' : 'Novo banner'}>
        <form onSubmit={submit} className="space-y-3">
          <AdminField label="Selo / sobretítulo"><input className={adminInput} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Coleção 2025" /></AdminField>
          <AdminField label="Título"><input className={adminInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></AdminField>
          <AdminField label="Texto complementar"><textarea rows={2} className="w-full border border-border bg-background p-2 text-sm outline-none focus:border-white/50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Texto do botão"><input className={adminInput} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} /></AdminField>
            <AdminField label="Link do botão"><input className={adminInput} value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} /></AdminField>
          </div>
          <AdminField label="Imagem do banner">
            <ImageUpload
              images={form.image ? [form.image] : []}
              onChange={(imgs) => setForm((prev) => ({ ...prev, image: imgs[0] ?? '' }))}
              onBusyChange={setUploading}
              max={1}
              bucket="banner-images"
              folder="banners"
              allowUrl={false}
              hint="Envie uma imagem de capa · PNG, JPG, WEBP ou AVIF com no máximo 5 MB. Recomendado 1600×700 px."
            />
          </AdminField>
          <Button type="submit" disabled={uploading || saving} className="w-full bg-white text-black disabled:cursor-not-allowed disabled:opacity-60">
            {uploading ? 'Aguarde o envio da imagem…' : saving ? 'Salvando…' : 'Salvar banner'}
          </Button>
          {uploading && <p className="text-[10px] text-muted-foreground">O salvamento é liberado quando o envio da imagem terminar.</p>}
        </form>
      </Modal>
    </div>
  )
}
