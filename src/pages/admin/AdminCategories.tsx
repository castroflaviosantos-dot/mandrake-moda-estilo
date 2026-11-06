import { useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, AdminField, Modal, Panel, adminInput } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { newCategoryId } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import type { Category } from '@/lib/types'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80'

const slugify = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AdminCategories() {
  const { state, saveCategory, deleteCategory } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [newId, setNewId] = useState('')
  const [form, setForm] = useState({ name: '', description: '', image: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const startNew = () => {
    setEditing(null)
    setNewId(newCategoryId())
    setForm({ name: '', description: '', image: '' })
    setOpen(true)
  }

  const startEdit = (c: Category) => {
    setEditing(c)
    setNewId(c.id)
    setForm({ name: c.name, description: c.description, image: c.image })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!form.name.trim()) { toast.error('Informe o nome da categoria'); return }
    if (!form.image.trim()) { toast.error('Envie uma imagem para a categoria'); return }
    setSaving(true)
    const category: Category = {
      id: editing?.id ?? newId ?? newCategoryId(),
      slug: slugify(form.name) || (editing?.slug ?? `categoria-${Date.now().toString(36)}`),
      name: form.name.trim(),
      description: form.description,
      image: form.image.trim(),
      active: editing?.active ?? true,
    }
    try {
      await saveCategory(category)
      toast.success(editing ? 'Categoria atualizada' : 'Categoria criada')
      setOpen(false)
    } catch (error) {
      toast.error(`Não foi possível salvar a categoria: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminHeader title="Categorias" subtitle="Organização da vitrine" action={<Button size="sm" onClick={startNew} className="rounded-sm bg-white text-black"><Plus className="size-3.5" /> Nova categoria</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.categories.map((c) => {
          const count = state.products.filter((p) => p.category === c.slug).length
          return (
            <Panel key={c.id} className="overflow-hidden">
              {c.image ? (
                <img src={c.image} alt={c.name} className="h-28 w-full object-cover opacity-80" />
              ) : (
                <div className="grid h-28 w-full place-items-center bg-secondary text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Sem imagem</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg uppercase leading-tight">{c.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">/{c.slug} · {count} produtos</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(c)} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Editar"><Pencil className="size-3" /></button>
                    <button onClick={async () => { if (count) { toast.error('Não é possível excluir categoria com produtos vinculados'); return } try { await deleteCategory(c.id); toast.success('Categoria excluída') } catch (error) { toast.error(`Não foi possível excluir: ${error instanceof Error ? error.message : 'erro desconhecido'}`) } }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Excluir"><Trash2 className="size-3" /></button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{c.description}</p>
              </div>
            </Panel>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={submit} className="space-y-3">
          <AdminField label="Nome"><input className={adminInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></AdminField>
          <AdminField label="Descrição"><textarea rows={3} className="w-full border border-border bg-background p-2 text-sm outline-none focus:border-white/50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></AdminField>
          <AdminField label="Imagem da categoria">
            <ImageUpload
              images={form.image ? [form.image] : []}
              onChange={(images) => setForm({ ...form, image: images[0] ?? '' })}
              max={1}
              bucket="category-images"
              folder="categories"
              allowUrl={false}
              onBusyChange={setUploading}
              hint="Envie a imagem da categoria · PNG, JPG, WEBP ou AVIF com no máximo 5 MB."
            />
          </AdminField>
          <Button type="submit" disabled={uploading || saving} className="w-full rounded-sm bg-white text-black disabled:opacity-60">
            {uploading ? <><Loader2 className="size-3.5 animate-spin" /> Aguarde o envio da imagem…</> : saving ? <><Loader2 className="size-3.5 animate-spin" /> Salvando…</> : 'Salvar'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
