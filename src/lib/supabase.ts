import type { Banner, Brand, Category, Neighborhood, Order, Product, Settings } from './types'

/*
 * Cliente Supabase leve baseado em fetch (REST/PostgREST + Auth).
 * Não depende de @supabase/supabase-js, que não faz parte das dependências do projeto.
 */

const readEnv = (value: unknown): string | undefined => {
  const raw = typeof value === 'string' ? value.trim().replace(/^["']|["']$/g, '') : ''
  return raw.length > 0 ? raw : undefined
}

/*
 * Normaliza a URL do projeto: aceita que o valor venha com caminho colado
 * (ex.: https://xxxx.supabase.co/rest/v1) ou sem o protocolo, mantendo
 * apenas a origem https://<projeto>.supabase.co. É a origem que as rotas
 * /auth/v1, /rest/v1 e /storage/v1 esperam.
 */
function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    const origin = `${parsed.protocol}//${parsed.host}`
    return origin.replace(/\/+$/, '')
  } catch {
    return value.replace(/\/+$/, '')
  }
}

const serverUrl = normalizeUrl(readEnv(import.meta.env.VITE_SUPABASE_URL))
const serverKey = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

/* Chaves publicáveis novas (sb_publishable_...) não são JWT: só podem ir no cabeçalho apikey. */
const keyIsPublishable = (value: string | undefined) => Boolean(value && value.startsWith('sb_publishable_'))

const DEFAULT_URL = ''
const DEFAULT_KEY = ''

const url = serverUrl ?? normalizeUrl(readEnv(DEFAULT_URL))
const key = serverKey ?? readEnv(DEFAULT_KEY)

export const isSupabaseEnabled = Boolean(url && key)

type Session = { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email?: string } }

const SESSION_KEY = 'mandrake-supabase-session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignora */
  }
}

function storeSession(session: Session) {
  writeSession(session)
}

const nowSec = () => Math.floor(Date.now() / 1000)

export function currentAccessToken(): string | null {
  const session = readSession()
  if (!session?.access_token) return null
  if (!Number.isFinite(session.expires_at)) return session.access_token
  return session.expires_at - 30 > nowSec() ? session.access_token : null
}

function refreshSession(): Session | null {
  const session = readSession()
  if (!session) return null
  if (!Number.isFinite(session.expires_at)) return session
  return session.expires_at - 30 > nowSec() ? session : null
}

async function refreshTokens(): Promise<Session | null> {
  const session = readSession()
  if (!session?.refresh_token || !url || !key) return null
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
    const body = safeJson(await res.text()) as (Partial<Session> & { expires_in?: number }) | null
    if (!res.ok || !body?.access_token) {
      writeSession(null)
      return null
    }
    const next: Session = {
      access_token: body.access_token,
      refresh_token: body.refresh_token ?? session.refresh_token,
      expires_at: nowSec() + Number(body.expires_in ?? 3600),
      user: body.user ?? session.user,
    }
    storeSession(next)
    return next
  } catch {
    return null
  }
}

async function validToken(): Promise<string | null> {
  const active = currentAccessToken()
  if (active) return active
  const refreshed = await refreshTokens()
  return refreshed?.access_token ?? null
}

function ensureConfig() {
  if (!url || !key) throw new Error('Conexão com o banco não configurada.')
  return { url, key }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { key: anon } = ensureConfig()
  const token = (await validToken()) ?? (keyIsPublishable(anon) ? undefined : anon)
  return token ? { apikey: anon, Authorization: `Bearer ${token}` } : { apikey: anon }
}

async function request<T>(path: string, init: RequestInit & { params?: Record<string, string> } = {}): Promise<T> {
  const { url: base } = ensureConfig()
  const query = init.params ? `?${new URLSearchParams(init.params).toString()}` : ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  }
  if (init.method === 'POST' || init.method === 'PATCH' || init.method === 'DELETE') {
    headers.Prefer = 'return=representation'
  }
  const res = await fetch(`${base}${path}${query}`, { ...init, headers })
  const text = await res.text()
  const body = text ? safeJson(text) : null
  if (!res.ok) {
    const message = (body as { message?: string; error_description?: string; msg?: string } | null)
    throw new Error(message?.message ?? message?.error_description ?? message?.msg ?? 'Falha na comunicação com o banco.')
  }
  return body as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/* API mínima compatível com o uso de `supabase` pelos módulos da loja. */
export const supabase = isSupabaseEnabled
  ? {
      rpc: async <T,>(fn: string, args: Record<string, unknown> = {}) => {
        try {
          const data = await request<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) })
          return { data, error: null as null | { message: string } }
        } catch (error) {
          return { data: null, error: { message: error instanceof Error ? error.message : 'Falha na comunicação com o banco.' } }
        }
      },
      auth: {
        getSession: async () => {
          const session = refreshSession()
          return session
            ? { data: { session: { access_token: session.access_token, user: session.user } }, error: null }
            : { data: { session: null }, error: null }
        },
        signOut: async () => {
          const session = readSession()
          writeSession(null)
          if (session?.access_token && url && key) {
            await fetch(`${url}/auth/v1/logout`, {
              method: 'POST',
              headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
            }).catch(() => undefined)
          }
          return { error: null }
        },
      },
      get session() {
        return readSession()
      },
      signOut: async () => {
        const session = readSession()
        writeSession(null)
        if (session?.access_token && url && key) {
          await fetch(`${url}/auth/v1/logout`, {
            method: 'POST',
            headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
          }).catch(() => undefined)
        }
      },
    }
  : null

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
  db()
  const [products, categories, banners, neighborhoods, settings] = await Promise.all([
    request<ProductRow[]>('/rest/v1/products', { params: { select: '*', order: 'created_at.desc' } }),
    request<Record<string, unknown>[]>('/rest/v1/categories', { params: { select: '*', order: 'sort_order.asc' } }),
    request<Record<string, unknown>[]>('/rest/v1/banners', { params: { select: '*', order: 'sort_order.asc' } }),
    request<Record<string, unknown>[]>('/rest/v1/neighborhoods', { params: { select: '*', order: 'name.asc' } }),
    request<Record<string, unknown>[]>('/rest/v1/settings', { params: { select: '*', id: 'eq.1' } }),
  ])

  return {
    products: (products ?? []).map((row) => mapProduct(row)),
    categories: (categories ?? []).map((row) => ({
      id: String(row.id), name: String(row.name), slug: String(row.slug),
      description: String(row.description ?? ''), image: String(row.image ?? ''),
      active: Boolean(row.active), order: Number(row.sort_order ?? 0),
    })) as Category[],
    banners: (banners ?? []).map((row) => ({
      id: String(row.id), order: Number(row.sort_order ?? 1), eyebrow: String(row.eyebrow ?? ''),
      title: String(row.title ?? ''), description: String(row.description ?? ''),
      ctaLabel: String(row.cta_label ?? ''), ctaLink: String(row.cta_link ?? '/produtos'),
      image: String(row.image ?? ''), active: Boolean(row.active),
    })) as Banner[],
    neighborhoods: (neighborhoods ?? []).map((row) => ({
      id: String(row.id), name: String(row.name), fee: Number(row.fee),
      estimate: String(row.estimate ?? ''), active: Boolean(row.active),
    })) as Neighborhood[],
    settings: ((settings?.[0] as { data?: Partial<Settings> } | undefined)?.data ?? {}) as Partial<Settings>,
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  if (!supabase) return []
  try {
    const rows = await request<Record<string, unknown>[]>('/rest/v1/brands', { params: { select: '*', order: 'name.asc' } })
    return (rows ?? []).map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug) }))
  } catch {
    return []
  }
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
  const data = await db().rpc<{ code: string; token: string }>('place_order', {
    payload: { ...payload, email: payload.customer?.email ?? '' },
  })
  return data
}

export async function trackOrder(code: string, token?: string): Promise<Order | null> {
  const data = await db().rpc<Record<string, unknown> | null>('track_order', { p_code: code, p_token: token ?? null })
  if (!data) return null
  const raw = data
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

export async function ordersByEmail(email: string): Promise<Order[]> {
  const rows = await db().rpc<OrderRow[]>('orders_by_email', { p_email: email.trim() })
  return Array.isArray(rows) ? rows.map((row) => mapOrder(row)) : []
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const rows = await request<OrderRow[]>('/rest/v1/orders', { params: { select: '*', order: 'created_at.desc', limit: '500' } })
  return (rows ?? []).map((row) => mapOrder(row))
}

export async function updateOrderRow(id: string, patch: { status?: Order['status']; paymentStatus?: Order['paymentStatus']; adminNote?: string }) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status) payload.status = patch.status
  if (patch.paymentStatus) payload.payment_status = patch.paymentStatus
  if (patch.adminNote !== undefined) payload.admin_note = patch.adminNote
  await request('/rest/v1/orders', { method: 'PATCH', params: { id: `eq.${id}` }, body: JSON.stringify(payload) })
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
  await request('/rest/v1/products', { method: 'POST', params: { on_conflict: 'id' }, body: JSON.stringify(row) })
}

export async function deleteProductRow(id: string) {
  await request('/rest/v1/products', { method: 'DELETE', params: { id: `eq.${id}` } })
}

export async function upsertCategory(category: Category, index: number) {
  await request('/rest/v1/categories', {
    method: 'POST',
    params: { on_conflict: 'id' },
    body: JSON.stringify({
      id: category.id, name: category.name, slug: category.slug, description: category.description ?? '',
      image: category.image ?? '', active: category.active, sort_order: index + 1, updated_at: new Date().toISOString(),
    }),
  })
}

export async function deleteCategoryRow(id: string) {
  await request('/rest/v1/categories', { method: 'DELETE', params: { id: `eq.${id}` } })
}

export async function upsertBanner(banner: Banner) {
  await request('/rest/v1/banners', {
    method: 'POST',
    params: { on_conflict: 'id' },
    body: JSON.stringify({
      id: banner.id, sort_order: banner.order, eyebrow: banner.eyebrow, title: banner.title,
      description: banner.description, cta_label: banner.ctaLabel, cta_link: banner.ctaLink,
      image: banner.image, active: banner.active, updated_at: new Date().toISOString(),
    }),
  })
}

export async function deleteBannerRow(id: string) {
  await request('/rest/v1/banners', { method: 'DELETE', params: { id: `eq.${id}` } })
}

export async function upsertNeighborhood(item: Neighborhood) {
  await request('/rest/v1/neighborhoods', {
    method: 'POST',
    params: { on_conflict: 'id' },
    body: JSON.stringify({
      id: item.id, name: item.name, fee: item.fee, estimate: item.estimate, active: item.active, updated_at: new Date().toISOString(),
    }),
  })
}

export async function deleteNeighborhoodRow(id: string) {
  await request('/rest/v1/neighborhoods', { method: 'DELETE', params: { id: `eq.${id}` } })
}

export async function saveSettingsRow(settings: Settings) {
  await request('/rest/v1/settings', {
    method: 'POST',
    params: { on_conflict: 'id' },
    body: JSON.stringify({ id: 1, data: settings, updated_at: new Date().toISOString() }),
  })
}

export async function uploadImage(file: File): Promise<string> {
  const { url: base, key: anon } = ensureConfig()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
  const token = (await validToken()) ?? (keyIsPublishable(anon) ? undefined : anon)
  const res = await fetch(`${base}/storage/v1/object/product-images/${path}`, {
    method: 'POST',
    headers: { apikey: anon, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  })
  if (!res.ok) {
    const body = safeJson(await res.text()) as { message?: string } | null
    throw new Error(body?.message ?? 'Falha ao enviar a imagem.')
  }
  return `${base}/storage/v1/object/public/product-images/${path}`
}

/* ------------------------------ autenticação ---------------------------- */

export async function signInAdmin(email: string, password: string): Promise<AdminSessionInfo> {
  const { url: base, key: anon } = ensureConfig()
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  })
  type TokenBody = Session & { expires_in?: number; error_description?: string; msg?: string; error?: string; message?: string }
  const raw = await res.text()
  const body = safeJson(raw) as TokenBody | null
  if (!res.ok || !body?.access_token) {
    const detail = body?.error_description ?? body?.msg ?? body?.message ?? body?.error ?? raw.slice(0, 200) ?? ''
    if (res.status === 404 || /invalid path/i.test(detail)) {
      throw new Error(`Endereço do Supabase inválido (${res.status}). A VITE_SUPABASE_URL deve conter apenas https://SEU-PROJETO.supabase.co, sem /rest/v1, /auth/v1 ou barra no final. Valor em uso: ${base}.`)
    }
    if (/confirm/i.test(detail)) throw new Error('Confirme o e-mail da conta antes de entrar.')
    if (/invalid api key|invalid key|no api key|apikey/i.test(detail)) throw new Error('Chave pública do Supabase inválida. Confira VITE_SUPABASE_ANON_KEY.')
    /* Só é credencial inválida quando o Auth realmente recusa e-mail/senha. */
    const wrongPassword = /invalid login credentials|invalid_grant|invalid password|user not found/i.test(detail)
      || (res.status === 400 && /credentials|password|email/i.test(detail))
    if (wrongPassword) {
      throw new Error(`E-mail ou senha não conferem (${res.status}): ${detail || 'credenciais recusadas'}. Redefina a senha em Authentication → Users.`)
    }
    if (/email not confirmed/i.test(detail)) throw new Error('E-mail da conta ainda não confirmado.')
    if (res.status >= 500) throw new Error(`O Supabase não respondeu (${res.status}): ${detail || 'sem detalhe'}. Verifique VITE_SUPABASE_URL.`)
    throw new Error(`Login recusado pelo Supabase (${res.status}): ${detail || 'nenhum detalhe retornado'}.`)
  }
  const session: Session = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: nowSec() + Number(body.expires_in ?? 3600),
    user: body.user,
  }
  storeSession(session)
  let isAdmin = false
  try {
    isAdmin = await isAdminSession()
  } catch (error) {
    const detail = error instanceof Error ? error.message : ''
    writeSession(null)
    if (/jwt|expired|token/i.test(detail)) throw new Error('Sessão inválida. Tente entrar novamente.')
    if (/permission denied|permission|not allowed|grant/i.test(detail)) throw new Error('O banco não autoriza a verificação de administrador (permissão de execução de is_admin). Fale com o responsável técnico.')
    if (/function|schema cache|404|not found/i.test(detail)) throw new Error('Função de verificação de administrador ausente no banco (is_admin). Fale com o responsável técnico.')
    writeSession(session)
    throw new Error(`Login aceito, mas a verificação de administrador falhou: ${detail || 'erro desconhecido'}`)
  }
  if (!isAdmin) {
    writeSession(null)
    throw new Error('Esta conta não tem acesso ao painel administrativo.')
  }
  void anon
  return { userId: body.user?.id ?? '', email: body.user?.email ?? email }
}

/*
 * Verificação de administrador feita diretamente no banco, sem depender do
 * cache de schema do PostgREST nem da exposição da função no RPC.
 */
async function isAdminSession(): Promise<boolean> {
  const { url: base, key: anon } = ensureConfig()
  const token = await validToken()
  if (!token) throw new Error('jwt ausente')
  const res = await fetch(`${base}/rest/v1/admin_users?select=user_id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  const text = await res.text()
  if (!res.ok) {
    const body = safeJson(text) as { message?: string } | null
    throw new Error(body?.message || text.slice(0, 200) || `falha ${res.status}`)
  }
  const rows = safeJson(text)
  return Array.isArray(rows) && rows.length > 0
}

export async function restoreAdmin(): Promise<AdminSessionInfo | null> {
  const { key: anon } = ensureConfig()
  const session = refreshSession()
  if (!session?.access_token) {
    const refreshed = await refreshTokens()
    return refreshed ? restoreWithToken(refreshed.access_token, anon) : null
  }
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` } })
    if (!res.ok) {
      writeSession(null)
      return null
    }
    const user = (await res.json()) as { id: string; email?: string }
    const isAdmin = await isAdminSession()
    if (!isAdmin) return null
    return { userId: user.id, email: user.email ?? '' }
  } catch {
    return null
  }
}

async function restoreWithToken(token: string, anon: string): Promise<AdminSessionInfo | null> {
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const user = (await res.json()) as { id: string; email?: string }
    const isAdmin = await isAdminSession()
    return isAdmin ? { userId: user.id, email: user.email ?? '' } : null
  } catch {
    return null
  }
}

export async function signOutAdmin() {
  if (!supabase) return
  await supabase.auth.signOut()
  writeSession(null)
}

void key
