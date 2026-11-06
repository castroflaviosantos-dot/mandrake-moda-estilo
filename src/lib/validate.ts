import type { Customer, Address } from './types'

export function validateCustomer(customer: Customer): string | null {
  if (customer.name.trim().length < 3) return 'Informe o nome completo.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim())) return 'Informe um e-mail válido.'
  if (customer.phone.replace(/\D/g, '').length < 10) return 'Informe um telefone com DDD.'
  if (customer.cpf.replace(/\D/g, '').length !== 11) return 'Informe um CPF com 11 dígitos.'
  return null
}

export function validateAddress(address: Address): string | null {
  if (address.cep.replace(/\D/g, '').length !== 8) return 'Informe um CEP válido.'
  if (!address.street.trim()) return 'Informe a rua.'
  if (!address.number.trim()) return 'Informe o número.'
  if (!address.neighborhood.trim()) return 'Informe o bairro.'
  if (!address.city.trim()) return 'Informe a cidade.'
  if (address.state.trim().length !== 2) return 'Informe a UF.'
  return null
}
