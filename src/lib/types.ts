export type Category = {
  id: string
  name: string
  slug: string
  description: string
  image: string
  active: boolean
}

export type Brand = { id: string; name: string; slug: string }

export type ColorOption = { name: string; hex: string }

export type Variant = { size: string; color: string; stock: number }

export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  description: string
  shortDescription: string
  details: string[]
  price: number
  comparePrice?: number
  images: string[]
  colors: string[]
  sizes: string[]
  variants: Variant[]
  tags: string[]
  active: boolean
  createdAt: string
}

export type Banner = {
  id: string
  order: number
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaLink: string
  image: string
  active: boolean
}

export type CartItem = {
  key: string
  productId: string
  size: string
  color: string
  quantity: number
}

export type Customer = { name: string; email: string; phone: string; cpf: string }

export type Address = {
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  number: string
  complement: string
  reference: string
}

export type DeliveryMethod = 'nacional' | 'regional' | 'retirada'

export type DeliveryOption = {
  id: string
  method: DeliveryMethod
  label: string
  description: string
  price: number
  days: string
  available: boolean
}

export type PaymentMethod = 'pix' | 'cartao' | 'retirada'

export type PaymentStatus = 'pending' | 'approved' | 'failed' | 'refunded'

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'preparando'
  | 'enviado'
  | 'concluido'
  | 'cancelado'

export type OrderItem = {
  productId: string
  name: string
  brand: string
  image: string
  size: string
  color: string
  price: number
  quantity: number
}

export type Order = {
  id: string
  code: string
  token: string
  createdAt: string
  customer: Customer
  address: Address
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  deliveryMethod: DeliveryMethod
  deliveryLabel: string
  deliveryEstimate: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes: string
  adminNote?: string
}

export type Neighborhood = { id: string; name: string; fee: number; estimate: string; active: boolean }

export type Settings = {
  storeName: string
  whatsapp: string
  instagram: string
  email: string
  announcement: string
  address: { street: string; number: string; neighborhood: string; city: string; state: string; cep: string }
  city: string
  nationalFlatFee: number
  nationalFreeAbove: number
  nationalEstimate: string
  regionalFreeAbove: number
  regionalFallbackFee: number
  regionalEstimate: string
  carrierNote: string
  pickupInstructions: string
  pixKey: string
  gatewayNote: string
  demoMode: boolean
}

export type StoreSettings = Settings

export type StoreState = {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  banners: Banner[]
  orders: Order[]
  neighborhoods: Neighborhood[]
  settings: Settings
  cart: CartItem[]
  customer: Customer | null
  customerAddress: Address | null
  myOrderCodes: string[]
}
