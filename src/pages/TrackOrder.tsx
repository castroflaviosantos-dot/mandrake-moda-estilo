import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { OrderDetail } from '@/components/site/OrderStatus'
import type { Order } from '@/lib/types'

export default function TrackOrder() {
  const { findOrder, trackOrder } = useStore()
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('codigo') ?? '')
  const [found, setFound] = useState<Order | null>(() => findOrder(params.get('codigo') ?? '') ?? null)
  const [tried, setTried] = useState(!!params.get('codigo'))
  const [loading, setLoading] = useState(false)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const order = (await trackOrder(code)) ?? findOrder(code) ?? null
      setFound(order)
      setTried(true)
      if (order) {
        setParams({ codigo: order.code })
        toast.success(`Pedido #${order.code} encontrado`)
      } else {
        toast.error('Pedido não encontrado. Confira o número.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-mandrake max-w-3xl py-12">
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Consulta segura</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none">Acompanhar pedido</h1>
        <p className="mt-3 text-sm text-muted-foreground">Digite o número do pedido recebido na confirmação da compra.</p>
      </header>

      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex.: MDK-0001"
          className="h-11 flex-1 border border-border bg-background px-3 text-sm outline-none focus:border-white/60"
        />
        <Button type="submit" disabled={loading} className="h-11 bg-white px-5 text-[11px] uppercase tracking-[0.14em] text-black hover:bg-white/90">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Buscar
        </Button>
      </form>

      {found && <div className="mt-8"><OrderDetail order={found} /></div>}
      {tried && !found && (
        <p className="mt-6 border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          Não localizamos este número. Verifique se digitou exatamente como na confirmação ou fale com a loja pelo WhatsApp.
        </p>
      )}
    </div>
  )
}
