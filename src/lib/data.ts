import type { Banner, Category, Neighborhood, Settings } from './types'

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Camisetas', slug: 'camisetas', description: 'Malhas premium e modelagens contemporâneas', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', active: true },
  { id: 'cat-2', name: 'Jaquetas', slug: 'jaquetas', description: 'Camadas fortes para a rua', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', active: true },
  { id: 'cat-3', name: 'Calças', slug: 'calcas', description: 'Cargo, jeans e alfaiataria', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', active: true },
  { id: 'cat-4', name: 'Bermudas', slug: 'bermudas', description: 'Leveza urbana', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=80', active: true },
  { id: 'cat-5', name: 'Calçados', slug: 'calcados', description: 'Tênis e botas originais', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80', active: true },
  { id: 'cat-6', name: 'Acessórios', slug: 'acessorios', description: 'Bonés, cintos e mochilas', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80', active: true },
]

export const BANNERS: Banner[] = [
  { id: 'ban-1', order: 1, eyebrow: 'Nova coleção', title: 'Moda urbana assumida', description: 'Peças autorais com caimento impecável e acabamento premium. Lançamentos toda semana.', ctaLabel: 'Ver coleção', ctaLink: '/categoria/camisetas', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80', active: true },
  { id: 'ban-2', order: 2, eyebrow: 'Camisetas e polos', title: 'Essenciais que definem o look', description: 'Malhas encorpadas, gola firme e modelagem oversized. O básico bem feito.', ctaLabel: 'Comprar camisetas', ctaLink: '/categoria/camisetas', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=80', active: true },
  { id: 'ban-3', order: 3, eyebrow: 'Calçados originais', title: 'Pisada premium', description: 'Tênis e botas de marcas autorizadas, com garantia e originalidade garantida.', ctaLabel: 'Ver calçados', ctaLink: '/categoria/calcados', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1800&q=80', active: true },
  { id: 'ban-4', order: 4, eyebrow: 'Marcas em destaque', title: 'Streetwear de verdade', description: 'Revendedor autorizado. Mais de 5 anos vestindo a cena de Patos de Minas.', ctaLabel: 'Ver catálogo', ctaLink: '/produtos', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1800&q=80', active: true },
]

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: 'nb-1', name: 'Centro', fee: 8, estimate: 'Mesmo dia', active: true },
  { id: 'nb-2', name: 'Rosário', fee: 10, estimate: 'Até 24h', active: true },
  { id: 'nb-3', name: 'Sobradinho', fee: 12, estimate: 'Até 24h', active: true },
  { id: 'nb-4', name: 'Caiçaras', fee: 14, estimate: '1 a 2 dias úteis', active: true },
  { id: 'nb-5', name: 'Bela Vista', fee: 14, estimate: '1 a 2 dias úteis', active: true },
  { id: 'nb-6', name: 'Cidade Jardim', fee: 16, estimate: '1 a 2 dias úteis', active: true },
]

export const SETTINGS: Settings = {
  storeName: 'Mandrake Moda e Estilo',
  whatsapp: '(34) 99879-5725',
  instagram: '@mandrake_moda_estilo',
  email: 'contato@mandrakemodaestilo.com.br',
  announcement: 'Frete grátis acima de R$ 399 · Entregamos em todo o Brasil',
  address: { street: 'Vereador João Pacheco', number: '985', neighborhood: 'Centro', city: 'Patos de Minas', state: 'MG', cep: '38700-000' },
  city: 'Patos de Minas',
  nationalFlatFee: 29.9,
  nationalFreeAbove: 399,
  nationalEstimate: '4 a 9 dias úteis',
  regionalFreeAbove: 249,
  regionalFallbackFee: 12,
  regionalEstimate: 'Até 24h',
  carrierNote: 'Estrutura pronta para Correios / Melhor Envio. Enquanto a integração não estiver ativa, as tarifas são as cadastradas no painel.',
  pickupInstructions: 'Retire na loja em até 5 dias após a confirmação do pedido. Leve um documento com foto. Atendimento de segunda a sábado, das 9h às 19h.',
  pixKey: '',
  gatewayNote: 'Integração Mercado Pago preparada. Sem credenciais aprovadas, o pedido é registrado em ambiente demonstrativo.',
  demoMode: true,
}
