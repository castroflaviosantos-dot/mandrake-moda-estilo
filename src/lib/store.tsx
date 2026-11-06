import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { defaultSettings, withDefaults } from './store-core'
import { loadCatalog, localKeys, message, readLocal, writeLocal } from './store-client'
import { remote, isSupabaseConfigured, type AdminSessionInfo } from './store-api'
import { buildDeliveryOptions } from './shipping'
import type { CartItem, Customer, Address, DeliveryMethod, Order, Product, StoreState } from './types'

type PlaceOrderInput = {
  customer: Customer
  address: Address
  deliveryMethod: DeliveryMethod
  deliveryLabel: string
  deliveryEstimate: string
  paymentMethod: Order['paymentMethod']
  notes: string
  subtotal: number
  discount: number
  shipping: number
  total: number
  items: Order['items']
}

type StoreContextValue = {
  state: StoreState
  ready: boolean
  usingDatabase: boolean
  syncError: string | null
  isAdmin: boolean
  admin: AdminSessionInfo | null
  authReady: boolean
  loginAdmin: (email: string, password: string) => Promise<boolean>
  loginError: string
  logoutAdmin: () => Promise<void>
  reload: () => Promise<void>
  cartLines: { item: CartItem; product: Product }[]
  cartCount: number
  subtotal: number
  deliveryOptions: ReturnType<typeof buildDeliveryOptions>
  addToCart: (productId: string, size: string, color: string, quantity?: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeFromCart: (key: string) => void
  clearCart: () => void
  saveCustomer: (customer: Customer) => Promise<void>
  placeOrder: (input: PlaceOrderInput) => Promise<Order>
  trackOrder: (code: string, token?: string) => Promise<Order | null>
  findOrdersByEmail: (email: string) => Promise<Order[]>
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  toggleProductActive: (id: string) => Promise<void>
  saveCategory: (category: StoreState['categories'][number]) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  saveBanner: (banner: StoreState['banners'][number]) => Promise<void>
  deleteBanner: (id: string) => Promise<void>
  saveNeighborhood: (item: StoreState['neighborhoods'][number]) => Promise<void>
  deleteNeighborhood: (id: string) => Promise<void>
  updateOrderStatus: (id: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => Promise<void>
  updateSettings: (patch: Partial<StoreState['settings']>) => Promise<void>
  uploadImage: (file: File) => Promise<string>
}

const StoreContext = createContext<StoreContextValue | null>(null)

type Action = { type: 'hydrate'; patch: Partial<StoreState> } | { type: 'patch'; patch: Partial<StoreState> }

function reducer(state: StoreState, action: Action): StoreState {
  return { ...state, ...action.patch }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => withDefaults({
    cart: readLocal<CartItem[]>(localKeys.cart, []),
    customer: readLocal<Customer | null>(localKeys.customer, null),
  }))
  const [ready, setReady] = useState(false)
  const [usingDatabase, setUsingDatabase] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [admin, setAdmin] = useState<AdminSessionInfo | null>(null)
  const [loginError, setLoginError] = useState('')
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)

  const patch = useCallback((next: Partial<StoreState>) => dispatch({ type: 'patch', patch: next }), [])

  const reload = useCallback(async () => {
    const result = await loadCatalog()
    setUsingDatabase(result.remote)
    setSyncError(result.error)
    patch(result.patch)
  }, [patch])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const result = await loadCatalog()
      if (!alive) return
      setUsingDatabase(result.remote)
      setSyncError(result.error)
      patch(result.patch)
      setReady(true)
    })()
    return () => { alive = false }
  }, [patch])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    remote.restore()
      .then((session) => setAdmin(session))
      .catch(() => setAdmin(null))
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => { writeLocal(localKeys.cart, state.cart) }, [state.cart])
  useEffect(() => { writeLocal(localKeys.customer, state.customer) }, [state.customer])

  const cartLines = useMemo(() => state.cart
    .map((item) => ({ item, product: state.products.find((p) => p.id === item.productId) }))
    .filter((line): line is { item: CartItem; product: Product } => Boolean(line.product)), [state.cart, state.products])

  const subtotal = useMemo(() => cartLines.reduce((sum, line) => sum + line.product.price * line.item.quantity, 0), [cartLines])
  const cartCount = useMemo(() => state.cart.reduce((sum, item) => sum + item.quantity, 0), [state.cart])

  const deliveryOptions = useMemo(() => buildDeliveryOptions(
    state.settings ?? defaultSettings,
    { cep: state.customerAddress?.cep ?? '', subtotal, neighborhood: state.customerAddress?.neighborhood },
    state.neighborhoods,
  ), [state.settings, state.customerAddress, state.neighborhoods, subtotal])

  const addToCart = useCallback((productId: string, size: string, color: string, quantity = 1) => {
    const key = `${productId}|${size}|${color}`
    const existing = state.cart.find((item) => item.key === key)
    const cart = existing
      ? state.cart.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
      : [...state.cart, { key, productId, size, color, quantity }]
    patch({ cart })
  }, [state.cart, patch])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    patch({ cart: quantity <= 0 ? state.cart.filter((item) => item.key !== key) : state.cart.map((item) => item.key === key ? { ...item, quantity } : item) })
  }, [state.cart, patch])

  const removeFromCart = useCallback((key: string) => patch({ cart: state.cart.filter((item) => item.key !== key) }), [state.cart, patch])
  const clearCart = useCallback(() => patch({ cart: [] }), [patch])

  const saveCustomer = useCallback(async (customer: Customer) => {
    patch({ customer })
    writeLocal(localKeys.customer, customer)
  }, [patch])

  const loginAdmin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError('')
    if (!isSupabaseConfigured) {
      setLoginError('Conexão com o banco não configurada neste ambiente.')
      return false
    }
    try {
      const session = await remote.signIn(email, password)
      setAdmin(session)
      await reload()
      try {
        const adminOrders = await remote.orders()
        patch({ orders: adminOrders })
      } catch {
        /* painel segue carregando o restante */
      }
      return true
    } catch (error) {
      setLoginError(message(error))
      return false
    }
  }, [reload, patch])

  const logoutAdmin = useCallback(async () => {
    await remote.signOut().catch(() => undefined)
    setAdmin(null)
    setLoginError('')
    patch({ orders: [] })
  }, [patch])

  const placeOrder = useCallback(async (input: PlaceOrderInput): Promise<Order> => {
    if (!usingDatabase) throw new Error('Não foi possível confirmar o pedido: conexão com o banco indisponível.')
    const result = await remote.place({
      customer: input.customer,
      address: input.address,
      items: input.items,
      subtotal: input.subtotal,
      discount: input.discount,
      shipping: input.shipping,
      total: input.total,
      deliveryMethod: input.deliveryMethod,
      deliveryLabel: input.deliveryLabel,
      deliveryEstimate: input.deliveryEstimate,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    })
    const order = await remote.track(result.code, result.token)
    if (!order) throw new Error('Pedido registrado, mas não foi possível carregá-lo.')
    writeLocal(localKeys.codes, [...roleCodes(result.code), result.code])
    await saveCustomer(input.customer)
    clearCart()
    await reload()
    return order
  }, [usingDatabase, saveCustomer, clearCart, reload])

  const trackOrder = useCallback(async (code: string, token?: string) => {
    if (!usingDatabase) throw new Error('Acompanhamento indisponível sem conexão com o banco.')
    return remote.track(code, token)
  }, [usingDatabase])

  const findOrdersByEmail = useCallback(async (email: string) => {
    if (!usingDatabase) return []
    try {
      return await remote.byEmail(email)
    } catch {
      return []
    }
  }, [usingDatabase])

  const saveProduct = useCallback(async (product: Product) => {
    if (usingDatabase) await remote.saveProduct(product)
    const exists = state.products.some((p) => p.id === product.id)
    patch({ products: exists ? state.products.map((p) => p.id === product.id ? product : p) : [product, ...state.products] })
  }, [usingDatabase, state.products, patch])

  const deleteProduct = useCallback(async (id: string) => {
    if (usingDatabase) await remote.removeProduct(id)
    patch({ products: state.products.filter((p) => p.id !== id) })
  }, [usingDatabase, state.products, patch])

  const toggleProductActive = useCallback(async (id: string) => {
    const product = state.products.find((p) => p.id === id)
    if (!product) return
    await saveProduct({ ...product, active: !product.active })
  }, [state.products, saveProduct])

  const saveCategory = useCallback(async (category: StoreState['categories'][number]) => {
    const exists = state.categories.some((c) => c.id === category.id)
    const categories = exists ? state.categories.map((c) => c.id === category.id ? category : c) : [...state.categories, category]
    if (usingDatabase) await remote.saveCategory(category, categories.findIndex((c) => c.id === category.id))
    patch({ categories })
  }, [usingDatabase, state.categories, patch])

  const deleteCategory = useCallback(async (id: string) => {
    if (usingDatabase) await remote.removeCategory(id)
    patch({ categories: state.categories.filter((c) => c.id !== id) })
  }, [usingDatabase, state.categories, patch])

  const saveBanner = useCallback(async (banner: StoreState['banners'][number]) => {
    if (usingDatabase) await remote.saveBanner(banner)
    const exists = state.banners.some((b) => b.id === banner.id)
    patch({ banners: exists ? state.banners.map((b) => b.id === banner.id ? banner : b) : [...state.banners, banner] })
  }, [usingDatabase, state.banners, patch])

  const deleteBanner = useCallback(async (id: string) => {
    if (usingDatabase) await remote.removeBanner(id)
    patch({ banners: state.banners.filter((b) => b.id !== id) })
  }, [usingDatabase, state.banners, patch])

  const saveNeighborhood = useCallback(async (item: StoreState['neighborhoods'][number]) => {
    if (usingDatabase) await remote.saveNeighborhood(item)
    const exists = state.neighborhoods.some((n) => n.id === item.id)
    patch({ neighborhoods: exists ? state.neighborhoods.map((n) => n.id === item.id ? item : n) : [...state.neighborhoods, item] })
  }, [usingDatabase, state.neighborhoods, patch])

  const deleteNeighborhood = useCallback(async (id: string) => {
    if (usingDatabase) await remote.removeNeighborhood(id)
    patch({ neighborhoods: state.neighborhoods.filter((n) => n.id !== id) })
  }, [usingDatabase, state.neighborhoods, patch])

  const updateOrderStatus = useCallback(async (id: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => {
    if (usingDatabase) await remote.updateOrder(id, { status, paymentStatus })
    patch({ orders: state.orders.map((o) => o.id === id ? { ...o, status, paymentStatus: paymentStatus ?? o.paymentStatus } : o) })
  }, [usingDatabase, state.orders, patch])

  const updateSettings = useCallback(async (settingsPatch: Partial<StoreState['settings']>) => {
    const settings = { ...state.settings, ...settingsPatch }
    if (usingDatabase) await remote.saveSettings(settings)
    patch({ settings })
  }, [usingDatabase, state.settings, patch])

  const uploadImage = useCallback(async (file: File) => {
    if (!usingDatabase) throw new Error('Envio de imagens disponível apenas com o banco conectado.')
    return remote.upload(file)
  }, [usingDatabase])

  const value: StoreContextValue = {
    state, ready, usingDatabase, syncError, isAdmin: Boolean(admin), admin, authReady,
    loginAdmin, loginError, logoutAdmin, reload,
    cartLines, cartCount, subtotal, deliveryOptions,
    addToCart, updateQuantity, removeFromCart, clearCart, saveCustomer,
    placeOrder, trackOrder, findOrdersByEmail,
    saveProduct, deleteProduct, toggleProductActive,
    saveCategory, deleteCategory, saveBanner, deleteBanner,
    saveNeighborhood, deleteNeighborhood, updateOrderStatus, updateSettings, uploadImage,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function roleCodes(code: string): string[] {
  try {
    const raw = localStorage.getItem(localKeys.codes)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(list) ? list.filter((c) => c !== code).slice(0, 19) : []
  } catch {
    return []
  }
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore precisa estar dentro de StoreProvider')
  return ctx
}

export { message }
