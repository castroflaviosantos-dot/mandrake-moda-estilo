import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { OrderDetail } from '@/components/site/OrderStatus'
import { whatsappLink } from '@/lib/format'
import type { Order } from '@/lib/types'

export default function OrderConfirmed() {
  const { code } = useParams()
  const { state, findOrder, trackOrder } = useStore()
  const [order, setOrder] = useState<Order | undefined>(() => (code ? findOrder(code) : undefined))

  useEffect(() => {
    if (!code) return
    const local = findOrder(code)
    if (local) setOrder(local)
    void trackOrder(code).then((remote) => {
      if (remote) setOrder(remote)
      // Sem a confirmação do banco, o pedido salvo na própria sessão ainda aparece
      else if (!local) {
        const saved = findOrder(code)
        if (saved) setOrder(saved)
      }
    })
  }, [code, findOrder, trackOrder])

  if (!order) {
    return (
      <div className="container-mandrake py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Pedido não encontrado</h1>
        <p className="mt-3 text-sm text-muted-foreground">Consulte o pedido pela área do cliente usando o número e o e-mail cadastrado.</p>
        <Button asChild className="mt-6 bg-white text-black"><Link to="/conta">Área do cliente</Link></Button>
      </div>
    )
  }

  return (
    <div className="container-mandrake max-w-3xl py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-white text-black"><Check className="size-6" /></div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Pedido recebido</p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">Obrigado, {order.customer.name.split(' ')[0]}!</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Seu pedido <span className="text-foreground">#{order.code}</span> foi registrado. Guarde este número para acompanhar a entrega.
        </p>
      </div>

      <OrderDetail order={order} />

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1 bg-white text-[11px] uppercase tracking-[0.16em] text-black hover:bg-white/90">
          <Link to={`/acompanhar?codigo=${order.code}`}>Acompanhar pedido</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 text-[11px] uppercase tracking-[0.16em]">
          <a href={whatsappLink(state.settings.whatsapp, `Olá! Acabei de fazer o pedido #${order.code}.`)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Falar com a loja</a>
        </Button>
      </div>
      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Link seguro: /acompanhar?codigo={order.code}</p>
    </div>
  )
}
