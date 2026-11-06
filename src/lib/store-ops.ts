import type { CartItem, Order, OrderStatus, Product, StoreState } from './types'
import type { CartLine } from './store-core'
import { buildDeliveryOptions, computeTotals } from './shipping'
import { uid } from './format'

export function cartLinesOf(state: StoreState): CartLine[] {
  const lines: CartLine[] = []
  for (const item of state.cart) {
    const product = state.products.find((p) => p.id === item.productId)
    if (!product || !product.active) continue
    const variant = product.variants.find((v) => v.size === item.size && v.color === item.color)
    const unitPrice = product.price
    lines.push({
      product,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice,
      total: unitPrice * item.quantity,
      stock: variant?.stock ?? 0,
    })
  }
  return lines
}

export function computeDiscount(subtotal: number): number {
  return subtotal >= 800 ? Math.round(subtotal * 0.1 * 100) / 100 : 0
}

export function upsertCart(state: StoreState, productId: string, quantity: number, size: string, color: string): CartItem[] {
  const existing = state.cart.find((i) => i.productId === productId && i.size === size && i.color === color)
  if (existing) {
    return state.cart.map((i) => (i === existing ? { ...i, quantity: Math.max(1, i.quantity + quantity) } : i))
  }
  return [...state.cart, { productId, size, color, quantity: Math.max(1, quantity) }]
}

export function decrementStock(state: StoreState, items: CartItem[]): Product[] {
  return state.products.map((product) => {
    const affected = items.filter((i) => i.productId === product.id)
    if (!affected.length) return product
    return {
      ...product,
      variants: product.variants.map((variant) => {
        const hit = affected.find((i) => i.size === variant.size && i.color === variant.color)
        return hit ? { ...variant, stock: Math.max(0, variant.stock - hit.quantity) } : variant
      }),
    }
  })
}

export function buildLocalOrder(input: {
  state: StoreState
  customer: Order['customer']
  address: Order['address']
  items: CartItem[]
  deliveryMethod: Order['deliveryMethod']
  paymentMethod: Order['paymentMethod']
  notes: string
  discount: number
  neighborhoodFee?: number
}): Order {
  const lines = cartLinesOf({ ...input.state, cart: input.items })
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0)
  const options = buildDeliveryOptions(input.state)
  const chosen = options.find((o) => o.method === input.deliveryMethod) ?? options[0]
  const shipping = input.deliveryMethod === 'retirada' ? 0 : (input.neighborhoodFee ?? chosen.fee)
  const totals = computeTotals(subtotal, input.discount, shipping)
  return {
    id: uid('ord'),
    code: String(2000 + Math.floor(Math.random() * 7000)),
    token: uid('tk'),
    createdAt: new Date().toISOString(),
    customer: input.customer,
    address: input.address,
    items: lines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      image: l.product.images[0] ?? '',
      price: l.unitPrice,
      quantity: l.quantity,
      size: l.size,
      color: l.color,
    })),
    subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    deliveryMethod: input.deliveryMethod,
    deliveryLabel: input.deliveryMethod === 'retirada' ? 'Retirada na loja' : chosen.label,
    deliveryEstimate: input.deliveryMethod === 'retirada' ? 'Retirada imediata' : chosen.estimate,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'pending',
    status: 'aguardando_pagamento',
    notes: input.notes,
    adminNote: '',
  }
}

export function patchOrder(orders: Order[], id: string, patch: Partial<Order>): Order[] {
  return orders.map((o) => (o.id === id ? { ...o, ...patch } : o))
}

export const STATUS_FLOW: OrderStatus[] = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado']
