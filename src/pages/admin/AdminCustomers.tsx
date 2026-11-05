import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { AdminHeader, Panel } from '@/components/admin/ui'
import { brl } from '@/lib/format'

export default function AdminCustomers() {
  const { state } = useStore()

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; whatsapp: string; city: string; orders: number; total: number; last: string }>()
    state.orders.forEach((o) => {
      const key = o.customer.email.toLowerCase()
      const cur = map.get(key) ?? { name: o.customer.name, email: o.customer.email, whatsapp: o.customer.whatsapp, city: o.address.city, orders: 0, total: 0, last: o.createdAt }
      cur.orders += 1
      cur.total += o.total
      if (o.createdAt > cur.last) cur.last = o.createdAt
      map.set(key, cur)
    })
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [state.orders])

  return (
    <div>
      <AdminHeader title="Clientes" subtitle={`${customers.length} compradores`} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-border text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="px-4 py-2.5">Cliente</th><th className="px-4 py-2.5">WhatsApp</th><th className="px-4 py-2.5">Cidade</th><th className="px-4 py-2.5">Pedidos</th><th className="px-4 py-2.5">Última compra</th><th className="px-4 py-2.5 text-right">Total gasto</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className="px-4 py-3"><p className="font-medium">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.email}</p></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.whatsapp}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.last).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right font-semibold">{brl(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
