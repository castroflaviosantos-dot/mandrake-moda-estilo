import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  Address, Banner, CartItem, Category, Customer, DeliveryMethod, DeliveryOption, Neighborhood,
  Order, OrderStatus, PaymentMethod, PaymentStatus, Product, StoreSettings, StoreState,
} from './types'
import { BANNERS, CATEGORIES, NEIGHBORHOODS, SETTINGS } from './data'
import { SEED_PRODUCTS } from './data-products'
import { SEED_ORDERS } from './data-orders'
import { buildDeliveryOptions, deliveryLabel } from './shipping'
import { slugify, uid } from './format'

const STORAGE_KEY = 'mandrake-store-v4'
const ADMIN_KEY = 'mandrake-admin-session'
const ADMIN_PASSWORD = 'mandrake2025'

export function createSeedState(): StoreState {
  return {
    products: SEED_PRODUCTS.map((p) => ({ ...p })),
    categories: CATEGORIES.map((c) => ({ ...c })),
    brands: [...new Set(SEED_PRODUCTS.map((p) => p.brand))].map((name, i) => ({ id: `br-${i + 1}`, name, slug: slugify(name) })),
    banners: BANNERS.map((b) => ({ ...b })),
    orders: SEED_ORDERS.map((o) => ({ ...o })),
    neighborhoods: NEIGHBORHOODS.map((n) => ({ ...n })),
    settings: { ...SETTINGS, address: { ...SETTINGS.address } },
    cart: [],
    customer: null,
    customerAddress: null,
    myOrderCodes: [],
  }
}

export type NewOrderInput = {
  customer: Customer
  address: Address
  deliveryMethod: DeliveryMethod
  deliveryEstimate: string
  discount: number
  paymentMethod: PaymentMethod
  notes: string
}

type StoreContextValue = {
  state: StoreState
  cartLines: { item: CartItem; product: Product; total: number }[]
  cartCount: number
  subtotal: number
  discount: number
  isAdmin: boolean
  loginAdmin: (password: string) => boolean
  logoutAdmin: () => void
  deliveryOptions: (cep: string, neighborhood?: string) => DeliveryOption[]
  addToCart: (productId: string, size: string, color: string, quantity?: number) => boolean
  updateCartItem: (key: string, changes: Partial<Pick<CartItem, 'quantity' | 'size' | 'color'>>) => void
  removeCartItem: (key: string) => void
  clearCart: () => void
  createOrder: (input: NewOrderInput) => Order
  findOrder: (code: string) => Order | undefined
  updateOrder: (id: string, changes: Partial<Order>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  markPaid: (id: string) => void
  saveProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  saveCategory: (category: Category) => void
  deleteCategory: (id: string) => void
  saveBanner: (banner: Banner) => void
  deleteBanner: (id: string) => void
  moveBanner: (id: string, dir: -1 | 1) => void
  updateSettings: (patch: Partial<StoreSettings>) => void
  saveNeighborhood: (n: Neighborhood) => void
  deleteNeighborhood: (id: string) => void
  saveCustomer: (customer: Customer, address: Address) => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function loadState(): StoreState {
  const seed = createSeedState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<StoreState>
    const banners = Array.isArray(parsed.banners) ? parsed.banners.filter(Boolean) : null
    return {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings ?? {}), address: { ...seed.settings.address, ...(parsed.settings?.address ?? {}) } },
      products: parsed.products?.length ? parsed.products.filter(Boolean) : seed.products,
      categories: parsed.categories?.length ? parsed.categories.filter(Boolean) : seed.categories,
      banners: banners && banners.length ? banners : seed.banners,
      brands: parsed.brands?.length ? parsed.brands : seed.brands,
      neighborhoods: parsed.neighborhoods?.length ? parsed.neighborhoods : seed.neighborhoods,
    orders: parsed.orders?.length ? parsed.orders.filter(Boolean) : seed.orders,
      cart: Array.isArray(parsed.cart) ? parsed.cart.filter(Boolean) : [],
      myOrderCodes: Array.isArray(parsed.myOrderCodes) ? parsed.myOrderCodes : [],
    }
  } catch {
    return seed
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try { return localStorage.getItem(ADMIN_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* indefinido */ }
  }, [state])

  const cartLines = useMemo(() => {
    return state.cart.flatMap((item) => {
      const product = state.products.find((p) => p.id === item.productId)
      if (!product) return []
      return [{ item, product, total: product.price * item.quantity }]
    })
  }, [state.cart, state.products])

  const cartCount = cartLines.reduce((acc, line) => acc + line.item.quantity, 0)
  const subtotal = cartLines.reduce((acc, line) => acc + line.total, 0)
  const discount = useMemo(() => {
    if (subtotal >= 500) return Math.round(subtotal * 0.05 * 100) / 100
    return 0
  }, [subtotal])

  const deliveryOptions = useCallback(
    (cep: string, neighborhood?: string) => buildDeliveryOptions(state.settings, { cep, subtotal, neighborhood }, state.neighborhoods ?? []),
    [state.settings, state.neighborhoods, subtotal],
  )

  const addToCart = useCallback((productId: string, size: string, color: string, quantity = 1) => {
    let added = false
    setState((prev) => {
      const product = prev.products.find((p) => p.id === productId)
      const stock = product?.variants.find((v) => v.size === size && v.color === color)?.stock ?? 0
      if (!product || stock <= 0) return prev
      const key = `${productId}::${size}::${color}`
      const existing = prev.cart.find((c) => c.key === key)
      const nextQty = Math.min(stock, (existing?.quantity ?? 0) + quantity)
      added = true
      const cart = existing
        ? prev.cart.map((c) => (c.key === key ? { ...c, quantity: nextQty } : c))
        : [...prev.cart, { key, productId, size, color, quantity: nextQty }]
      return { ...prev, cart }
    })
    return added
  }, [])

  const updateCartItem = useCallback((key: string, changes: Partial<Pick<CartItem, 'quantity' | 'size' | 'color'>>) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((c) => {
          if (c.key !== key) return c
          const product = prev.products.find((p) => p.id === c.productId)
          const size = changes.size ?? c.size
          const color = changes.color ?? c.color
          const stock = product?.variants.find((v) => v.size === size && v.color === color)?.stock ?? 0
          const quantity = Math.max(1, Math.min(stock || 1, changes.quantity ?? c.quantity))
          return { ...c, size, color, quantity, key: `${c.productId}::${size}::${color}` }
        })
        .filter((c) => {
          const product = prev.products.find((p) => p.id === c.productId)
          return product ? (product.variants.find((v) => v.size === c.size && v.color === c.color)?.stock ?? 0) > 0 : false
        }),
    }))
  }, [])

  const removeCartItem = useCallback((key: string) => {
    setState((prev) => ({ ...prev, cart: prev.cart.filter((c) => c.key !== key) }))
  }, [])

  const clearCart = useCallback(() => setState((prev) => ({ ...prev, cart: [] })), [])

  const saveCustomer = useCallback((customer: Customer, address: Address) => {
    setState((prev) => ({ ...prev, customer, customerAddress: address }))
  }, [])

  const findOrder = useCallback(
    (code: string) => state.orders.find((o) => o.code === code.trim() || o.token === code.trim()),
    [state.orders],
  )

  const createOrder = useCallback((input: NewOrderInput): Order => {
    const items = state.cart.flatMap((item) => {
      const product = state.products.find((p) => p.id === item.productId)
      if (!product) return []
      return [{
        productId: product.id, name: product.name, brand: product.brand, image: product.images[0],
        size: item.size, color: item.color, price: product.price, quantity: item.quantity,
      }]
    })
    const orderSubtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0)
    const options = buildDeliveryOptions(state.settings, { cep: input.address.cep, subtotal: orderSubtotal, neighborhood: input.address.neighborhood }, state.neighborhoods)
    const shipping = options.find((o) => o.method === input.deliveryMethod)?.price ?? 0
    const order: Order = {
      id: uid('ord'),
      code: String(2600 + state.orders.length),
      token: uid('tk'),
      createdAt: new Date().toISOString(),
      customer: input.customer,
      address: input.address,
      items,
      subtotal: orderSubtotal,
      discount: input.discount,
      shipping,
      total: Math.max(0, orderSubtotal - input.discount) + shipping,
      deliveryMethod: input.deliveryMethod,
      deliveryLabel: deliveryLabel(input.deliveryMethod),
      deliveryEstimate: input.deliveryEstimate,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending' as PaymentStatus,
      status: 'aguardando_pagamento' as OrderStatus,
      notes: input.notes,
    }
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product) => {
        const sold = items.filter((i) => i.productId === product.id)
        if (!sold.length) return product
        return {
          ...product,
          variants: product.variants.map((v) => {
            const match = sold.find((i) => i.size === v.size && i.color === v.color)
            return match ? { ...v, stock: Math.max(0, v.stock - match.quantity) } : v
          }),
        }
      }),
      cart: [],
      customer: input.customer,
      customerAddress: input.address,
      myOrderCodes: [order.code, ...prev.myOrderCodes.filter((c) => c !== order.code)],
      orders: [order, ...prev.orders],
    }))
    return order
  }, [state.cart, state.products, state.orders.length, state.settings, state.neighborhoods])

  const updateOrder = useCallback((id: string, changes: Partial<Order>) => {
    setState((prev) => ({ ...prev, orders: prev.orders.map((o) => (o.id === id ? { ...o, ...changes } : o)) }))
  }, [])

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id !== id) return o
        const paid = status === 'pago' || status === 'preparando' || status === 'enviado' || status === 'concluido'
        return { ...o, status, paymentStatus: paid ? 'approved' : status === 'cancelado' ? o.paymentStatus : o.paymentStatus }
      }),
    }))
  }, [])

  const markPaid = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, paymentStatus: 'approved', status: o.status === 'aguardando_pagamento' ? 'pago' : o.status } : o)),
    }))
  }, [])

  const loginAdmin = useCallback((password: string) => {
    const ok = password.trim() === ADMIN_PASSWORD
    if (ok) {
      try { localStorage.setItem(ADMIN_KEY, '1') } catch { /* indefinido */ }
      setIsAdmin(true)
    }
    return ok
  }, [])

  const logoutAdmin = useCallback(() => {
    try { localStorage.removeItem(ADMIN_KEY) } catch { /* indefinido */ }
    setIsAdmin(false)
  }, [])

  const saveProduct = useCallback((product: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.some((p) => p.id === product.id)
        ? prev.products.map((p) => (p.id === product.id ? product : p))
        : [{ ...product, id: product.id || uid('prod') }, ...prev.products],
    }))
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id), cart: prev.cart.filter((c) => c.productId !== id) }))
  }, [])

  const saveCategory = useCallback((category: Category) => {
    const normalized = { ...category, slug: slugify(category.slug || category.name) || uid('cat') }
    setState((prev) => ({
      ...prev,
      categories: prev.categories.some((c) => c.id === normalized.id)
        ? prev.categories.map((c) => (c.id === normalized.id ? normalized : c))
        : [...prev.categories, { ...normalized, id: normalized.id || uid('cat') }],
    }))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }))
  }, [])

  const saveBanner = useCallback((banner: Banner) => {
    setState((prev) => ({
      ...prev,
      banners: prev.banners.some((b) => b.id === banner.id)
        ? prev.banners.map((b) => (b.id === banner.id ? banner : b))
        : [...prev.banners, { ...banner, id: banner.id || uid('ban'), order: prev.banners.length + 1 }],
    }))
  }, [])

  const deleteBanner = useCallback((id: string) => {
    setState((prev) => ({ ...prev, banners: prev.banners.filter((b) => b.id !== id) }))
  }, [])

  const moveBanner = useCallback((id: string, dir: -1 | 1) => {
    setState((prev) => {
      const list = [...prev.banners].sort((a, b) => a.order - b.order)
      const index = list.findIndex((b) => b.id === id)
      const target = index + dir
      if (index < 0 || target < 0 || target >= list.length) return prev
      const a = list[index]
      const b = list[target]
      return {
        ...prev,
        banners: prev.banners.map((x) => (x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x)),
      }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const saveNeighborhood = useCallback((n: Neighborhood) => {
    setState((prev) => ({
      ...prev,
      neighborhoods: prev.neighborhoods.some((x) => x.id === n.id)
        ? prev.neighborhoods.map((x) => (x.id === n.id ? n : x))
        : [...prev.neighborhoods, { ...n, id: n.id || uid('nb') }],
    }))
  }, [])

  const deleteNeighborhood = useCallback((id: string) => {
    setState((prev) => ({ ...prev, neighborhoods: prev.neighborhoods.filter((n) => n.id !== id) }))
  }, [])

  const resetDemo = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* indefinido */ }
    setState(createSeedState())
  }, [])

  const value = useMemo<StoreContextValue>(() => ({
    state, cartLines, cartCount, subtotal, discount, isAdmin, loginAdmin, logoutAdmin,
    deliveryOptions, addToCart, updateCartItem, removeCartItem, clearCart, createOrder,
    findOrder, updateOrder, updateOrderStatus, markPaid, saveProduct, deleteProduct,
    saveCategory, deleteCategory, saveBanner, deleteBanner, moveBanner, updateSettings,
    saveNeighborhood, deleteNeighborhood, saveCustomer, resetDemo,
  }), [
    state, cartLines, cartCount, subtotal, discount, isAdmin, loginAdmin, logoutAdmin,
    deliveryOptions, addToCart, updateCartItem, removeCartItem, clearCart, createOrder,
    findOrder, updateOrder, updateOrderStatus, markPaid, saveProduct, deleteProduct,
    saveCategory, deleteCategory, saveBanner, deleteBanner, moveBanner, updateSettings,
    saveNeighborhood, deleteNeighborhood, saveCustomer, resetDemo,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore precisa estar dentro de StoreProvider')
  return ctx
}
