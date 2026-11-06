import { defaultSettings } from './data'
import * as api from './supabase'
import type { AdminSessionInfo } from './supabase'
import { isSupabaseConfigured } from './supabase'
import type { StoreAction, StoreState } from './store-core'

const LOCAL_KEY = 'mandrake-store-v4'

export type StoreApi = {
  state: StoreState
  ready: boolean
  syncError: string | null
  admin: AdminSessionInfo | null
  isAdmin: boolean
  loginAdmin: (email: string, password: string) => Promise<void>
  logoutAdmin: () => Promise<void>
  reload: () => Promise<void>
  addToCart: (productId: string, size: string, color: string, quantity?: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeFromCart: (key: string) => void
  clearCart: () => void
  saveCustomer: (customer: StoreState['customer']) => void
  placeOrder: (input: PlaceOrderInput) => Promise<import('./types').Order>
  trackOrder: (code: string, token?: string) => Promise<import('./types').Order | null>
  findOrdersByEmail: (email: string) => Promise<import('./types').Order[]>
  refreshAdminOrders: () => Promise<void>
}

export type PlaceOrderInput = {
  customer: { name: string; email: string; phone: string; cpf: string }
  address: import('./types').Address
  deliveryMethod: import('./types').DeliveryMethod
  deliveryLabel: string
  deliveryEstimate: string
  paymentMethod: import('./types').PaymentMethod
  notes: string
  subtotal: number
  discount: number
  shipping: number
  total: number
  items: import('./types').OrderItem[]
}

export function createLocalState(): StoreState {
  return {
    products: [],
    categories: [],
    brands: [],
    banners: [],
    orders: [],
    neighborhoods: [],
    settings: defaultSettings,
    cart: [],
    customer: null,
    customerAddress: null,
  }
}

export function loadLocalState(): StoreState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoreState>
    if (!parsed || !Array.isArray(parsed.products)) return null
    return { ...createLocalState(), ...parsed } as StoreState
  } catch {
    return null
  }
}

export function saveLocalState(state: StoreState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    /* ignora quota */
  }
}

export async function loadRemoteCatalog(): Promise<Partial<StoreState>> {
  const catalog = await api.fetchCatalog()
  return {
    ...catalog,
    settings: { ...defaultSettings, ...catalog.settings },
  }
}

export async function loadStore(): Promise<{ remote: boolean; patch: Partial<StoreState> }> {
  if (isSupabaseConfigured) {
    try {
      const patch = await loadRemoteCatalog()
      return { remote: true, patch }
    } catch {
      /* cai no local */
    }
  }
  const local = loadLocalState()
  return { remote: false, patch: local ?? loadRemoteCatalog().then((p) => p).catch(() => ({})) as unknown as Partial<StoreState> }
}

export type { StoreAction }
