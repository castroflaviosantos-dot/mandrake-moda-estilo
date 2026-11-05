export const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0)

export const dateBR = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const dateTimeBR = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const installment = (value: number, times = 3) =>
  `${times}x de ${brl(value / times)} sem juros`

export const discountPercent = (price: number, compare?: number) =>
  compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0

export const onlyDigits = (v: string) => v.replace(/\D/g, '')

export const maskCep = (v: string) =>
  onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) => [a && `(${a}`, a.length === 2 ? ') ' : '', b, c && `-${c}`].filter(Boolean).join(''))
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
}

export const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(message)}`

export const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

export const productImage = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`
