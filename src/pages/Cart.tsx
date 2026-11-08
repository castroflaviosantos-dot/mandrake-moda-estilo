import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { brl, maskCep } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Cart() {
  const { cartLines, cartCount, subtotal, discount, updateCartItem, removeCartItem, deliveryOptions } = useStore()
  const navigate = useNavigate()
  const [cep, setCep] = useState('')
  const [quote, setQuote] = useState<ReturnType<typeof deliveryOptions> | null>(null)

  const total = Math.max(0, subtotal - discount)
  const freeShippingMissing = Math.max(0, 500 - subtotal)
  const progress = Math.min(100, (subtotal / 500) * 100)

  const cheapest = useMemo(() => {
    if (!quote?.length) return null
    return quote.reduce((min, opt) => (opt.price < min.price ? opt : min), quote[0])
  }, [quote])

  const digits = cep.replace(/\D/g, '')

  const handleQuote = () => {
    if (digits.length !== 8) return
    setQuote(deliveryOptions(digits))
  }

  const handleContinue = () => {
    if (digits.length === 8) localStorage.setItem('mandrake.cep', cep)
    navigate('/entrega')
  }

  if (!cartLines.length) {
    return (
      <div className="container-mandrake flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
        <h1 className="mt-5 font-display text-4xl uppercase">Seu carrinho está vazio</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">Explore a nova coleção e monte um look completo com as peças da Mandrake.</p>
        <Button asChild className="mt-7 rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-mandrake py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Sacola</p>
          <h1 className="mt-1 font-display text-4xl uppercase">Carrinho</h1>
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
      </div>

      <div className="mt-6 border border-border bg-card p-4">
        {freeShippingMissing > 0 ? (
          <p className="text-xs text-muted-foreground">Faltam <strong className="text-foreground">{brl(freeShippingMissing)}</strong> para você ganhar 5% de desconto na sacola.</p>
        ) : (
          <p className="text-xs text-foreground">Desconto de 5% aplicado — compra acima de {brl(500)}.</p>
        )}
        <div className="mt-2 h-1 w-full overflow-hidden bg-secondary">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="divide-y divide-border border-y border-border">
          {cartLines.map(({ item, product, total: lineTotal }) => (
            <div key={item.key} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[120px_minmax(0,1fr)]">
              <Link to={`/produto/${product.slug}`} className="aspect-[4/5] overflow-hidden bg-secondary">
                <img src={product.images[0]} alt={product.name} className="size-full object-cover transition-transform duration-500 hover:scale-105" />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</p>
                    <Link to={`/produto/${product.slug}`} className="font-display text-lg uppercase leading-tight hover:underline">{product.name}</Link>
                  </div>
                  <button onClick={() => removeCartItem(item.key)} className="text-muted-foreground transition-colors hover:text-white" aria-label="Remover item">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Tam.
                    <select
                      value={item.size}
                      onChange={(e) => updateCartItem(item.key, { size: e.target.value })}
                      className="h-8 border border-border bg-background px-2 text-[11px] text-foreground outline-none focus:border-white/50"
                    >
                      {product.sizes.map((s) => {
                        const stock = product.variants.find((v) => v.size === s && v.color === item.color)?.stock ?? 0
                        return <option key={s} value={s} disabled={stock === 0}>{s}{stock === 0 ? ' (esgotado)' : ''}</option>
                      })}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Cor
                    <select
                      value={item.color}
                      onChange={(e) => updateCartItem(item.key, { color: e.target.value })}
                      className="h-8 border border-border bg-background px-2 text-[11px] text-foreground outline-none focus:border-white/50"
                    >
                      {product.colors.map((c) => {
                        const stock = product.variants.find((v) => v.size === item.size && v.color === c)?.stock ?? 0
                        return <option key={c} value={c} disabled={stock === 0}>{c}{stock === 0 ? ' (esgotado)' : ''}</option>
                      })}
                    </select>
                  </label>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                  <div className="flex items-center border border-border">
                    <button onClick={() => updateCartItem(item.key, { quantity: item.quantity - 1 })} className="grid size-8 place-items-center hover:bg-accent" aria-label="Diminuir"><Minus className="size-3" /></button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateCartItem(item.key, { quantity: item.quantity + 1 })} className="grid size-8 place-items-center hover:bg-accent" aria-label="Aumentar"><Plus className="size-3" /></button>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold">{brl(lineTotal)}</p>
                    <p className="text-[11px] text-muted-foreground">{brl(product.price)} cada</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-border bg-card p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Resumo do pedido</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(subtotal)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400"><dt>Desconto</dt><dd>-{brl(discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Entrega</dt><dd className="text-right text-xs">{cheapest ? (cheapest.price === 0 ? 'Grátis' : brl(cheapest.price)) : 'Calcular no checkout'}</dd></div>
              <div className="flex items-baseline justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{brl(total + (cheapest?.price ?? 0))}</dd></div>
            </dl>
            <p className="mt-1 text-[11px] text-muted-foreground">ou até 3x de {brl((total + (cheapest?.price ?? 0)) / 3)} sem juros</p>

            <div className="mt-5 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Truck className="size-3.5" /> Calcular entrega</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={cep}
                  onChange={(e) => { setCep(maskCep(e.target.value)); setQuote(null) }}
                  placeholder="Digite seu CEP"
                  inputMode="numeric"
                  aria-label="CEP"
                  className="h-10 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-white/50"
                />
                <Button variant="secondary" onClick={handleQuote} className="h-10 rounded-sm text-[10px] uppercase tracking-[0.14em]">Calcular</Button>
              </div>
              {quote && (
                <ul className="mt-3 space-y-2">
                  {quote.map((opt) => (
                    <li key={opt.method} className="flex items-start justify-between gap-3 text-xs">
                      <span>
                        <span className="block font-medium">{opt.label}</span>
                        <span className="text-[11px] text-muted-foreground">{opt.days}</span>
                      </span>
                      <span className={cn('whitespace-nowrap font-semibold', opt.price === 0 && 'text-emerald-400')}>{opt.price === 0 ? 'Grátis' : brl(opt.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button onClick={handleContinue} className="mt-5 h-12 w-full rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
              Continuar para entrega <ArrowRight className="size-4" />
            </Button>
            <Link to="/produtos" className="mt-3 block text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">Continuar comprando</Link>

            <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><Tag className="mt-0.5 size-3.5 shrink-0" /> Cupons e descontos são aplicados automaticamente conforme as regras da loja.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
