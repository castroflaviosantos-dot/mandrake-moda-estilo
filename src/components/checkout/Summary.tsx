import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { brl } from '@/lib/format'

export function OrderSummary({ deliveryFee = 0, deliveryEstimate }: { deliveryFee?: number; deliveryEstimate?: string }) {
  const { cartLines, subtotal, discount } = useStore()
  const total = Math.max(0, subtotal - discount) + deliveryFee

  return (
    <aside className="border border-border bg-card p-5 lg:sticky lg:top-28 lg:self-start">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Resumo do pedido</h2>
      <ul className="mt-4 space-y-3">
        {cartLines.map(({ item, product, total: lineTotal }) => (
          <li key={item.key} className="flex gap-3">
            <img src={product.images[0]} alt={product.name} className="size-14 shrink-0 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{product.name}</p>
              <p className="text-[11px] text-muted-foreground">Tam. {item.size} · {item.color} · {item.quantity}x</p>
            </div>
            <p className="whitespace-nowrap text-xs">{brl(lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(subtotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-emerald-400"><dt>Desconto</dt><dd>-{brl(discount)}</dd></div>}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Entrega</dt>
          <dd className="text-right text-xs">{deliveryFee === 0 ? 'Grátis' : brl(deliveryFee)}{deliveryEstimate ? <span className="block text-[10px] text-muted-foreground">{deliveryEstimate}</span> : null}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{brl(total)}</dd></div>
      </dl>
      <Link to="/carrinho" className="mt-4 block text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">Editar carrinho</Link>
    </aside>
  )
}
