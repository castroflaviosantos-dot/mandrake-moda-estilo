import type {
  Banner, Category, Neighborhood, Order, OrderStatus, PaymentStatus, Product, Settings,
} from './types'
import * as api from './supabase'

export function orderStatusPatch(status: OrderStatus): { status: OrderStatus; paymentStatus: PaymentStatus } {
  const map: Record<OrderStatus, PaymentStatus> = {
    aguardando_pagamento: 'pending',
    pago: 'approved',
    preparando: 'approved',
    enviado: 'approved',
    concluido: 'approved',
    cancelado: 'refunded',
  }
  return { status, paymentStatus: map[status] }
}

export const persist = {
  product: (product: Product) => api.upsertProductRow(product),
  removeProduct: (id: string) => api.deleteProductRow(id),
  category: (category: Category) => api.upsertCategoryRow(category, 0),
  removeCategory: (id: string) => api.deleteCategoryRow(id),
  banners: (banners: Banner[]) => api.saveBanners(banners),
  neighborhoods: async (list: Neighborhood[]) => {
    await Promise.all(list.map((n) => api.upsertNeighborhoodRow(n)))
  },
  settings: (settings: Settings) => api.saveSettingsRow(settings),
}

export type { Order }
