import { useState } from 'react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, AdminField, Panel, adminInput } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { maskPhone } from '@/lib/format'

export default function AdminSettings() {
  const { state, updateSettings, resetDemo } = useStore()
  const [form, setForm] = useState({
    storeName: state.settings.storeName,
    whatsapp: state.settings.whatsapp,
    instagram: state.settings.instagram,
    email: state.settings.email,
    street: state.settings.address.street,
    number: state.settings.address.number,
    neighborhood: state.settings.address.neighborhood,
    city: state.settings.city,
    announcement: state.settings.announcement,
  })

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      storeName: form.storeName,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      email: form.email,
      city: form.city,
      announcement: form.announcement,
      address: { ...state.settings.address, street: form.street, number: form.number, neighborhood: form.neighborhood },
    })
    toast.success('Configurações salvas')
  }

  return (
    <div className="space-y-4">
      <AdminHeader title="Configurações" subtitle="Loja" />
      <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identidade da loja">
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <AdminField label="Nome" className="sm:col-span-2"><input className={adminInput} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></AdminField>
            <AdminField label="WhatsApp"><input className={adminInput} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} /></AdminField>
            <AdminField label="Instagram"><input className={adminInput} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></AdminField>
            <AdminField label="E-mail" className="sm:col-span-2"><input className={adminInput} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></AdminField>
            <AdminField label="Aviso da barra superior" className="sm:col-span-2"><input className={adminInput} value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} /></AdminField>
          </div>
        </Panel>
        <Panel title="Endereço físico / retirada">
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <AdminField label="Rua" className="sm:col-span-2"><input className={adminInput} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></AdminField>
            <AdminField label="Número"><input className={adminInput} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></AdminField>
            <AdminField label="Bairro"><input className={adminInput} value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></AdminField>
            <AdminField label="Cidade" className="sm:col-span-2"><input className={adminInput} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></AdminField>
          </div>
        </Panel>
        <div className="lg:col-span-2"><Button type="submit" className="rounded-sm bg-white px-6 text-black">Salvar configurações</Button></div>
      </form>

      <Panel title="Pagamentos">
        <div className="space-y-3 p-4">
          <p className="text-xs text-muted-foreground">
            Checkout preparado para Pix e cartão de crédito com gateway Mercado Pago. Pix e cartão são registrados sem armazenar dados sensíveis; a confirmação deve chegar por webhook assinado do gateway.
          </p>
          <p className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full bg-amber-400" /> Ambiente demonstrativo — nenhuma cobrança real é processada até a configuração das credenciais.</p>
        </div>
      </Panel>

      <Panel title="Ambiente">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="max-w-md text-[11px] text-muted-foreground">Restaurar os dados de demonstração (produtos, banners, pedidos e configurações iniciais).</p>
          <Button variant="outline" size="sm" className="rounded-sm text-[11px] uppercase" onClick={() => { if (confirm('Restaurar dados de demonstração?')) { resetDemo(); toast.success('Demonstração restaurada') } }}>Restaurar demo</Button>
        </div>
      </Panel>
    </div>
  )
}
