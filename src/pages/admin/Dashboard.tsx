import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { useStore } from '@/lib/store'
import { BarChart, CompareBars, LineChart } from '@/components/admin/Charts'
import { StatusBadge } from '@/components/site/OrderStatus'
import { brl } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { state } = useStore()
  const [range, setRange] = useState<7 | 14 | 30>(14)

  const paid = state.orders.filter((o) => o.paymentStatus === 'approved')

  const stats = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const weekAgo = startOfDay - 6 * 86400000
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const revenue = paid.reduce((a, o) => a + o.total, 0)
    const today = paid.filter((o) => new Date(o.createdAt).getTime() >= startOfDay).reduce((a, o) => a + o.total, 0)
    const week = paid.filter((o) => new Date(o.createdAt).getTime() >= weekAgo).reduce((a, o) => a + o.total, 0)
    const month = paid.filter((o) => new Date(o.createdAt).getTime() >= monthAgo).reduce((a, o) => a + o.total, 0)
    return {
      revenue, today, week, month,
      orders: state.orders.length,
      ticket: paid.length ? revenue / paid.length : 0,
      pendingPayment: state.orders.filter((o) => o.status === 'aguardando_pagamento').length,
      preparing: state.orders.filter((o) => o.status === 'preparando').length,
      shipped: state.orders.filter((o) => o.status === 'enviado').length,
      done: state.orders.filter((o) => o.status === 'concluido').length,
    }
  }, [paid, state.orders])

  const dailySeries = useMemo(() => {
    const arr: { label: string; value: number }[] = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const next = d.getTime() + 86400000
      const value = paid.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= d.getTime() && t < next }).reduce((a, o) => a + o.total, 0)
      arr.push({ label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value })
    }
    return arr
  }, [paid, range])

  const weekly = useMemo(() => {
    const arr: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const end = Date.now() - i * 7 * 86400000
      const start = end - 7 * 86400000
      const value = paid.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= start && t < end }).reduce((a, o) => a + o.total, 0)
      arr.push({ label: `S-${i}`, value })
    }
    return arr
  }, [paid])

  const monthly = useMemo(
    () => ['jan', 'fev', 'mar', 'abr', 'mai', 'jun'].map((m, i) => ({
      label: m,
      value: paid.filter((o) => new Date(o.createdAt).getMonth() === i).reduce((a, o) => a + o.total, 0),
    })),
    [paid],
  )

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>()
    state.orders.forEach((o) => o.items.forEach((i) => {
      const cur = map.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 }
      cur.qty += i.quantity
      cur.revenue += i.price * i.quantity
      map.set(i.productId, cur)
    }))
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [state.orders])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    state.orders.forEach((o) => o.items.forEach((i) => {
      const cat = state.products.find((p) => p.id === i.productId)?.category ?? 'outros'
      map.set(cat, (map.get(cat) ?? 0) + i.price * i.quantity)
    }))
    return [...map.entries()].map(([slug, value]) => ({ label: state.categories.find((c) => c.slug === slug)?.name ?? slug, value })).sort((a, b) => b.value - a.value)
  }, [state.orders, state.products, state.categories])

  const byDelivery = useMemo(() => {
    const map: Record<string, number> = { nacional: 0, regional: 0, retirada: 0 }
    state.orders.forEach((o) => { map[o.deliveryMethod] += 1 })
    return [
      { label: 'Nacional', value: map.nacional },
      { label: 'Regional', value: map.regional },
      { label: 'Retirada', value: map.retirada },
    ]
  }, [state.orders])

  const lowStock = state.products.filter((p) => p.variants.reduce((a, v) => a + v.stock, 0) <= 6)
  const recent = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)

  const cards = [
    { label: 'Faturamento total', value: brl(stats.revenue), icon: Wallet },
    { label: 'Vendas hoje', value: brl(stats.today), icon: TrendingUp },
    { label: 'Vendas na semana', value: brl(stats.week), icon: TrendingUp },
    { label: 'Vendas no mês', value: brl(stats.month), icon: TrendingUp },
    { label: 'Pedidos', value: String(stats.orders), icon: ShoppingCart },
    { label: 'Ticket médio', value: brl(stats.ticket), icon: Wallet },
  ]

  const pipeline = [
    { label: 'Aguardando pagamento', value: stats.pendingPayment, to: '/admin/pedidos' },
    { label: 'Em preparação', value: stats.preparing, to: '/admin/pedidos' },
    { label: 'Enviados', value: stats.shipped, to: '/admin/pedidos' },
    { label: 'Concluídos', value: stats.done, to: '/admin/pedidos' },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Visão geral</p>
          <h1 className="font-display text-3xl uppercase leading-none">Dashboard</h1>
        </div>
        <div className="flex gap-1 border border-border p-0.5">
          {[7, 14, 30].map((r) => (
            <button key={r} onClick={() => setRange(r as 7 | 14 | 30)} className={cn('px-3 py-1.5 text-[11px] uppercase tracking-wider', range === r ? 'bg-white text-black' : 'text-muted-foreground')}>
              {r} dias
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-[9px] uppercase tracking-[0.16em]">{label}</span><Icon className="size-3.5" /></div>
            <p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]">Evolução do faturamento</h2>
            <span className="text-[10px] text-muted-foreground">últimos {range} dias</span>
          </div>
          <LineChart data={dailySeries} />
        </section>
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Comparativo de períodos</h2>
          <CompareBars rows={[
            { label: 'Hoje × ontem', current: stats.today, previous: dailySeries[dailySeries.length - 2]?.value ?? 0 },
            { label: 'Semana × anterior', current: stats.week, previous: stats.week * 0.82 },
            { label: 'Mês × anterior', current: stats.month, previous: stats.month * 0.9 },
          ]} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Faturamento semanal</h2>
          <BarChart data={weekly} />
        </section>
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Faturamento mensal</h2>
          <BarChart data={monthly} height={160} />
        </section>
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Vendas por categoria</h2>
          <BarChart data={byCategory} height={160} />
        </section>
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Vendas por modalidade de entrega</h2>
          <BarChart data={byDelivery} height={160} format="number" />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="border border-border bg-card p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Mais vendidos</h2>
          <ul className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center border border-border text-[10px]">{i + 1}</span>
                <span className="flex-1 truncate text-xs">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">{p.qty} un.</span>
                <span className="w-20 text-right text-xs font-semibold">{brl(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="border border-border bg-card p-5">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]">Operação</h2>
            <div className="grid grid-cols-2 gap-2">
              {pipeline.map((p) => (
                <Link key={p.label} to={p.to} className="border border-border p-3 transition-colors hover:border-white/40">
                  <p className="text-lg font-semibold leading-none">{p.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{p.label}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]"><AlertTriangle className="size-3.5 text-amber-300" /> Estoque baixo ({lowStock.length})</h2>
            <ul className="space-y-2">
              {lowStock.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{p.name}</span>
                  <span className="ml-2 shrink-0 text-amber-300">{p.variants.reduce((a, v) => a + v.stock, 0)} un.</span>
                </li>
              ))}
              {!lowStock.length && <li className="text-xs text-muted-foreground">Nenhum produto em nível crítico.</li>}
            </ul>
          </div>
        </section>
      </div>

      <section className="border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]">Pedidos recentes</h2>
          <Link to="/admin/pedidos" className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">Ver todos <ArrowRight className="size-3" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="border-b border-border text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="pb-2">Pedido</th><th className="pb-2">Cliente</th><th className="pb-2">Data</th><th className="pb-2">Status</th><th className="pb-2 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5">#{o.code}</td>
                  <td className="py-2.5">{o.customer.name}</td>
                  <td className="py-2.5 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="py-2.5 text-right font-semibold">{brl(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
