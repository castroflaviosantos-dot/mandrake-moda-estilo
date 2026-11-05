import type { DeliveryMethod, Order, OrderItem, OrderStatus, PaymentStatus } from './types'
import { SEED_PRODUCTS } from './data-products'

const customers: [string, string, string][] = [
  ['Marina Alves', 'marina.alves@email.com', '(34) 99811-2233'],
  ['Rafael Campos', 'rafael.campos@email.com', '(34) 99123-4455'],
  ['Juliana Prado', 'juliana.prado@email.com', '(34) 98877-6655'],
  ['Bruno Silveira', 'bruno.silveira@email.com', '(34) 99911-2244'],
  ['Camila Resende', 'camila.resende@email.com', '(34) 99234-5678'],
  ['Diego Fontes', 'diego.fontes@email.com', '(34) 98111-2233'],
  ['Larissa Melo', 'larissa.melo@email.com', '(34) 99344-5566'],
  ['Thiago Barros', 'thiago.barros@email.com', '(34) 99455-6677'],
  ['Aline Duarte', 'aline.duarte@email.com', '(34) 99566-7788'],
  ['Gustavo Nunes', 'gustavo.nunes@email.com', '(34) 99677-8899'],
]

const neighborhoods = ['Centro', 'Rosário', 'Sobradinho', 'Caiçaras', 'Bela Vista', 'Cidade Jardim']
const fees: Record<string, number> = { Centro: 8, Rosário: 10, Sobradinho: 12, Caiçaras: 14, 'Bela Vista': 14, 'Cidade Jardim': 16 }

function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export const SEED_ORDERS: Order[] = (() => {
  const rnd = makeRng(87654321)
  const active = SEED_PRODUCTS.filter((p) => p.active)
  const orders: Order[] = []

  for (let i = 0; i < 58; i++) {
    const daysAgo = Math.floor(Math.pow(rnd(), 1.5) * 110)
    const created = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rnd() * 18) * 3600000)
    const cust = customers[Math.floor(rnd() * customers.length)]
    const itemCount = 1 + Math.floor(rnd() * 3)
    const items: OrderItem[] = []
    for (let j = 0; j < itemCount; j++) {
      const prod = active[Math.floor(rnd() * active.length)]
      if (items.some((it) => it.productId === prod.id)) continue
      items.push({
        productId: prod.id,
        name: prod.name,
        brand: prod.brand,
        image: prod.images[0],
        size: prod.sizes[Math.floor(rnd() * prod.sizes.length)],
        color: prod.colors[Math.floor(rnd() * prod.colors.length)].name,
        price: prod.price,
        quantity: 1 + Math.floor(rnd() * 2),
      })
    }
    const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0)
    const roll = rnd()
    const deliveryMethod: DeliveryMethod = roll < 0.5 ? 'regional' : roll < 0.9 ? 'nacional' : 'retirada'
    const neighborhood = neighborhoods[Math.floor(rnd() * neighborhoods.length)]
    const shipping = deliveryMethod === 'retirada' ? 0 : deliveryMethod === 'regional' ? fees[neighborhood] : subtotal >= 399 ? 0 : 29.9
    const paid = rnd() < 0.84
    const paymentStatus: PaymentStatus = paid ? 'approved' : 'pending'
    let status: OrderStatus
    if (!paid) status = daysAgo > 7 ? 'cancelado' : 'aguardando_pagamento'
    else if (daysAgo <= 1) status = 'pago'
    else if (daysAgo <= 3) status = 'preparando'
    else if (daysAgo <= 6) status = 'enviado'
    else status = 'concluido'

    orders.push({
      id: `ord-seed-${i + 1}`,
      code: String(1040 + i * 7),
      token: `tk${(i + 1) * 7919}`,
      createdAt: created.toISOString(),
      customer: { name: cust[0], email: cust[1], phone: cust[2], cpf: '000.000.000-00' },
      address: {
        cep: '38700-000', state: 'MG', city: 'Patos de Minas', neighborhood,
        street: 'Rua das Acácias', number: String(100 + Math.floor(rnd() * 800)),
        complement: '', reference: '',
      },
      items,
      subtotal,
      discount: 0,
      shipping,
      total: subtotal + shipping,
      deliveryMethod,
      deliveryLabel: deliveryMethod === 'nacional' ? 'Entrega nacional' : deliveryMethod === 'regional' ? 'Entrega regional — Patos de Minas' : 'Retirada na loja',
      deliveryEstimate: deliveryMethod === 'retirada' ? 'Disponível em 1 dia útil' : deliveryMethod === 'regional' ? 'Em até 24h' : '4 a 9 dias úteis',
      paymentMethod: rnd() < 0.6 ? 'pix' : 'cartao',
      paymentStatus,
      status,
      notes: '',
    })
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})()
