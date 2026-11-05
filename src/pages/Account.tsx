import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, LogOut, Package, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/site/OrderStatus'
import { brl, maskPhone } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

const field = 'h-11 w-full rounded-none border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-white/60'

export default function Account() {
  const { state, saveCustomer } = useStore()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState({
    name: state.customer?.name ?? '',
    phone: state.customer?.phone ?? '',
    email: state.customer?.email ?? '',
    cpf: state.customer?.cpf ?? '',
  })
  const [selected, setSelected] = useState<Order | null>(null)
  const [sessionOut, setSessionOut] = useState(false)

  const sessionEmail = state.customer?.email?.toLowerCase() ?? ''
  const myOrders = sessionEmail && !sessionOut
    ? state.orders.filter((o) => o.customer.email.toLowerCase() === sessionEmail)
    : []

  if (!state.customer || sessionOut) {
    return (
      <div className="container-mandrake max-w-md py-16">
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-border"><UserRound className="size-5" /></div>
          <h1 className="mt-5 font-display text-3xl uppercase leading-none">Área do cliente</h1>
          <p className="mt-3 text-sm text-muted-foreground">Acesse com o e-mail usado em suas compras para ver pedidos e histórico.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const clean = email.trim().toLowerCase()
            const order = state.orders.find((o) => o.customer.email.toLowerCase() === clean)
            if (!order) {
              toast.error('Nenhuma compra encontrada para este e-mail. Você pode consultar pelo número do pedido.')
              return
            }
            saveCustomer(order.customer, order.address)
            setProfile({ name: order.customer.name, phone: order.customer.phone, email: order.customer.email, cpf: order.customer.cpf })
            toast.success(`Bem-vindo de volta, ${order.customer.name.split(' ')[0]}!`)
          }}
          className="mt-8 space-y-4 border border-border bg-card p-5"
        >
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">E-mail cadastrado</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="voce@email.com" required />
          </label>
          <Button type="submit" className="h-11 w-full rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.16em] text-black hover:bg-white/90">Entrar</Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Sem conta? <Link to="/acompanhar" className="text-foreground underline underline-offset-2">Consulte pelo número do pedido</Link>.
          </p>
        </form>
      </div>
    )
  }

  return (
    <div className="container-mandrake py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Minha conta</p>
          <h1 className="mt-1 font-display text-4xl uppercase leading-none">Olá, {state.customer.name.split(' ')[0]}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-sm text-[11px] uppercase tracking-[0.14em]"
          onClick={() => { setSessionOut(true); toast.success('Sessão encerrada') }}
        >
          <LogOut className="size-3.5" /> Sair
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]"><Package className="size-3.5" /> Meus pedidos ({myOrders.length})</h2>
          {myOrders.length === 0 && <p className="border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Você ainda não tem pedidos registrados.</p>}
          <ul className="space-y-3">
            {myOrders.map((o) => (
              <li key={o.id} className={cn('border bg-card p-4 transition-colors', selected?.id === o.id ? 'border-white/50' : 'border-border')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">#{o.code}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('pt-BR')} · {o.items.length} item(ns) · {brl(o.total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <Button asChild size="sm" variant="ghost" className="rounded-sm text-[11px] uppercase"><Link to={`/acompanhar?codigo=${o.code}`}>Detalhes</Link></Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span>{o.deliveryLabel}</span>
                  <span>·</span>
                  <span>{o.deliveryEstimate || 'prazo a confirmar'}</span>
                  <button onClick={() => setSelected(o)} className="ml-auto inline-flex items-center gap-1 text-foreground hover:underline"><History className="size-3" /> Ver histórico</button>
                </div>
                {selected?.id === o.id && (
                  <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                    {o.items.map((it, i) => (
                      <li key={`${it.productId}-${i}`} className="flex justify-between gap-2">
                        <span>{it.quantity}x {it.name} · {it.size} · {it.color}</span>
                        <span className="text-foreground">{brl(it.price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="border border-border bg-card p-5">
          <p className="mb-4 border-b border-border pb-3 text-[11px] font-bold uppercase tracking-[0.2em]">Dados cadastrais</p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              saveCustomer({ ...state.customer!, ...profile, email: state.customer!.email }, state.customerAddress ?? { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', reference: '' })
              toast.success('Dados atualizados com sucesso')
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Nome completo</span>
              <input className={field} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">WhatsApp</span>
              <input className={field} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: maskPhone(e.target.value) })} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">CPF</span>
              <input className={field} value={profile.cpf} onChange={(e) => setProfile({ ...profile, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">E-mail</span>
              <input className={cn(field, 'opacity-60')} value={state.customer!.email} disabled />
            </label>
            <Button type="submit" className="h-10 w-full rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.14em] text-black hover:bg-white/90">Salvar alterações</Button>
          </form>
        </aside>
      </div>
    </div>
  )
}
