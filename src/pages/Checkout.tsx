import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, CreditCard, Loader2, QrCode, Store, Truck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { OrderSummary } from '@/components/checkout/Summary'
import { Button } from '@/components/ui/button'
import { brl, maskCep, maskPhone, whatsappLink } from '@/lib/format'
import type { Address, DeliveryMethod, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

const emptyAddress: Address = {
  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', reference: '',
}

export default function Checkout() {
  const { cartLines, state, createOrder, deliveryOptions, subtotal } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '', notes: '',
  })
  const [address, setAddress] = useState<Address>(emptyAddress)
  const [method, setMethod] = useState<DeliveryMethod | ''>('')
  const [payment, setPayment] = useState<PaymentMethod>('pix')
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [cepMessage, setCepMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const options = useMemo(() => deliveryOptions(address.cep, address.neighborhood), [deliveryOptions, address.cep, address.neighborhood])
  const selected = options.find((o) => o.method === method)
  const deliveryFee = selected?.price ?? 0
  const total = Math.max(0, subtotal - Math.max(0, subtotal >= 500 ? subtotal * 0.05 : 0)) + deliveryFee

  if (!cartLines.length) {
    return (
      <div className="container-mandrake py-24 text-center">
        <h1 className="font-display text-4xl uppercase">Nada para finalizar</h1>
        <p className="mt-3 text-sm text-muted-foreground">Adicione peças ao carrinho para seguir ao checkout.</p>
        <Button asChild className="mt-6 rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    )
  }

  const setField = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const setAddr = (key: keyof Address, value: string) => setAddress((a) => ({ ...a, [key]: value }))

  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setAddress((a) => ({ ...a, cep: maskCep(digits) }))
    if (digits.length !== 8) {
      setCepStatus('idle')
      setCepMessage('')
      return
    }
    setCepStatus('loading')
    setCepMessage('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepStatus('error')
        setCepMessage('CEP não encontrado. Confira o número ou preencha o endereço manualmente.')
        return
      }
      setAddress((a) => ({
        ...a,
        street: data.logradouro || a.street,
        neighborhood: data.bairro || a.neighborhood,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      }))
      setCepStatus('ok')
      setCepMessage(`${data.localidade} — ${data.uf}. Confira o número e o complemento.`)
    } catch {
      setCepStatus('error')
      setCepMessage('Consulta automática indisponível agora. Preencha o endereço manualmente — isso não bloqueia seu pedido.')
    }
  }

  const validate = () => {
    if (!form.name.trim() || !form.phone.replace(/\D/g, '') || !form.email.includes('@')) {
      toast.error('Preencha nome, WhatsApp e e-mail válidos')
      return false
    }
    if (address.cep.replace(/\D/g, '').length !== 8 || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
      toast.error('Complete o endereço de entrega')
      return false
    }
    if (!method) {
      toast.error('Escolha uma modalidade de entrega')
      return false
    }
    return true
  }

  const submit = () => {
    if (!validate() || !method) return
    setSubmitting(true)
    const order = createOrder({
      customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone, cpf: form.cpf },
      address,
      deliveryMethod: method,
      deliveryEstimate: selected?.days ?? '',
      discount: Math.max(0, subtotal >= 500 ? Math.round(subtotal * 0.05 * 100) / 100 : 0),
      paymentMethod: payment,
      notes: form.notes,
    })
    toast.success(`Pedido ${order.code} registrado`)
    navigate(`/pedido/${order.code}`)
  }

  const deliveryMeta: { method: DeliveryMethod; icon: typeof Truck; title: string; text: string }[] = [
    { method: 'nacional', icon: Truck, title: 'Entrega nacional', text: 'Enviamos para todo o Brasil com prazo estimado por região.' },
    { method: 'regional', icon: Store, title: 'Entrega regional', text: 'Entrega local em Patos de Minas e região, com tarifa por bairro.' },
    { method: 'retirada', icon: Store, title: 'Retirada na loja', text: 'Retire sem custo na loja física, na Vereador João Pacheco, 985.' },
  ]

  return (
    <div className="container-mandrake py-10">
      <div className="border-b border-border pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Checkout</p>
        <h1 className="mt-1 font-display text-4xl uppercase">Finalizar compra</h1>
      </div>

      <div className="mt-5 flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
        <CreditCard className="mt-0.5 size-4 shrink-0" />
        <p>Ambiente demonstrativo: seu pedido é registrado na loja, mas nenhum pagamento real é processado. A integração com Mercado Pago (Pix e cartão) será ativada quando as credenciais da loja forem aprovadas.</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">1. Seus dados</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo" value={form.name} onChange={(v) => setField('name', v)} className="sm:col-span-2" />
              <Field label="WhatsApp" value={form.phone} onChange={(v) => setField('phone', maskPhone(v))} inputMode="numeric" placeholder="(34) 99999-9999" />
              <Field label="E-mail" value={form.email} onChange={(v) => setField('email', v)} type="email" />
              <Field label="CPF (opcional)" value={form.cpf} onChange={(v) => setField('cpf', v.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" placeholder="Necessário para pagamento e nota fiscal" />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">2. Endereço de entrega</h2>
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">CEP</label>
                <div className="relative">
                  <input
                    value={address.cep}
                    onChange={(e) => lookupCep(e.target.value)}
                    inputMode="numeric"
                    placeholder="00000-000"
                    className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-white/60"
                  />
                  {cepStatus === 'loading' && <Loader2 className="absolute right-3 top-3.5 size-4 animate-spin text-muted-foreground" />}
                </div>
                {cepMessage && <p className={cn('mt-1 text-[11px]', cepStatus === 'error' ? 'text-amber-300' : 'text-muted-foreground')}>{cepMessage}</p>}
              </div>
              <div className="sm:col-span-4">
                <Field label="Rua" value={address.street} onChange={(v) => setAddr('street', v)} />
              </div>
              <div className="sm:col-span-2"><Field label="Número" value={address.number} onChange={(v) => setAddr('number', v)} /></div>
              <div className="sm:col-span-4"><Field label="Complemento" value={address.complement} onChange={(v) => setAddr('complement', v)} /></div>
              <div className="sm:col-span-2"><Field label="Bairro" value={address.neighborhood} onChange={(v) => setAddr('neighborhood', v)} /></div>
              <div className="sm:col-span-2"><Field label="Cidade" value={address.city} onChange={(v) => setAddr('city', v)} /></div>
              <div className="sm:col-span-2"><Field label="Estado" value={address.state} onChange={(v) => setAddr('state', v.toUpperCase().slice(0, 2))} placeholder="MG" /></div>
              <div className="sm:col-span-6"><Field label="Referência para entrega" value={address.reference} onChange={(v) => setAddr('reference', v)} placeholder="Ex.: casa azul, ao lado da farmácia" /></div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">3. Entrega</h2>
            <div className="grid gap-3">
              {deliveryMeta.map(({ method: m, icon: Icon, title, text }) => {
                const opt = options.find((o) => o.method === m)
                const disabled = !opt
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex items-start gap-3 border p-4 text-left transition-colors',
                      method === m ? 'border-white bg-white/5' : 'border-border hover:border-white/40',
                      disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{text}</p>
                      {opt && <p className="mt-1 text-[11px] text-muted-foreground">{opt.days}</p>}
                      {!opt && <p className="mt-1 text-[11px] text-amber-300">Informe o CEP para liberar esta opção.</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{opt ? (opt.price === 0 ? 'Grátis' : brl(opt.price)) : '—'}</p>
                      {method === m && <Check className="ml-auto mt-1 size-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">4. Pagamento</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { id: 'pix', label: 'Pix', icon: QrCode, note: 'Aprovação rápida' },
                { id: 'cartao', label: 'Cartão de crédito', icon: CreditCard, note: 'Até 3x sem juros' },
                { id: 'retirada', label: 'Pagar na retirada', icon: Store, note: 'Somente loja física' },
              ] as const).map(({ id, label, icon: Icon, note }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPayment(id as PaymentMethod)}
                  className={cn('border p-4 text-left transition-colors', payment === id ? 'border-white bg-white/5' : 'border-border hover:border-white/40')}
                >
                  <Icon className="size-4" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em]">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{note}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Não armazenamos dados completos de cartão. A confirmação automática será feita por webhook do gateway.</p>
          </section>

          <section>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">5. Observações</h2>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              placeholder="Instruções para entrega, ponto de referência ou observações sobre o pedido"
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-white/60"
            />
          </section>
        </div>

        <div>
          <OrderSummary deliveryFee={deliveryFee} deliveryEstimate={selected?.days} />
          <Button onClick={submit} disabled={submitting} className="mt-4 h-12 w-full rounded-sm bg-white text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white/90">
            {submitting ? 'Registrando pedido...' : `Finalizar pedido · ${brl(total)}`}
          </Button>
          <a
            href={whatsappLink(state.settings.whatsapp, 'Olá! Preciso de ajuda para finalizar minha compra.')}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            Prefere comprar pelo WhatsApp?
          </a>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, inputMode, className }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  inputMode?: 'numeric' | 'text' | 'email'
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-white/60"
      />
    </div>
  )
}
