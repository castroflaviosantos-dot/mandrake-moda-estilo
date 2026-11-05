import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Store, Tag, Truck, Users, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { LoginCard } from './LoginCard'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag },
  { to: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/entregas', label: 'Entregas e frete', icon: Truck },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout() {
  const { isAdmin, logoutAdmin, state } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-black px-4">
        <LoginCard onSuccess={() => navigate('/admin', { replace: true })} />
      </div>
    )
  }

  const pending = state.orders.filter((o) => o.status === 'aguardando_pagamento' || o.status === 'preparando').length

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => cn(
            'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-xs transition-colors',
            isActive ? 'bg-white text-black' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <Icon className="size-4" /> <span className="flex-1">{label}</span>
          {to === '/admin/pedidos' && pending > 0 && (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-black">{pending}</span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-black lg:flex">
        <div className="border-b border-border px-5 py-5">
          <p className="font-display text-lg uppercase leading-none tracking-[0.18em]">Mandrake</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Painel de gestão</p>
        </div>
        {nav}
        <div className="space-y-1 border-t border-border p-2">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground"><Store className="size-4" /> Ver loja <ArrowUpRight className="ml-auto size-3" /></NavLink>
          <button onClick={() => { logoutAdmin(); navigate('/admin', { replace: true }) }} className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground"><LogOut className="size-4" /> Sair</button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex w-64 flex-col bg-black">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="font-display text-base uppercase tracking-[0.18em]">Mandrake</p>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="size-4" /></button>
            </div>
            {nav}
          </div>
          <button className="flex-1 bg-black/70" onClick={() => setOpen(false)} aria-label="Fechar menu" />
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-black/95 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]"><Menu className="size-4" /> Painel</button>
          <button onClick={() => { logoutAdmin(); navigate('/admin', { replace: true }) }} aria-label="Sair" className="text-muted-foreground"><LogOut className="size-4" /></button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
        <footer className="border-t border-border px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8">Mandrake Moda e Estilo · Patos de Minas — MG</footer>
      </div>
    </div>
  )
}
