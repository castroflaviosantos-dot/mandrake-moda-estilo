import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Banner, Brand, Category, Neighborhood, Order, Product, Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
export const isSupabaseEnabled = Boolean(supabase)

export type AdminSessionInfo = { userId: string; email: string }

const db = () => {
  if (!supabase) throw new Error('Conexão com o banco não configurada.')
  return supabase
}

/* ------------------------------- catálogo ------------------------------ */

type ProductRow = {
  id: string; slug: string; name: string; brand: string; category: string;
  description: string; short_description: string | null; details: unknown;
  price: number | string; compare_price: number | string | null; images: unknown;
  colors: unknown; sizes: unknown; variants: unknown; tags: unknown;
  active: boolean; created_at: string;
}

const num = (value: number | string | null | undefined) => value === null || value === undefined ? undefined : Number(value)
const arr = <T,>(value: unknown): T[] => Array.isArray(value) ? (value as T[]) : []

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    details: arr<string>(row.details),
    price: Number(row.price),
    comparePrice: num(row.compare_price),
    images: arr<string>(row.images),
    colors: arr<Product['colors'][number]>(row.colors),
    sizes: arr<string>(row.sizes),
    variants: arr<Product['variants'][number]>(row.variants),
    tags: arr<string>(row.tags),
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function fetchCatalog() {
  const client = db()
  const [products, categories, banners, neighborhoods, settings] = await Promise.all([
    client.from('products').select('*').order('created_at', { ascending: false }),
    client.from('categories').select('*').order('sort_order'),
    client.from('banners').select('*').order('sort_order'),
    client.from('neighborhoods').select('*').order('name'),
    client.from('settings').select('*').eq('id', 1).maybeSingle(),
  ])
  const firstError = products.error ?? categories.error ?? banners.error ?? neighborhoods.error ?? settings.error
  if (firstError) throw new Error(firstError.message)

  return {
    products: (products.data ?? []).map((row) => mapProduct(row as ProductRow)),
    categories: (categories.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id), name: String(row.name), slug: String(row.slug),
      description: String(row.description ?? ''), image: String(row.image ?? ''),
      active: Boolean(row.active), order: Number(row.sort_order ?? 0),
    })) as Category[],
    banners: (banners.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id), order: Number(row.sort_order ?? 1), eyebrow: String(row.eyebrow ?? ''),
      title: String(row.title ?? ''), description: String(row.description ?? ''),
      ctaLabel: String(row.cta_label ?? ''), ctaLink: String(row.cta_link ?? '/produtos'),
      image: String(row.image ?? ''), active: Boolean(row.active),
    })) as Banner[],
    neighborhoods: (neighborhoods.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id), name: String(row.name), fee: Number(row.fee),
      estimate: String(row.estimate ?? ''), active: Boolean(row.active),
    })) as Neighborhood[],
    settings: (settings.data?.data ?? {}) as Partial<Settings>,
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await db().from('brands').select('*').order('name')
  if (error) return []
  return (data ?? []).map((row: Record<string, unknown>) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug) }))
}

/* -------------------------------- pedidos ------------------------------- */

type OrderRow = {
  id: string; code: string; token: string; created_at: string;
  customer: Order['customer']; address: Order['address']; items: Order['items'];
  subtotal: number | string; discount: number | string; shipping: number | string; total: number | string;
  delivery_method: Order['deliveryMethod']; delivery_label: string; delivery_estimate: string;
  payment_method: Order['paymentMethod']; payment_status: Order['paymentStatus'];
  status: Order['status']; notes: string; admin_note: string | null;
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    code: row.code,
    token: row.token,
    createdAt: row.created_at,
    customer: row.customer,
    address: row.address,
    items: arr<Order['items'][number]>(row.items),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    total: Number(row.total),
    deliveryMethod: row.delivery_method,
    deliveryLabel: row.delivery_label,
    deliveryEstimate: row.delivery_estimate,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    notes: row.notes ?? '',
    adminNote: row.admin_note ?? '',
  }
}

export async function placeOrder(payload: {
  customer: Order['customer']
  address: Order['address']
  items: Order['items']
  subtotal: number
  discount: number
  shipping: number
  total: number
  deliveryMethod: Order['deliveryMethod']
  deliveryLabel: string
  deliveryEstimate: string
  paymentMethod: Order['paymentMethod']
  notes?: string
}): Promise<{ code: string; token: string }> {
  const { data, error } = await db().rpc('place_order', {
    payload: { ...payload, email: payload.customer?.email ?? '' },
  })
  if (error) throw new Error(error.message)
  return data as { code: string; token: string }
}

export async function trackOrder(code: string, token?: string): Promise<Order | null> {
  const { data, error } = await db().rpc('track_order', { p_code: code, p_token: token ?? null })
  if (error) throw new Error(error.message)
  if (!data) return null
  const raw = data as Record<string, unknown>
  return mapOrder({
    id: String(raw.id), code: String(raw.code), token: String(raw.token), created_at: String(raw.createdAt),
    customer: raw.customer as Order['customer'], address: raw.address as Order['address'], items: raw.items as Order['items'],
    subtotal: raw.subtotal as number, discount: raw.discount as number, shipping: raw.shipping as number, total: raw.total as number,
    delivery_method: raw.deliveryMethod as Order['deliveryMethod'], delivery_label: String(raw.deliveryLabel ?? ''),
    delivery_estimate: String(raw.deliveryEstimate ?? ''), payment_method: raw.paymentMethod as Order['paymentMethod'],
    payment_status: raw.paymentStatus as Order['paymentStatus'], status: raw.status as Order['status'],
    notes: String(raw.notes ?? ''), admin_note: String(raw.adminNote ?? ''),
  })
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const { data, error } = await db().from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapOrder(row as OrderRow))
}

export async function updateOrderRow(id: string, patch: { status?: Order['status']; paymentStatus?: Order['paymentStatus']; adminNote?: string }) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status) payload.status = patch.status
  if (patch.paymentStatus) payload.payment_status = patch.paymentStatus
  if (patch.adminNote !== undefined) payload.admin_note = patch.adminNote
  const { error } = await db().from('orders').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

/* ------------------------------- escritas ------------------------------- */

export async function upsertProduct(product: Product) {
  const row = {
    id: product.id, slug: product.slug, name: product.name, brand: product.brand, category: product.category,
    description: product.description, short_description: product.shortDescription ?? '',
    details: product.details, price: product.price, compare_price: product.comparePrice ?? null,
    images: product.images, colors: product.colors, sizes: product.sizes, variants: product.variants,
    tags: product.tags, active: product.active, updated_at: new Date().toISOString(),
  }
  const { error } = await db().from('products').upsert(row)
  if (error) throw new Error(error.message)
}

export async function deleteProductRow(id: string) {
  const { error } = await db().from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertCategory(category: Category, index: number) {
  const { error } = await db().from('categories').upsert({
    id: category.id, name: category.name, slug: category.slug, description: category.description ?? '',
    image: category.image ?? '', active: category.active, sort_order: index + 1, updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function deleteCategoryRow(id: string) {
  const { error } = await db().from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertBanner(banner: Banner) {
  const { error } = await db().from('banners').upsert({
    id: banner.id, sort_order: banner.order, eyebrow: banner.eyebrow, title: banner.title,
    description: banner.description, cta_label: banner.ctaLabel, cta_link: banner.ctaLink,
    image: banner.image, active: banner.active, updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function deleteBannerRow(id: string) {
  const { error } = await db().from('banners').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertNeighborhood(item: Neighborhood) {
  const { error } = await db().from('neighborhoods').upsert({
    id: item.id, name: item.name, fee: item.fee, estimate: item.estimate, active: item.active, updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function deleteNeighborhoodRow(id: string) {
  const { error } = await db().from('neighborhoods').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveSettingsRow(settings: Settings) {
  const { error } = await db().from('settings').upsert({ id: 1, data: settings, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function uploadImage(file: File): Promise<string> {
  const client = db()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
  const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) throw new Error(error.message)
  return client.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

/* ------------------------------ autenticação ---------------------------- */

export async function signInAdmin(email: string, password: string): Promise<AdminSessionInfo> {
  const client = db()
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw new Error('E-mail ou senha inválidos.')
  const { data: isAdmin, error: roleError } = await client.rpc('is_admin')
  if (roleError) throw new Error(roleError.message)
  if (!isAdmin) {
    await client.auth.signOut()
    throw new Error('Esta conta não tem acesso ao painel administrativo.')
  }
  return { userId: data.user?.id ?? '', email: data.user?.email ?? email }
}

export async function restoreAdmin(): Promise<AdminSessionInfo | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return null
  return { userId: user.id, email: user.email ?? '' }
}

export async function signOutAdmin() {
  if (!supabase) return
  await supabase.auth.signOut()
}
