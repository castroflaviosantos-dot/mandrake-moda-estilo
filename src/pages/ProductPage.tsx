import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { isPatosCep } from '@/lib/shipping'
import { ProductCard } from '@/components/site/ProductCard'
import { Button } from '@/components/ui/button'
import { brl, discountPercent, maskCep, whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'

type ShippingResult = { label: string; value: number; estimate: string; note: string }[]

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { state, addToCart } = useStore()
  const product = state.products.find((p) => p.slug === slug && p.active)

  const [color, setColor] = useState<string>(product?.colors[0] ?? '')
  const [size, setSize] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [cep, setCep] = useState('')
  const [shipping, setShipping] = useState<ShippingResult | null>(null)
  const [loadingCep, setLoadingCep] = useState(false)

  const related = useMemo(() => {
    if (!product) return []
    const same = state.products.filter((p) => p.active && p.category === product.category && p.id !== product.id)
    const extra = state.products.filter((p) => p.active && p.category !== product.category && p.id !== product.id)
    return [...same, ...extra].slice(0, 4)
  }, [product, state.products])

  if (!product) {
    return (
      <div className="container-mandrake py-24 text-center">
        <p className="font-display text-4xl uppercase">Produto não encontrado</p>
        <p className="mt-3 text-sm text-muted-foreground">A peça que você procura pode ter saído do catálogo.</p>
        <Button asChild className="mt-6 rounded-sm"><Link to="/produtos">Voltar ao catálogo</Link></Button>
      </div>
    )
  }

  const stockFor = (s: string, c: string) => product.variants.find((v) => v.size === s && v.color === c)?.stock ?? 0
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0)
  const currentStock = size ? stockFor(size, color) : 0
  const discount = discountPercent(product.price, product.comparePrice)

  const selectColor = (name: string) => {
    setColor(name)
    if (size && stockFor(size, name) === 0) setSize('')
  }

  const handleAdd = (goToCheckout = false) => {
    if (!size) {
      toast.error('Selecione um tamanho para continuar')
      return
    }
    if (currentStock < qty) {
      toast.error('Quantidade indisponível para esta combinação')
      return
    }
    addToCart(product.id, size, color, qty)
    toast.success(`${product.name} no carrinho`, { description: `Tam. ${size} · ${color} · ${qty} un.` })
    if (goToCheckout) navigate('/checkout')
  }

  const calcShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      toast.error('Informe um CEP válido com 8 dígitos')
      return
    }
    setLoadingCep(true)
    setShipping(null)
    const settings = state.settings
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error('CEP não encontrado. Confira o número digitado.')
      } else {
        const isLocal = isPatosCep(digits) || data.localidade?.toLowerCase() === settings.city.toLowerCase()
        const options: ShippingResult = []
        if (isLocal) {
          options.push({
            label: 'Entrega regional — Patos de Minas',
            value: product.price * qty >= settings.regionalFreeAbove ? 0 : settings.regionalFallbackFee,
            estimate: settings.regionalEstimate,
            note: product.price * qty >= settings.regionalFreeAbove ? 'Entrega grátis nesta compra' : `Grátis acima de ${brl(settings.regionalFreeAbove)}`,
          })
        } else {
          options.push({
            label: 'Entrega nacional',
            value: settings.nationalFlatFee,
            estimate: settings.nationalEstimate,
            note: `Envio para todo o Brasil`,
          })
        }
        options.push({ label: 'Retirada na loja', value: 0, estimate: 'Disponível em 1 dia útil', note: 'Vereador João Pacheco, 985 — P. de Minas' })
        setShipping(options)
        toast.success(`${data.localidade} — ${data.uf}`)
      }
    } catch {
      toast.error('Não foi possível consultar o CEP agora. O frete pode ser calculado no checkout.')
    } finally {
      setLoadingCep(false)
    }
  }

  return (
    <div className="container-mandrake py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link><ChevronRight className="size-3" />
        <Link to={`/categoria/${product.category}`} className="hover:text-foreground">{state.categories.find((c) => c.slug === product.category)?.name}</Link>
        <ChevronRight className="size-3" /><span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-16">
        <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
          <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
            {product.images.map((img, i) => (
              <button key={img + i} onClick={() => setActiveImage(i)} className={cn('aspect-[4/5] w-20 shrink-0 overflow-hidden border transition-colors', i === activeImage ? 'border-white' : 'border-border hover:border-white/50')}>
                <img src={img} alt={`${product.name} ${i + 1}`} className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <div
            className="group relative order-1 aspect-[4/5] cursor-zoom-in overflow-hidden bg-secondary sm:order-2"
            onClick={() => setZoom(true)}
          >
            <img src={product.images[activeImage]} alt={product.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
            {discount > 0 && <span className="absolute left-4 top-4 bg-white px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-black">-{discount}%</span>}
            <span className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur">
              <ZoomIn className="size-3.5" /> Ampliar
            </span>
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">{product.brand}</p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-4xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold">{brl(product.price)}</span>
            {product.comparePrice && <span className="text-sm text-muted-foreground line-through">{brl(product.comparePrice)}</span>}
            {discount > 0 && <span className="bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">-{discount}%</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">ou 3x de {brl(product.price / 3)} sem juros no cartão</p>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Cor</p>
                <p className="text-[11px] text-muted-foreground">{color}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const out = product.sizes.every((s) => stockFor(s, c) === 0)
                  return (
                    <button
                      key={c}
                      onClick={() => selectColor(c)}
                      disabled={out}
                      title={c}
                      className={cn('h-9 rounded-sm border px-3 text-[11px] uppercase tracking-wider transition-colors', color === c ? 'border-white bg-white text-black' : 'border-border hover:border-white/50', out && 'cursor-not-allowed opacity-30')}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Tamanho</p>
                <button onClick={() => toast.info('Tabela de medidas: P 96cm · M 100cm · G 106cm · GG 112cm (tórax)')} className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground">Guia de medidas</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const stock = stockFor(s, color)
                  const disabled = stock === 0
                  return (
                    <button
                      key={s}
                      onClick={() => { setSize(s); setQty(1) }}
                      disabled={disabled}
                      className={cn('h-10 min-w-11 border px-3 text-xs font-medium uppercase tracking-wider transition-colors', size === s ? 'border-white bg-white text-black' : 'border-border hover:border-white/60', disabled && 'cursor-not-allowed border-border/50 text-muted-foreground/40 line-through hover:border-border/50')}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
              {size && <p className={cn('mt-2 text-[11px]', currentStock <= 3 ? 'text-amber-300' : 'text-muted-foreground')}>{currentStock <= 3 ? `Últimas ${currentStock} unidades neste tamanho` : `${currentStock} unidades disponíveis`}</p>}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-10 place-items-center hover:bg-accent" aria-label="Diminuir"><Minus className="size-3.5" /></button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(currentStock || 1, q + 1))} className="grid size-10 place-items-center hover:bg-accent" aria-label="Aumentar"><Plus className="size-3.5" /></button>
              </div>
              <p className="text-[11px] text-muted-foreground">{totalStock > 0 ? 'Pronta entrega' : 'Esgotado'}</p>
            </div>

            <div className="grid gap-2">
              <Button onClick={() => handleAdd(false)} disabled={totalStock === 0} className="h-12 rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
                <ShoppingBag className="size-4" /> Adicionar ao carrinho
              </Button>
              <Button onClick={() => handleAdd(true)} disabled={totalStock === 0} variant="outline" className="h-12 rounded-sm text-[11px] font-bold uppercase tracking-[0.18em]">
                Comprar agora
              </Button>
            </div>
          </div>

          <form onSubmit={calcShipping} className="mt-6 border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"><Truck className="size-3.5" /> Calcular frete e prazo</p>
            <div className="flex gap-2">
              <input value={cep} onChange={(e) => setCep(maskCep(e.target.value))} placeholder="00000-000" inputMode="numeric" className="h-10 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-white/50" aria-label="CEP" />
              <Button type="submit" variant="secondary" className="h-10 rounded-sm text-[11px] uppercase tracking-[0.14em]" disabled={loadingCep}>
                {loadingCep ? '...' : 'Calcular'}
              </Button>
            </div>
            {shipping && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {shipping.map((opt) => (
                  <div key={opt.label} className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.estimate} · {opt.note}</p>
                    </div>
                    <p className="whitespace-nowrap font-semibold">{opt.value === 0 ? 'Grátis' : brl(opt.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="mt-5 grid gap-2 text-[11px] text-muted-foreground">
            <p className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> Produto original com nota fiscal e garantia</p>
            <p className="flex items-center gap-2"><Check className="size-3.5" /> Troca facilitada em até 30 dias</p>
            <a href={whatsappLink(state.settings.whatsapp, `Olá! Tenho dúvidas sobre ${product.name}.`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground"><MessageCircle className="size-3.5" /> Falar com um consultor no WhatsApp</a>
          </div>

          <details className="mt-6 border-t border-border pt-4">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em]">Detalhes e composição</summary>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{product.description}</p>
          </details>
        </div>
      </div>

      <section className="pt-20">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Complete o look</p>
        <h2 className="mb-8 border-b border-border pb-4 font-display text-3xl uppercase tracking-wide">Você também pode gostar</h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setZoom(false)} role="dialog" aria-label="Imagem ampliada">
          <img src={product.images[activeImage]} alt={product.name} className="max-h-full max-w-full object-contain" />
          <button onClick={() => setZoom(false)} className="absolute right-5 top-5 grid size-10 place-items-center border border-white/30 text-white hover:bg-white hover:text-black">Fechar</button>
        </div>
      )}
    </div>
  )
}
