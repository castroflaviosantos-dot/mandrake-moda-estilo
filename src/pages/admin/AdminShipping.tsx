import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, AdminField, Panel, adminInput } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { brl } from '@/lib/format'

export default function AdminShipping() {
  const { state, setNeighborhoods, updateSettings } = useStore()
  const [newBairro, setNewBairro] = useState({ name: '', fee: '12', estimate: '1 a 2 dias úteis' })
  const s = state.settings

  const addNeighborhood = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBairro.name.trim()) { toast.error('Informe o bairro'); return }
    if (state.neighborhoods.some((n) => n.name.toLowerCase() === newBairro.name.trim().toLowerCase())) {
      toast.error('Este bairro já está cadastrado')
      return
    }
    setNeighborhoods([...state.neighborhoods, { name: newBairro.name.trim(), fee: Number(newBairro.fee) || 0, estimate: newBairro.estimate }])
    setNewBairro({ name: '', fee: '12', estimate: '1 a 2 dias úteis' })
    toast.success('Bairro adicionado à área de entrega regional')
  }

  return (
    <div className="space-y-4">
      <AdminHeader title="Entregas e frete" subtitle="Modalidades de envio" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Entrega nacional">
          <div className="space-y-3 p-4">
            <AdminField label="Tarifa fixa (R$)">
              <input className={adminInput} value={s.nationalFlatFee} onChange={(e) => updateSettings({ nationalFlatFee: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })} inputMode="decimal" />
            </AdminField>
            <AdminField label="Frete grátis acima de (R$)">
              <input className={adminInput} value={s.nationalFreeAbove} onChange={(e) => updateSettings({ nationalFreeAbove: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })} inputMode="decimal" />
            </AdminField>
            <AdminField label="Prazo estimado">
              <input className={adminInput} value={s.nationalEstimate} onChange={(e) => updateSettings({ nationalEstimate: e.target.value })} />
            </AdminField>
            <p className="text-[10px] leading-relaxed text-muted-foreground">Estrutura pronta para integração com Correios / Melhor Envio via webhook e tabela de tarifas.</p>
          </div>
        </Panel>

        <Panel title="Entrega regional — Patos de Minas">
          <div className="space-y-3 p-4">
            <AdminField label="Taxa padrão (R$)">
              <input className={adminInput} value={s.regionalBaseFee} onChange={(e) => updateSettings({ regionalBaseFee: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })} inputMode="decimal" />
            </AdminField>
            <AdminField label="Entrega grátis acima de (R$)">
              <input className={adminInput} value={s.regionalFreeAbove} onChange={(e) => updateSettings({ regionalFreeAbove: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })} inputMode="decimal" />
            </AdminField>
            <AdminField label="Prazo configurável">
              <input className={adminInput} value={s.regionalEstimate} onChange={(e) => updateSettings({ regionalEstimate: e.target.value })} />
            </AdminField>
          </div>
        </Panel>

        <Panel title="Retirada na loja">
          <div className="space-y-3 p-4">
            <p className="text-xs">{s.address.street}, {s.address.number}</p>
            <p className="text-[11px] text-muted-foreground">{s.address.neighborhood} · {s.city} — MG</p>
            <AdminField label="Instruções de retirada">
              <textarea rows={3} className="w-full border border-border bg-background p-2 text-sm outline-none focus:border-white/50" value={s.pickupInstructions} onChange={(e) => updateSettings({ pickupInstructions: e.target.value })} />
            </AdminField>
            <p className="text-[10px] text-muted-foreground">Frete zerado. O cliente recebe confirmação quando o pedido estiver disponível.</p>
          </div>
        </Panel>
      </div>

      <Panel title={`Bairros atendidos (${state.neighborhoods.length})`}>
        <form onSubmit={addNeighborhood} className="flex flex-wrap items-end gap-2 border-b border-border p-4">
          <AdminField label="Bairro" className="flex-1 min-w-40"><input className={adminInput} value={newBairro.name} onChange={(e) => setNewBairro({ ...newBairro, name: e.target.value })} placeholder="Centro" /></AdminField>
          <AdminField label="Taxa (R$)" className="w-28"><input className={adminInput} value={newBairro.fee} onChange={(e) => setNewBairro({ ...newBairro, fee: e.target.value.replace(/[^0-9.]/g, '') })} inputMode="decimal" /></AdminField>
          <AdminField label="Prazo" className="w-44"><input className={adminInput} value={newBairro.estimate} onChange={(e) => setNewBairro({ ...newBairro, estimate: e.target.value })} /></AdminField>
          <Button type="submit" className="h-10 rounded-sm bg-white text-black"><Plus className="size-3.5" /> Adicionar</Button>
        </form>
        <ul className="divide-y divide-border">
          {state.neighborhoods.map((n) => (
            <li key={n.name} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span>{n.name}</span>
              <span className="flex items-center gap-4">
                <span className="text-muted-foreground">{n.estimate}</span>
                <span className={n.fee === 0 ? 'text-emerald-400' : 'font-semibold'}>{n.fee === 0 ? 'Grátis' : brl(n.fee)}</span>
                <button onClick={() => { setNeighborhoods(state.neighborhoods.filter((x) => x.name !== n.name)); toast.success('Bairro removido') }} className="grid size-7 place-items-center border border-border hover:border-white/50" aria-label={`Remover ${n.name}`}><Trash2 className="size-3" /></button>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
