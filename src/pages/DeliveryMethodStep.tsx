import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Loader2, MapPin, ShoppingBag, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { CheckoutSteps } from '@/components/checkout/steps/CheckoutSteps'
import { brl, maskCep } from '@/lib/format'
import type { DeliveryMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

const CEP_KEY = 'mandrake.cep'

export default function DeliveryMethodStep() {
  const { cartLines, subtotal, discount, deliveryOptions } = useStore()
  const navigate = useNavigate()

  const [cep, setCep] = useState(() => localStorage.getItem(CEP_KEY) ?? '')
  const [neighborhood, setNeighborhood] = useState('')
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'done'>('idle')
  const [method, setMethod] = useState<DeliveryMethod | ''>(() => {
    const saved = localStorage.getItem('mandrake.deliveryMethod')
    return saved === 'nacional' || saved === 'regional' || saved === 'retirada' ? saved : ''
  })

  const digits = cep.replace(/\D/g, '')
  const options = useMemo(() => deliveryOptions(cep, neighborhood), [deliveryOptions, cep, neighborhood])
  const selected = options.find((o) => o.method === method && o.available !== false)
  const total = Math.max(0, subtotal - discount) + (selected?.price ?? 0)

  useEffect(() => {
    if (digits.length === 8) localStorage.setItem(CEP_KEY, cep)
  }, [digits, cep])

  const handleLookup = async () => {
    if (digits.length !== 8) {
      toast.error('Digite um CEP com 8 dígitos para calcular a entrega.')
      return
    }
    setLookup('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setLookup('done')
        setNeighborhood('')
        toast.error('CEP não encontrado. Confira o número ou escolha a retirada na loja.')
        return
      }
      setNeighborhood(data.bairro ?? '')
      setLookup('done')
      toast.success(`${data.localidade} — ${data.uf}. Entregas disponíveis abaixo.`)
    } catch {
      setLookup('done')
      toast.info('Consulta de CEP indisponível agora. Você ainda pode escolher a entrega ou a retirada.')
    }
  }

  const handleContinue = () => {
    if (!selected) {
      toast.error('Escolha uma modalidade de entrega para continuar.')
      return
    }
    localStorage.setItem('mandrake.deliveryMethod', selected.method)
    localStorage.setItem(CEP_KEY, cep)
    navigate('/checkout')
  }

  if (!cartLines.length) {
    return (
      <div className="container-mandrake flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
        <h1 className="mt-5 font-display text-4xl uppercase">Seu carrinho está vazio</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">Escolha uma peça antes de definir a entrega.</p>
        <Button asChild className="mt-7 bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-mandrake py-10">
      <div className="border-b border-border pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Entrega</p>
        <h1 className="mt-1 font-display text-4xl uppercase">Escolha como receber</h1>
      </div>

      <div className="mt-5">
        <CheckoutSteps current="entrega" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <section className="border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <MapPin className="size-3.5" /> Calcule a entrega
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                value={cep}
                onChange={(e) => setCep(maskCep(e.target.value))}
                placeholder="00000-000"
                inputMode="numeric"
                aria-label="CEP de entrega"
                className="h-11 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-white/50"
              />
              <Button variant="secondary" onClick={handleLookup} disabled={lookup === 'loading'} className="h-11 text-[10px] uppercase tracking-[0.14em]">
                {lookup === 'loading' ? <Loader2 className="size-4 animate-spin" /> : 'Calcular'}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              A entrega regional fica disponível para CEPs de Patos de Minas. A retirada na loja é sempre liberada.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">Modalidades</h2>
            <div className="grid gap-3">
              {options.map((opt) => {
                const disabled = opt.available === false
                const active = method === opt.method
                return (
                  <button
                    key={opt.method}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(opt.method)}
                    className={cn(
                      'flex items-start gap-3 border p-4 text-left transition-colors',
                      active ? 'border-white bg-white/5' : 'border-border hover:border-white/40',
                      disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <Truck className="mt-0.5 size-4 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{opt.label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{opt.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{opt.days}</p>
                      {disabled && <p className="mt-1 text-[11px] text-amber-300">Informe o CEP para liberar esta opção.</p>}
                    </div>
                    <div className="text-right">
                      <p className="whitespace-nowrap text-sm font-semibold">{opt.price === 0 ? 'Grátis' : brl(opt.price)}</p>
                      {active && <Check className="ml-auto mt-1 size-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-border bg-card p-5">
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
                <dd className="text-right text-xs">{selected ? (selected.price === 0 ? 'Grátis' : brl(selected.price)) : 'Escolha uma opção'}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{brl(total)}</dd></div>
            </dl>

            <Button
              onClick={handleContinue}
              disabled={!selected}
              className="mt-5 h-12 w-full bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90"
            >
              Ir para o checkout <ArrowRight className="size-4" />
            </Button>
            <Link to="/carrinho" className="mt-3 block text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
              Voltar ao carrinho
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
