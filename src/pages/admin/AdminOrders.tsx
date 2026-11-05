import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { AdminHeader, Panel, adminInput, Modal } from '@/components/admin/ui'
import { StatusBadge, StatusBadge as Badge, OrderTimeline, methodLabel, paymentLabel } from '@/components/site/OrderStatus'
import { brl } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

const statuses: Order['status'][] = ['aguardando_pagamento', 'pago', 'preparando', 'enviado', 'concluido', 'cancelado']

const labels: Record<Order['status'], string> = {
  aguardando_pagamento: 'Aguard. pagamento', pago: 'Pago', preparando: 'Preparando', enviado: 'Enviado', concluido: 'Concluído', cancelado: 'Cancelado',
}

export default function AdminOrders() {
  const { state, updateOrderStatus } = useStore()
  const [filter, setFilter] = useState<'todos' | Order['status']>('todos')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const orders = useMemo(() => {
    let list = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (filter !== 'todos') list = list.filter((o) => o.status === filter)
    if (term) {
      const t = term.toLowerCase()
      list = list.filter((o) => o.code.toLowerCase().includes(t) || o.customer.name.toLowerCase().includes(t) || o.customer.email.toLowerCase().includes(t))
    }
    return list
  }, [state.orders, filter, term])

  const detail = state.orders.find((o) => o.id === open) ?? null

  return (
    <div>
      <AdminHeader title="Pedidos" subtitle="Operação" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar por código, cliente ou e-mail" className={cn(adminInput, 'w-72 pl-8')} />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['todos', ...statuses] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn('border px-2.5 py-1.5 text-[10px] uppercase tracking-wider', filter === s ? 'border-white bg-white text-black' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s === 'todos' ? 'Todos' : labels[s]}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-border text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Pedido</th><th className="px-4 py-2.5">Cliente</th><th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Entrega</th><th className="px-4 py-2.5">Pagamento</th><th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setOpen(o.id)}>
                  <td className="px-4 py-3 font-medium">#{o.code}</td>
                  <td className="px-4 py-3"><p>{o.customer.name}</p><p className="text-[10px] text-muted-foreground">{o.customer.email}</p></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.deliveryMethod === 'regional' ? 'Regional' : o.deliveryMethod === 'nacional' ? 'Nacional' : 'Retirada'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{paymentLabel[o.paymentStatus]}</td>
                  <td className="px-4 py-3"><Badge status={o.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold">{brl(o.total)}</td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={!!detail} onClose={() => setOpen(null)} title={detail ? `Pedido #${detail.code}` : ''}>
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={detail.status} />
              <span className="text-sm font-semibold">{brl(detail.total)}</span>
            </div>
            <OrderTimeline order={detail} />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="text-foreground">{detail.customer.name}</p>
              <p>{detail.customer.email} · {detail.customer.phone}</p>
              <p>{methodLabel[detail.deliveryMethod]}</p>
              {detail.deliveryMethod !== 'retirada' && (
                <p>{detail.address.street}, {detail.address.number} — {detail.address.neighborhood}, {detail.address.city}/{detail.address.state}</p>
              )}
              {detail.notes && <p className="italic">"{detail.notes}"</p>}
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Alterar status</p>
              <select
                value={detail.status}
                onChange={(e) => { updateOrderStatus(detail.id, e.target.value as Order['status']); toast.success('Status atualizado') }}
                className={adminInput}
              >
                {statuses.map((s) => <option key={s} value={s}>{labels[s]}</option>)}
              </select>
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {detail.items.map((i) => (
                <li key={`${i.productId}${i.size}${i.color}`} className="flex items-center gap-2 py-2 text-xs">
                  <img src={i.image} alt="" className="size-10 object-cover" />
                  <span className="flex-1">{i.name} · {i.size}/{i.color} × {i.quantity}</span>
                  <span>{brl(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  )
}
