import { emptyState, readLegacy, withDefaults } from './store-core'
import { remote, isSupabaseConfigured } from './store-api'
import type { StoreState } from './types'

export const localKeys = {
  cart: 'mandrake-cart-v2',
  customer: 'mandrake-customer-v2',
  codes: 'mandrake-orders-codes-v2',
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível */
  }
}

export function message(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erro inesperado'
}

export type CatalogResult = { patch: Partial<StoreState>; remote: boolean; error: string | null }

export async function loadCatalog(): Promise<CatalogResult> {
  const legacy = withDefaults(readLegacy())

  if (!isSupabaseConfigured) {
    return {
      patch: {
        products: legacy.products, categories: legacy.categories, banners: legacy.banners,
        brands: legacy.brands, neighborhoods: legacy.neighborhoods, settings: legacy.settings,
      },
      remote: false,
      error: 'Conecte o banco de dados para exibir o catálogo.',
    }
  }

  try {
    const [catalog, brands, orders] = await Promise.all([
      remote.catalog(),
      remote.brands().catch(() => []),
      remote.restore().then((session) => session ? remote.orders().catch(() => []) : []).catch(() => []),
    ])
    return {
      patch: {
        products: catalog.products,
        categories: catalog.categories.length ? catalog.categories : legacy.categories,
        banners: catalog.banners.length ? catalog.banners : legacy.banners,
        neighborhoods: catalog.neighborhoods.length ? catalog.neighborhoods : legacy.neighborhoods,
        brands: brands.length ? brands : legacy.brands,
        settings: { ...legacy.settings, ...catalog.settings },
        orders,
      },
      remote: true,
      error: null,
    }
  } catch (error) {
    return {
      patch: {
        products: legacy.products, categories: legacy.categories, banners: legacy.banners,
        brands: legacy.brands, neighborhoods: legacy.neighborhoods, settings: legacy.settings,
      },
      remote: false,
      error: message(error),
    }
  }
}

export { emptyState }
