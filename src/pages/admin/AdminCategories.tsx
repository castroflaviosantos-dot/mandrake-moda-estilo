import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, AdminField, Modal, Panel, adminInput } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import type { Category } from '@/lib/types'

export default function AdminCategories() {
  const { state, saveCategory, deleteCategory } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', image: '' })

  const startNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', image: '' })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Informe o nome da categoria'); return }
    const slug = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const category: Category = {
      id: editing?.id ?? `c-${Date.now()}`,
      slug: editing?.slug ?? slug,
      name: form.name,
      description: form.description,
      image: form.image || editing?.image || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      active: editing?.active ?? true,
    }
    await saveCategory(category)
    toast.success(editing ? 'Categoria atualizada' : 'Categoria criada')
    setOpen(false)
  }

  return (
    <div>
      <AdminHeader title="Categorias" subtitle="Organização da vitrine" action={<Button size="sm" onClick={startNew} className="rounded-sm bg-white text-black"><Plus className="size-3.5" /> Nova categoria</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.categories.map((c) => {
          const count = state.products.filter((p) => p.category === c.slug).length
          return (
            <Panel key={c.id} className="overflow-hidden">
              <img src={c.image} alt={c.name} className="h-28 w-full object-cover opacity-80" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg uppercase leading-tight">{c.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">/{c.slug} · {count} produtos</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description, image: c.image }); setOpen(true) }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Editar"><Pencil className="size-3" /></button>
                    <button onClick={async () => { if (count) { toast.error('Não é possível excluir categoria com produtos vinculados'); return } await deleteCategory(c.id); toast.success('Categoria excluída') }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Excluir"><Trash2 className="size-3" /></button>
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
          <AdminField label="Imagem (URL)"><input className={adminInput} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></AdminField>
          <Button type="submit" className="w-full rounded-sm bg-white text-black">Salvar</Button>
        </form>
      </Modal>
    </div>
  )
}
