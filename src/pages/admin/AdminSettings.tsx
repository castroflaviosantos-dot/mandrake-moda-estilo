import { useState } from 'react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { isSupabaseEnabled } from '@/lib/supabase'
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSettings({
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
        <div className="lg:col-span-2"><Button type="submit" className="rounded-sm bg-white px-6 text-black">Salvar configurações</Button></div>
      </form>

      <Panel title="Pagamentos">
        <div className="space-y-3 p-4">
          <p className="text-xs text-muted-foreground">
            Checkout preparado para Pix e cartão de crédito com gateway Mercado Pago. Pix e cartão são registrados sem armazenar dados sensíveis; a confirmação deve chegar por webhook assinado do gateway.
          </p>
          <p className="flex items-center gap-2 text-xs">
            <span className={isSupabaseEnabled ? 'size-2 rounded-full bg-emerald-400' : 'size-2 rounded-full bg-amber-400'} />
            {isSupabaseEnabled ? 'Pedidos e catálogo sincronizados com o Supabase.' : 'Modo demonstração: dados apenas neste navegador.'}
          </p>
          <p className="text-[11px] text-muted-foreground">Cobrança real fica ativa quando as credenciais do gateway forem aprovadas. Até lá, o pedido é registrado como aguardando pagamento e a equipe confirma manualmente.</p>
        </div>
      </Panel>

      <Panel title="Ambiente">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="max-w-md text-[11px] text-muted-foreground">Restaurar os dados de demonstração (produtos, banners, pedidos e configurações iniciais).</p>
          <Button variant="outline" size="sm" className="rounded-sm text-[11px] uppercase" onClick={async () => { if (confirm('Restaurar dados de demonstração? Isso sobrescreve os dados atuais da loja.')) { await resetDemo(); toast.success('Demonstração restaurada') } }}>Restaurar demo</Button>
        </div>
      </Panel>
    </div>
  )
}
