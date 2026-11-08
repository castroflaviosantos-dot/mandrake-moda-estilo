import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ProductCard } from '@/components/site/ProductCard'
import { Button } from '@/components/ui/button'
import { whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'

function SectionHead({ eyebrow, title, to, linkLabel = 'Ver tudo' }: { eyebrow: string; title: string; to?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
        <h2 className="font-display text-3xl uppercase leading-none tracking-wide sm:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="group hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground sm:flex">
          {linkLabel} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

function Hero() {
  const { state } = useStore()
  const banners = state.banners.filter((b) => b.active)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000)
    return () => window.clearInterval(id)
  }, [banners.length])

  if (!banners.length) return null
  const slide = banners[Math.min(index, banners.length - 1)]

  return (
    <section className="relative h-[78svh] min-h-[520px] w-full overflow-hidden bg-black" aria-label="Destaques da loja">
      {banners.map((b, i) => (
        <div key={b.id} className={cn('absolute inset-0 transition-opacity duration-[900ms] ease-out', i === index ? 'opacity-100' : 'opacity-0')} aria-hidden={i !== index}>
          <img src={b.image} alt="" className={cn('size-full object-cover object-center transition-transform duration-[6000ms] ease-out', i === index ? 'scale-105' : 'scale-100')} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>
      ))}

      <div className="container-mandrake relative flex h-full flex-col justify-end pb-16 sm:justify-center sm:pb-0">
        <div key={slide.id} className="max-w-2xl anim-fade-up">
          <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/70">
            <span className="h-px w-8 bg-white/50" /> {slide.eyebrow}
          </p>
          <h1 className="font-display text-[13vw] uppercase leading-[0.88] tracking-tight text-white sm:text-7xl lg:text-8xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">{slide.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-7 text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
              <Link to={slide.ctaLink}>{slide.ctaLabel} <ArrowUpRight className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-white/5 px-7 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur hover:bg-white hover:text-black">
              <Link to="/produtos">Ver catálogo</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-mandrake absolute inset-x-0 bottom-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={cn('h-[3px] transition-all', i === index ? 'w-10 bg-white' : 'w-5 bg-white/35 hover:bg-white/60')}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)} aria-label="Slide anterior" className="grid size-10 place-items-center border border-white/25 text-white hover:bg-white hover:text-black">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setIndex((i) => (i + 1) % banners.length)} aria-label="Próximo slide" className="grid size-10 place-items-center border border-white/25 text-white hover:bg-white hover:text-black">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { state } = useStore()
  const products = state.products.filter((p) => p.active)
  const bestSellers = products.filter((p) => p.tags.includes('mais-vendidos')).slice(0, 4)
  const news = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  const offers = products.filter((p) => p.comparePrice && p.comparePrice > p.price).slice(0, 4)
  const featured = products.filter((p) => p.tags.includes('destaque')).slice(0, 3)
  const brands = useMemo(() => state.brands, [state.brands])

  return (
    <>
      <Hero />

      <section className="container-mandrake -mt-8 relative z-20 sm:-mt-10">
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {[
            { t: 'Frete grátis', s: 'Acima de R$ 499' },
            { t: '3x sem juros', s: 'Pix e cartão' },
            { t: 'Entrega local', s: 'Patos de Minas' },
            { t: 'Revenda autorizada', s: 'Marcas originais' },
          ].map((item) => (
            <div key={item.t} className="bg-card px-5 py-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">{item.t}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-mandrake pt-20">
        <SectionHead eyebrow="Navegue por estilo" title="Categorias" to="/produtos" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {state.categories.filter((c) => c.active).map((cat, i) => (
            <Link key={cat.id} to={`/categoria/${cat.slug}`} className={cn('group relative overflow-hidden bg-secondary', i === 0 ? 'col-span-2 row-span-2 lg:col-span-2' : '')}>
              <div className={cn('w-full overflow-hidden', i === 0 ? 'aspect-square lg:aspect-auto lg:h-full' : 'aspect-[4/5]')}>
                <img src={cat.image} alt={cat.name} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className={cn('font-display uppercase leading-none tracking-wide', i === 0 ? 'text-2xl sm:text-3xl' : 'text-lg')}>{cat.name}</p>
                <p className="mt-1 hidden text-[10px] uppercase tracking-[0.18em] text-white/60 sm:block">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-mandrake pt-20">
        <SectionHead eyebrow="Escolhas de quem entende" title="Mais vendidos" to="/produtos" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container-mandrake pt-20">
        <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
          {featured.map((p) => (
            <Link key={p.id} to={`/produto/${p.slug}`} className="group relative block bg-card">
              <div className="aspect-[16/11] overflow-hidden">
                <img src={p.images[0]} alt={p.name} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">{p.brand}</p>
                <p className="mt-1 text-lg font-medium leading-snug">{p.name}</p>
                <p className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/80">Ver produto <ArrowUpRight className="size-3.5" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-mandrake pt-20">
        <SectionHead eyebrow="Acabou de chegar" title="Novidades" to="/novidades" linkLabel="Ver novidades" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {news.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container-mandrake pt-20">
        <SectionHead eyebrow="Por tempo limitado" title="Ofertas especiais" to="/ofertas" linkLabel="Ver ofertas" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {offers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container-mandrake pt-24">
        <div className="relative overflow-hidden border border-border bg-card">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="p-8 sm:p-14">
              <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                <Sparkles className="size-3.5" /> Atendimento exclusivo
              </p>
              <h2 className="font-display text-4xl uppercase leading-[0.92] sm:text-5xl">Seu estilo,<br />seu atendimento.</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                Fale com a equipe Mandrake pelo WhatsApp e receba sugestões de looks, informações de tamanhos e novidades antes de todo mundo.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="h-11 bg-white px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-black hover:bg-white/90">
                  <a href={whatsappLink(state.settings.whatsapp, 'Olá! Quero ajuda para escolher meu look.')} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
                </Button>
                <Button asChild variant="outline" className="h-11 px-6 text-[11px] font-bold uppercase tracking-[0.16em]">
                  <Link to="/produtos">Explorar loja</Link>
                </Button>
              </div>
            </div>
            <div className="h-64 w-full overflow-hidden lg:h-[420px]">
              <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" alt="Loja Mandrake" className="size-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20">
        <div className="border-y border-border py-5">
          <div className="container-mandrake flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {brands.map((b) => (
              <Link key={b.id} to="/produtos" className="font-display text-xl uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-white sm:text-2xl">{b.name}</Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
