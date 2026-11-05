import { brl } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

export const statusLabel: Record<Order['status'], string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento aprovado',
  preparando: 'Em preparação',
  enviado: 'Enviado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const paymentLabel: Record<Order['paymentStatus'], string> = {
  pending: 'Aguardando confirmação',
  approved: 'Aprovado',
  failed: 'Não aprovado',
  refunded: 'Reembolsado',
}

export const paymentMethodLabel: Record<Order['paymentMethod'], string> = {
  pix: 'Pix',
  cartao: 'Cartão de crédito',
  retirada: 'Pagar na retirada',
}

export const methodLabel: Record<Order['deliveryMethod'], string> = {
  nacional: 'Entrega nacional',
  regional: 'Entrega regional — Patos de Minas',
  retirada: 'Retirada na loja',
}

export function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
        status === 'cancelado' && 'border-red-500/50 text-red-300',
        (status === 'concluido' || status === 'pago') && 'border-white/40 bg-white/5 text-white',
        (status === 'aguardando_pagamento' || status === 'preparando' || status === 'enviado') && 'border-border text-muted-foreground',
      )}
    >
      {statusLabel[status]}
    </span>
  )
}

export function OrderTimeline({ order }: { order: Order }) {
  const steps: { key: Order['status']; label: string }[] = [
    { key: 'aguardando_pagamento', label: 'Pedido criado' },
    { key: 'pago', label: 'Pagamento' },
    { key: 'preparando', label: 'Preparação' },
    { key: 'enviado', label: 'Enviado' },
    { key: 'concluido', label: 'Concluído' },
  ]
  const current = steps.findIndex((s) => s.key === order.status)
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {steps.map((s, i) => (
        <div key={s.key}>
          <div className={cn('h-1 w-full rounded-full', i <= current ? 'bg-white' : 'bg-secondary')} />
          <p className={cn('mt-2 text-[9px] uppercase leading-tight tracking-[0.1em]', i <= current ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pedido</p>
            <p className="font-display text-xl tracking-wide">#{order.code}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="pt-4"><OrderTimeline order={order} /></div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <ul className="divide-y divide-border">
          {order.items.map((i, index) => (
            <li key={`${i.productId}-${i.size}-${i.color}-${index}`} className="flex gap-3 p-4">
              <img src={i.image} alt={i.name} className="size-16 shrink-0 rounded-sm object-cover" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.name}</p>
                <p className="text-[11px] text-muted-foreground">{i.brand} · Tam. {i.size} · {i.color} · {i.quantity} un.</p>
              </div>
              <p className="text-sm font-semibold">{brl(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-border p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>-{brl(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">{order.deliveryLabel}</span><span>{order.shipping === 0 ? 'Grátis' : brl(order.shipping)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span>Total</span><span>{brl(order.total)}</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4 text-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cliente</p>
          <p>{order.customer.name}</p>
          <p className="text-muted-foreground">{order.customer.email}</p>
          <p className="text-muted-foreground">{order.customer.phone}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 text-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entrega</p>
          <p>{methodLabel[order.deliveryMethod]}</p>
          {order.deliveryEstimate && <p className="text-[11px] text-muted-foreground">Prazo estimado: {order.deliveryEstimate}</p>}
          {order.deliveryMethod === 'retirada' ? (
            <p className="text-muted-foreground">Avise-nos pelo WhatsApp quando for buscar. A loja confirma a disponibilidade do pedido.</p>
          ) : (
            <p className="text-muted-foreground">
              {order.address.street}, {order.address.number}{order.address.complement ? ` — ${order.address.complement}` : ''}
              <br />{order.address.neighborhood} · {order.address.city} — {order.address.state} · CEP {order.address.cep}
            </p>
          )}
        </div>
        <div className="rounded-md border border-border bg-card p-4 text-sm sm:col-span-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pagamento</p>
          <p>{paymentMethodLabel[order.paymentMethod]} · {paymentLabel[order.paymentStatus]}</p>
          <p className="text-[11px] text-muted-foreground">Pedido {order.code} · {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}
