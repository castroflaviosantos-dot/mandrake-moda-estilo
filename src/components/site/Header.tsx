import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, User, X, MessageCircle, ChevronDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Início', to: '/' },
  { label: 'Novidades', to: '/novidades' },
  { label: 'Masculino', to: '/categoria/camisetas' },
  { label: 'Calçados', to: '/categoria/calcados' },
  { label: 'Acessórios', to: '/categoria/acessorios' },
  { label: 'Marcas', to: '/produtos' },
]

export function Header() {
  const { state, cartCount } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    setMobileOpen(false)
    setCatOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : '/produtos')
    setMobileOpen(false)
  }

  const openCats = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setCatOpen(true)
  }
  const closeCats = () => {
    closeTimer.current = window.setTimeout(() => setCatOpen(false), 120)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="border-b border-border/60 bg-card/60">
        <div className="container-mandrake flex h-9 items-center justify-between text-[11px] tracking-wider text-muted-foreground">
          <p className="hidden sm:block">FRETE GRÁTIS ACIMA DE R$ 499 · ENTREGA EM PATOS DE MINAS</p>
          <p className="sm:hidden">FRETE GRÁTIS ACIMA DE R$ 499</p>
          <a href={whatsappLink(state.settings.whatsapp, 'Olá! Vim pelo site da Mandrake.')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
            <MessageCircle className="size-3.5" /> (34) 99879-5725
          </a>
        </div>
      </div>

      <div className="container-mandrake flex h-[72px] items-center gap-4">
        <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>

        <Link to="/" className="group flex items-center gap-2.5 leading-none">
          <img
            src="/logo-mandrake.png"
            alt="Mandrake Moda e Estilo"
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-contain ring-1 ring-white/10 transition-opacity group-hover:opacity-85"
          />
          <span className="flex flex-col">
            <span className="font-display text-[24px] tracking-[0.14em] text-foreground transition-opacity group-hover:opacity-80 sm:text-[26px]">MANDRAKE</span>
            <span className="hidden text-[9px] tracking-[0.42em] text-muted-foreground sm:block">MODA E ESTILO</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-[13px] font-medium lg:flex">
          <div className="relative" onMouseEnter={openCats} onMouseLeave={closeCats}>
            <button className="flex items-center gap-1 py-2 uppercase tracking-wider text-foreground/90 hover:text-foreground" onClick={() => setCatOpen((v) => !v)}>
              Categorias <ChevronDown className={cn('size-3.5 transition-transform', catOpen && 'rotate-180')} />
            </button>
            {catOpen && (
              <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 border border-border bg-card p-6 shadow-2xl anim-scale-in">
                <div className="grid grid-cols-2 gap-1">
                  {state.categories.filter((c) => c.active).map((cat) => (
                    <Link key={cat.id} to={`/categoria/${cat.slug}`} className="group flex items-center gap-3 rounded-sm p-2 hover:bg-accent">
                      <img src={cat.image} alt="" loading="lazy" className="size-11 rounded-sm object-cover" />
                      <div>
                        <p className="text-sm font-medium tracking-wide">{cat.name}</p>
                        <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Revenda autorizada</p>
                  <Link to="/produtos" className="text-[11px] uppercase tracking-[0.2em] underline underline-offset-4">Ver tudo</Link>
                </div>
              </div>
            )}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('py-2 uppercase tracking-wider text-foreground/70 transition-colors hover:text-foreground', isActive && 'text-foreground')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden items-center gap-2 border border-border bg-secondary/40 px-3 md:flex">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produtos, marcas..."
            className="h-9 w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground xl:w-56"
            aria-label="Buscar produtos"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link to="/conta" aria-label="Minha conta" className="grid size-10 place-items-center text-foreground/80 hover:bg-accent hover:text-foreground">
            <User className="size-[18px]" />
          </Link>
          <Link to="/carrinho" aria-label="Carrinho" className="relative grid size-10 place-items-center text-foreground/80 hover:bg-accent hover:text-foreground">
            <ShoppingBag className="size-[18px]" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <Button asChild size="sm" className="ml-2 hidden h-9 gap-2 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-white/90 lg:inline-flex">
            <a href={whatsappLink(state.settings.whatsapp, 'Olá! Gostaria de falar com a Mandrake.')} target="_blank" rel="noreferrer">
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-[72px] items-center justify-between border-b border-border px-5">
            <span className="flex items-center gap-2">
              <img src="/logo-mandrake.png" alt="" width={32} height={32} className="size-8 rounded-full object-contain ring-1 ring-white/10" />
              <span className="font-display text-xl tracking-[0.14em]">MANDRAKE</span>
            </span>
            <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X className="size-5" /></button>
          </div>
          <div className="px-5 py-6">
            <form onSubmit={submitSearch} className="mb-6 flex items-center gap-2 border border-border px-3">
              <Search className="size-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produtos" className="h-11 flex-1 bg-transparent text-sm outline-none" />
            </form>
            <nav className="flex flex-col divide-y divide-border/60">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="py-3 text-lg font-medium uppercase tracking-wide">{item.label}</Link>
              ))}
              {state.categories.map((cat) => (
                <Link key={cat.id} to={`/categoria/${cat.slug}`} className="py-3 text-sm text-muted-foreground">{cat.name}</Link>
              ))}
            </nav>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className=""><Link to="/conta">Minha conta</Link></Button>
              <Button asChild className=""><Link to="/carrinho">Carrinho ({cartCount})</Link></Button>
            </div>
            <Button asChild className="mt-2 w-full bg-white text-black">
              <a href={whatsappLink(state.settings.whatsapp, 'Olá! Vim pelo site.')} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
