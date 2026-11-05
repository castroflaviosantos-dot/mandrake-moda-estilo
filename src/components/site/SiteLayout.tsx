import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Header } from './Header'
import { Footer } from './Footer'
import { useStore } from '@/lib/store'
import { whatsappLink } from '@/lib/format'

export function SiteLayout() {
  const { pathname } = useLocation()
  const { state } = useStore()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <a
        href={whatsappLink(state.settings.whatsapp, 'Olá! Vim pelo site da Mandrake e gostaria de atendimento.')}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black shadow-2xl transition-transform hover:scale-105"
      >
        <MessageCircle className="size-4" />
        <span className="hidden sm:inline">Atendimento</span>
      </a>
    </div>
  )
}
