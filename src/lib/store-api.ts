import {
  deleteBannerRow, deleteCategoryRow, deleteNeighborhoodRow, deleteProductRow,
  fetchAdminOrders, fetchBrands, fetchCatalog, isSupabaseEnabled, mapOrder,
  placeOrder, restoreAdmin, saveSettingsRow, signInAdmin, signOutAdmin,
  trackOrder, updateOrderRow, uploadImage, upsertBanner, upsertCategory,
  upsertNeighborhood, upsertProduct,
} from './supabase'
import type { AdminSessionInfo as SessionInfo } from './supabase'
import type { Banner, Category, Neighborhood, Order, Product, Settings } from './types'

export type AdminSessionInfo = SessionInfo
export const isSupabaseConfigured = isSupabaseEnabled
export type AdminMode = 'supabase' | 'demo'
export const adminMode: AdminMode = isSupabaseEnabled ? 'supabase' : 'demo'

export const remote = {
  restore: restoreAdmin,
  signIn: signInAdmin,
  signOut: signOutAdmin,
  catalog: fetchCatalog,
  brands: fetchBrands,
  orders: fetchAdminOrders,
  updateOrder: (id: string, patch: { status?: Order['status']; paymentStatus?: Order['paymentStatus'] }) =>
    updateOrderRow(id, patch),
  place: placeOrder,
  track: trackOrder,
  byEmail: async (email: string): Promise<Order[]> => {
    const { supabase, mapOrder } = await import('./supabase')
    if (!supabase) return []
    const { data, error } = await supabase.rpc('orders_by_email', { p_email: email.trim() })
    if (error) throw new Error(error.message)
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => mapOrder(row as Parameters<typeof mapOrder>[0]))
  },
  saveProduct: upsertProduct,
  removeProduct: deleteProductRow,
  saveCategory: upsertCategory as (category: Category, index: number) => Promise<void>,
  removeCategory: deleteCategoryRow,
  saveBanner: (banner: Banner) => upsertBanner(banner),
  removeBanner: deleteBannerRow,
  saveNeighborhood: (item: Neighborhood) => upsertNeighborhood(item),
  removeNeighborhood: deleteNeighborhoodRow,
  saveSettings: (settings: Settings) => saveSettingsRow(settings),
  upload: uploadImage,
}
