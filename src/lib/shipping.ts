import type { DeliveryMethod, DeliveryOption, Neighborhood, Settings } from './types'
import { onlyDigits } from './format'

/** Faixas aproximadas de CEP atendidas pela entrega regional de Patos de Minas. */
const PATOS_PREFIXES = ['38600', '38601', '38602', '38603', '38604', '38605', '38606', '38607', '38608', '38609']

export function isPatosCep(cep: string): boolean {
  const digits = onlyDigits(cep)
  if (digits.length !== 8) return false
  return PATOS_PREFIXES.some((prefix) => digits.startsWith(prefix)) || (digits.startsWith('386') && digits[5] === '0')
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export type ShippingConfig = Pick<
  Settings,
  'nationalFlatFee' | 'nationalFreeAbove' | 'nationalEstimate' | 'regionalFreeAbove' | 'regionalFallbackFee' | 'regionalEstimate' | 'pickupInstructions'
>

export function buildDeliveryOptions(
  config: ShippingConfig,
  input: { cep: string; subtotal: number; neighborhood?: string },
  neighborhoods: Neighborhood[] = [],
): DeliveryOption[] {
  const freeNational = input.subtotal >= config.nationalFreeAbove
  const local = isPatosCep(input.cep)
  const match = neighborhoods.find((n) => n.active && input.neighborhood && normalize(n.name) === normalize(input.neighborhood))
  const freeRegional = input.subtotal >= config.regionalFreeAbove
  const regionalFee = freeRegional ? 0 : match ? match.fee : config.regionalFallbackFee

  return [
    {
      id: 'nacional',
      method: 'nacional',
      label: 'Entrega nacional',
      description: `${config.nationalEstimate} · Correios ou transportadora para todo o Brasil`,
      price: freeNational ? 0 : config.nationalFlatFee,
      days: config.nationalEstimate,
      available: true,
    },
    {
      id: 'regional',
      method: 'regional',
      label: 'Entrega regional — Patos de Minas',
      description: local ? `Entrega local${match ? ` · ${match.name}` : ''}` : 'Disponível para o CEP de Patos de Minas',
      price: regionalFee,
      days: match?.estimate || config.regionalEstimate,
      available: local,
    },
    {
      id: 'retirada',
      method: 'retirada',
      label: 'Retirada na loja',
      description: 'Vereador João Pacheco, 985 — Centro, Patos de Minas / MG',
      price: 0,
      days: 'Pronto em até 1 dia útil',
      available: true,
    },
  ]
}

export function deliveryLabel(method: DeliveryMethod): string {
  if (method === 'regional') return 'Entrega regional — Patos de Minas'
  if (method === 'retirada') return 'Retirada na loja'
  return 'Entrega nacional'
}
