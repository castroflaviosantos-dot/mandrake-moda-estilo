import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, AdminField, Modal, Panel, adminInput } from '@/components/admin/ui'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { brl } from '@/lib/format'
import type { Product } from '@/lib/types'

const blank = {
  name: '', brand: '', category: '', price: '', comparePrice: '', description: '', images: [] as string[], stock: '5',
}

export default function AdminProducts() {
  const { state, saveProduct, deleteProduct, toggleProductActive } = useStore()
  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)

  const startNew = () => {
    setEditing(null)
    setForm(blank)
    setOpen(true)
  }

  const startEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, brand: p.brand, category: p.category, price: String(p.price),
      comparePrice: p.comparePrice ? String(p.comparePrice) : '', description: p.description,
      images: [...p.images], stock: String(p.variants[0]?.stock ?? 0),
    })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = Number(form.price)
    if (!form.name.trim() || !form.brand.trim() || !form.category || !price) {
      toast.error('Preencha nome, marca, categoria e preço')
      return
    }
    const images = form.images.length ? form.images : ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80']
    if (editing) {
      await saveProduct({ ...editing, name: form.name, brand: form.brand, category: form.category, price, comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined, description: form.description, images })
      toast.success('Produto atualizado')
    } else {
      const slug = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const stock = Math.max(0, Number(form.stock) || 0)
      const product: Product = {
        id: `p-${Date.now()}`,
        slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        name: form.name,
        brand: form.brand,
        category: form.category,
        price,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        description: form.description || 'Peça selecionada pela curadoria Mandrake.',
        images,
        colors: [{ name: 'Preto', hex: '#050505' }],
        sizes: ['P', 'M', 'G', 'GG'],
        variants: ['P', 'M', 'G', 'GG'].map((size) => ({ size, color: 'Preto', stock })),
        details: ['Produto original', 'Garantia da loja'],
        tags: [],
        active: true,
        createdAt: new Date().toISOString(),
      }
      await saveProduct(product)
      toast.success(`Produto criado com estoque de ${stock} un. por tamanho`)
    }
    setOpen(false)
  }

  return (
    <div>
      <AdminHeader title="Produtos" subtitle="Catálogo" action={<Button onClick={startNew} size="sm" className="rounded-sm bg-white text-black"><Plus className="size-3.5" /> Novo produto</Button>} />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-border text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="px-4 py-2.5">Produto</th><th className="px-4 py-2.5">Categoria</th><th className="px-4 py-2.5">Preço</th><th className="px-4 py-2.5">Estoque</th><th className="px-4 py-2.5">Situação</th><th className="px-4 py-2.5 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.products.map((p) => {
                const stock = p.variants.reduce((a, v) => a + v.stock, 0)
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={p.images[0]} alt="" className="size-9 object-cover" />
                        <div><p className="font-medium">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.brand}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{state.categories.find((c) => c.slug === p.category)?.name}</td>
                    <td className="px-4 py-2.5">{brl(p.price)}</td>
                    <td className={stock <= 6 ? 'px-4 py-2.5 text-amber-300' : 'px-4 py-2.5'}>{stock} un.</td>
                    <td className="px-4 py-2.5">
                      <button onClick={async () => { await toggleProductActive(p.id); toast.success(p.active ? 'Produto ocultado da loja' : 'Produto publicado') }} className={p.active ? 'text-emerald-400' : 'text-muted-foreground'}>{p.active ? 'Publicado' : 'Oculto'}</button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(p)} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Editar"><Pencil className="size-3" /></button>
                        <button onClick={async () => { if (confirm(`Excluir ${p.name}?`)) { await deleteProduct(p.id); toast.success('Produto excluído') } }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label="Excluir"><Trash2 className="size-3" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar produto' : 'Novo produto'}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Nome" className="sm:col-span-2"><input className={adminInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></AdminField>
          <AdminField label="Marca"><input className={adminInput} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required /></AdminField>
          <AdminField label="Categoria">
            <select className={adminInput} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Selecione</option>
              {state.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </AdminField>
          <AdminField label="Preço (R$)"><input className={adminInput} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, '') })} inputMode="decimal" required /></AdminField>
          <AdminField label="Preço anterior (R$)"><input className={adminInput} value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value.replace(/[^0-9.]/g, '') })} inputMode="decimal" /></AdminField>
          {!editing && <AdminField label="Estoque inicial por tamanho"><input className={adminInput} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })} inputMode="numeric" /></AdminField>}
          <AdminField label="Imagens do produto" className="sm:col-span-2"><ImageUpload images={form.images} onChange={(images) => setForm({ ...form, images })} /></AdminField>
          <AdminField label="Descrição" className="sm:col-span-2"><textarea rows={3} className="w-full border border-border bg-background p-2 text-sm outline-none focus:border-white/50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></AdminField>
          <div className="sm:col-span-2"><Button type="submit" className="w-full rounded-sm bg-white text-black">{editing ? 'Salvar alterações' : 'Criar produto'}</Button></div>
        </form>
      </Modal>
    </div>
  )
}
