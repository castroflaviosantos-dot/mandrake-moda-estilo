import { BANNERS, CATEGORIES, NEIGHBORHOODS, SETTINGS } from './data'
import type { Brand, StoreState } from './types'

const KEY = 'mandrake-store-v5'

const BRANDS: Brand[] = [
  { id: 'br-1', name: 'Mandrake Collection', slug: 'mandrake-collection' },
  { id: 'br-2', name: 'Urban Line', slug: 'urban-line' },
  { id: 'br-3', name: 'Denim House', slug: 'denim-house' },
  { id: 'br-4', name: 'Street Footwear', slug: 'street-footwear' },
]

export const defaultSettings = SETTINGS

export const emptyCatalog = {
  categories: CATEGORIES,
  banners: BANNERS,
  neighborhoods: NEIGHBORHOODS,
  brands: BRANDS,
}

export function emptyState(): StoreState {
  return {
    products: [],
    categories: CATEGORIES,
    banners: BANNERS,
    brands: BRANDS,
    neighborhoods: NEIGHBORHOODS,
    orders: [],
    cart: [],
    customer: null,
    customerAddress: null,
    settings: SETTINGS,
    orderCodes: [],
  }
}

function list<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback
}

export function withDefaults(partial: Partial<StoreState> | null | undefined): StoreState {
  const src = partial ?? {}
  const base = emptyState()
  return {
    ...base,
    ...src,
    products: Array.isArray(src.products) ? src.products : base.products,
    categories: list(src.categories, base.categories),
    banners: list(src.banners, base.banners),
    brands: list(src.brands, base.brands),
    neighborhoods: list(src.neighborhoods, base.neighborhoods),
    orders: Array.isArray(src.orders) ? src.orders : [],
    cart: Array.isArray(src.cart) ? src.cart : [],
    customer: src.customer ?? null,
    customerAddress: src.customerAddress ?? null,
    settings: { ...SETTINGS, ...(src.settings ?? {}) },
    orderCodes: Array.isArray(src.orderCodes) ? src.orderCodes : [],
  }
}

export function readLegacy(): Partial<StoreState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoreState>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
