import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { ProductCard } from '@/components/site/ProductCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Mode = 'all' | 'news' | 'offers' | 'brands'

const titles: Record<string, { eyebrow: string; title: string; text: string }> = {
  all: { eyebrow: 'Catálogo completo', title: 'Todos os produtos', text: 'Curadoria de moda urbana, vestuário e marcas originais selecionadas pela Mandrake.' },
  news: { eyebrow: 'Acabou de chegar', title: 'Novidades', text: 'Os últimos lançamentos que entraram na loja. Quantidades limitadas.' },
  offers: { eyebrow: 'Por tempo limitado', title: 'Ofertas especiais', text: 'Peças selecionadas com preço reduzido enquanto durar o estoque.' },
  brands: { eyebrow: 'Revenda autorizada', title: 'Marcas', text: 'Trabalhamos apenas com marcas originais e representadas oficialmente.' },
}

export default function Catalog({ mode = 'all' }: { mode?: Mode }) {
  const { state } = useStore()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const slug = params.get('categoria')
  const [brand, setBrand] = useState<string>('todas')
  const [sort, setSort] = useState('relevancia')
  const [maxPrice, setMaxPrice] = useState(1000)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const category = slug ? state.categories.find((c) => c.slug === slug) : undefined

  const products = useMemo(() => {
    let list = state.products.filter((p) => p.active)
    if (category) list = list.filter((p) => p.category === category.slug)
    if (mode === 'news') list = list.filter((p) => Date.now() - new Date(p.createdAt).getTime() < 30 * 86400000)
    if (mode === 'offers') list = list.filter((p) => p.comparePrice && p.comparePrice > p.price)
    if (brand !== 'todas') list = list.filter((p) => p.brand === brand)
    if (query) {
      const term = query.toLowerCase()
      list = list.filter((p) =>
        [p.name, p.brand, p.shortDescription, p.description, ...p.tags].some((v) => v.toLowerCase().includes(term)),
      )
    }
    list = list.filter((p) => p.price <= maxPrice)
    if (sort === 'menor') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'maior') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'novidades') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'desconto') list = [...list].sort((a, b) => (b.comparePrice ?? b.price) - b.price - ((a.comparePrice ?? a.price) - a.price))
    return list
  }, [state.products, category, mode, brand, query, maxPrice, sort])

  const head = category
    ? { eyebrow: 'Categoria', title: category.name, text: category.description }
    : query
      ? { eyebrow: 'Resultado da busca', title: `“${query}”`, text: 'Produtos encontrados na loja.' }
      : titles[mode]

  const brands = [...new Set(state.products.map((p) => p.brand))]

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Categorias</p>
        <div className="flex flex-col gap-1.5">
          <Link to="/produtos" className={cn('text-sm transition-colors hover:text-foreground', !category ? 'text-foreground' : 'text-muted-foreground')}>Todas as peças</Link>
          {state.categories.filter((c) => c.active).map((c) => (
            <Link key={c.id} to={`/produtos?categoria=${c.slug}`} className={cn('text-sm transition-colors hover:text-foreground', category?.id === c.id ? 'text-foreground' : 'text-muted-foreground')}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Marcas</p>
        <div className="flex flex-wrap gap-1.5">
          {['todas', ...brands].map((b) => (
            <button key={b} onClick={() => setBrand(b)} className={cn('border px-2.5 py-1 text-[11px] transition-colors', brand === b ? 'border-white bg-white text-black' : 'border-border text-muted-foreground hover:text-foreground')}>
              {b === 'todas' ? 'Todas' : b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preço até</p>
        <input type="range" min={80} max={1000} step={20} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-white" />
        <p className="mt-2 text-xs text-muted-foreground">R$ {maxPrice.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  )

  return (
    <div className="container-mandrake py-10 sm:py-14">
      <nav className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link><span>/</span>
        <span className="text-foreground">{head.title}</span>
      </nav>

      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{head.eyebrow}</p>
        <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">{head.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{head.text}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[210px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-28">{filters}</div></aside>

        <div>
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-xs text-muted-foreground">{products.length} produto{products.length === 1 ? '' : 's'}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="size-3.5" /> Filtros
              </Button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 border border-border bg-card px-2 text-xs outline-none">
                <option value="relevancia">Relevância</option>
                <option value="novidades">Novidades</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="desconto">Maior desconto</option>
              </select>
            </div>
          </div>

          {products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="border border-border bg-card px-6 py-20 text-center">
              <p className="font-display text-2xl uppercase">Nenhum produto encontrado</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Ajuste os filtros ou fale com a equipe pelo WhatsApp para encontrar o que procura.</p>
              <Button asChild className="mt-6 rounded-sm"><Link to="/produtos">Ver todo o catálogo</Link></Button>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <p className="font-display text-xl uppercase">Filtros</p>
            <button onClick={() => setFiltersOpen(false)} aria-label="Fechar"><X className="size-5" /></button>
          </div>
          <div className="p-5">{filters}</div>
          <div className="px-5"><Button className="w-full rounded-sm" onClick={() => setFiltersOpen(false)}>Aplicar ({products.length})</Button></div>
        </div>
      )}
    </div>
  )
}
