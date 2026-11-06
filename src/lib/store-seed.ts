import type { Settings, StoreState } from './types'
import { productImage } from './format'

export const DEFAULT_SETTINGS: Settings = {
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
  demoMode: false,
}

const detailLines = ['Produto original com etiqueta', 'Peça selecionada pela curadoria Mandrake', 'Troca em até 7 dias na loja física']

const SIZES_CLOTHES = ['P', 'M', 'G', 'GG']
const SIZES_SHOES = ['37', '38', '39', '40', '41', '42', '43']
const SIZES_ONE = ['Único']

type Seed = {
  slug: string; name: string; brand: string; category: string; price: number; compare?: number
  image: string; description: string; tags: string[]; days: number; sizes: string[]
}

const SEEDS: Seed[] = [
  { slug: 'camiseta-oversized-mandrake', name: 'Camiseta Oversized Signature', brand: 'Mandrake Collection', category: 'camisetas', price: 149.9, compare: 189.9, image: '1521572163474-6864f9cf17ab', description: 'Algodão penteado 240g, modelagem oversized e estampa exclusiva em silk de alta definição.', tags: ['mais-vendidos', 'destaques'], days: 3, sizes: SIZES_CLOTHES },
  { slug: 'camiseta-essential-preta', name: 'Camiseta Essential Preta', brand: 'Mandrake Collection', category: 'camisetas', price: 119.9, compare: 149.9, image: '1583743814966-8936f5b7be1a', description: 'Básico que sustenta o visual. Gola dupla, caimento reto e malha encorpada.', tags: ['mais-vendidos', 'ofertas'], days: 12, sizes: SIZES_CLOTHES },
  { slug: 'polo-piquet-nobre', name: 'Polo Piquet Nobre', brand: 'Mandrake Collection', category: 'camisetas', price: 229.9, compare: 279.9, image: '1620012253295-c15cc3e65df4', description: 'Piquet premium com detalhes em contraste, ideal para o equilíbrio entre casual e formal.', tags: ['destaques', 'ofertas'], days: 20, sizes: SIZES_CLOTHES },
  { slug: 'camiseta-cropped-urbana', name: 'Camiseta Cropped Urbana', brand: 'Urban Line', category: 'camisetas', price: 99.9, image: '1503342217505-b0a15ec3261c', description: 'Cropped de malha leve com recortes modernos e acabamento reforçado.', tags: ['novidades', 'mais-vendidos'], days: 1, sizes: SIZES_CLOTHES },
  { slug: 'camiseta-manga-longa-heavy', name: 'Camiseta Manga Longa Heavy', brand: 'Mandrake Collection', category: 'camisetas', price: 179.9, compare: 219.9, image: '1618354691373-d851c5c3a990', description: 'Malha pesada com punho canelado. Pensada para as noites frias de Patos de Minas.', tags: ['novidades', 'ofertas'], days: 5, sizes: SIZES_CLOTHES },
  { slug: 'jaqueta-corta-vento-tech', name: 'Jaqueta Corta-Vento Tech', brand: 'Mandrake Collection', category: 'jaquetas', price: 349.9, compare: 449.9, image: '1591047139829-d91aecb6caea', description: 'Tecido ripstop resistente à água, capuz embutido e bolsos técnicos.', tags: ['destaques', 'mais-vendidos', 'ofertas'], days: 8, sizes: SIZES_CLOTHES },
  { slug: 'moletom-hoodie-concrete', name: 'Moletom Hoodie Concrete', brand: 'Urban Line', category: 'jaquetas', price: 319.9, image: '1556821840-3a63f95609a7', description: 'Moletom flanelado 400g com capuz forrado e estampa em puffs holográfico sutil.', tags: ['mais-vendidos'], days: 15, sizes: SIZES_CLOTHES },
  { slug: 'bomber-essential-preta', name: 'Jaqueta Bomber Essential', brand: 'Mandrake Collection', category: 'jaquetas', price: 389.9, compare: 489.9, image: '1520975954732-35dd22299614', description: 'Bomber em sarja premium com forro quente e acabamento monocromático.', tags: ['destaques', 'ofertas'], days: 25, sizes: SIZES_CLOTHES },
  { slug: 'calca-cargo-tactical', name: 'Calça Cargo Tactical', brand: 'Mandrake Collection', category: 'calcas', price: 249.9, compare: 299.9, image: '1541099649105-f69ad21f3246', description: 'Ripstop encorpado, seis bolsos e ajuste de barra com cordão.', tags: ['mais-vendidos', 'destaques', 'ofertas'], days: 6, sizes: SIZES_CLOTHES },
  { slug: 'calca-jeans-reta-stone', name: 'Calça Jeans Reta Stone', brand: 'Denim House', category: 'calcas', price: 219.9, image: '1542272604-787c3835535d', description: 'Jeans stone com lavagem mediana, cós confortável e modelagem reta contemporânea.', tags: ['novidades'], days: 2, sizes: SIZES_CLOTHES },
  { slug: 'bermuda-sarja-street', name: 'Bermuda Sarja Street', brand: 'Mandrake Collection', category: 'bermudas', price: 159.9, compare: 199.9, image: '1591195853828-11db59a44f6b', description: 'Sarja com elastano, comprimento na altura do joelho e bolsos utilitários.', tags: ['mais-vendidos', 'ofertas'], days: 18, sizes: SIZES_CLOTHES },
  { slug: 'bermuda-alfaiataria-flow', name: 'Bermuda Alfaiataria Flow', brand: 'Urban Line', category: 'bermudas', price: 189.9, image: '1473966968600-fa801b869a1a', description: 'Alfaiataria leve com pregas frontais e cinto faixa removível.', tags: ['novidades'], days: 4, sizes: SIZES_CLOTHES },
  { slug: 'tenis-runner-mono', name: 'Tênis Runner Mono', brand: 'Street Footwear', category: 'calcados', price: 429.9, compare: 549.9, image: '1595950653106-6c9ebd614d3a', description: 'Cabedal em couro sintético premium, entressola em EVA e solado antiderrapante.', tags: ['destaques', 'mais-vendidos', 'ofertas'], days: 9, sizes: SIZES_SHOES },
  { slug: 'tenis-canvas-classic', name: 'Tênis Canvas Classic', brand: 'Street Footwear', category: 'calcados', price: 259.9, image: '1525966222134-fcfa99b8ae77', description: 'Lona resinada, bico em borracha e palmilha anatômica removível.', tags: ['novidades', 'destaques'], days: 11, sizes: SIZES_SHOES },
  { slug: 'bota-couro-military', name: 'Bota Couro Military', brand: 'Street Footwear', category: 'calcados', price: 499.9, compare: 649.9, image: '1608256246200-53e635b5b65f', description: 'Couro legítimo, cadarço reforçado e solado tratorado para máxima aderência.', tags: ['ofertas'], days: 30, sizes: SIZES_SHOES },
  { slug: 'bone-aba-curva-logo', name: 'Boné Aba Curva Logo', brand: 'Mandrake Collection', category: 'acessorios', price: 89.9, image: '1588850561407-ed78c282e89b', description: 'Aba curva estruturada com bordado frontal e fecho snapback metálico.', tags: ['mais-vendidos', 'novidades'], days: 14, sizes: SIZES_ONE },
  { slug: 'cinto-couro-pulseira', name: 'Cinto Couro Pulseira', brand: 'Urban Line', category: 'acessorios', price: 129.9, compare: 159.9, image: '1624222247344-550fb60583dc', description: 'Couro legítimo com fivela em aço escovado e ajuste livre.', tags: ['ofertas'], days: 22, sizes: SIZES_ONE },
  { slug: 'mochila-utility-25l', name: 'Mochila Utility 25L', brand: 'Urban Line', category: 'acessorios', price: 289.9, image: '1553062407-98eeb64c6a62', description: 'Nylon resistente com compartimento para notebook 15, bolsos laterais e costas acolchoadas.', tags: ['novidades', 'destaques'], days: 7, sizes: SIZES_ONE },
]

const COLORS = [
  { name: 'Preto', hex: '#050505' },
  { name: 'Grafite', hex: '#4a4a4a' },
  { name: 'Off-white', hex: '#e8e4dc' },
]

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString()

export function createSeedState(): StoreState {
  return {
    products: SEEDS.map((seed, index) => {
      const sizes = seed.sizes
      const variants = sizes.flatMap((size, si) =>
        COLORS.map((color, ci) => ({
          size,
          color: color.name,
          stock: (index + si + ci) % 5 === 0 ? 0 : 3 + ((index + si * 2 + ci) % 9),
        })),
      )
      return {
        id: `prod-${String(index + 1).padStart(2, '0')}`,
        slug: seed.slug,
        name: seed.name,
        brand: seed.brand,
        category: seed.category,
        description: seed.description,
        shortDescription: '',
        details: detailLines,
        price: seed.price,
        comparePrice: seed.compare,
        images: [productImage(seed.image), productImage('1523381210434-271e8be1f52b'), productImage('1551232864-3f0890e580d9')],
        colors: COLORS.map((c) => c.name),
        sizes,
        variants,
        tags: seed.tags,
        active: true,
        createdAt: isoDaysAgo(seed.days),
      }
    }),
    categories: [
      { id: 'cat-1', name: 'Camisetas', slug: 'camisetas', description: 'Malhas premium e modelagens contemporâneas', image: productImage('1521572163474-6864f9cf17ab'), active: true },
      { id: 'cat-2', name: 'Jaquetas', slug: 'jaquetas', description: 'Camadas fortes para a rua', image: productImage('1591047139829-d91aecb6caea'), active: true },
      { id: 'cat-3', name: 'Calças', slug: 'calcas', description: 'Cargo, jeans e alfaiataria', image: productImage('1541099649105-f69ad21f3246'), active: true },
      { id: 'cat-4', name: 'Bermudas', slug: 'bermudas', description: 'Leveza urbana', image: productImage('1591195853828-11db59a44f6b'), active: true },
      { id: 'cat-5', name: 'Calçados', slug: 'calcados', description: 'Tênis e botas originais', image: productImage('1595950653106-6c9ebd614d3a'), active: true },
      { id: 'cat-6', name: 'Acessórios', slug: 'acessorios', description: 'Bonés, cintos e mochilas', image: productImage('1588850561407-ed78c282e89b'), active: true },
    ],
    brands: [
      { id: 'br-1', name: 'Mandrake Collection', slug: 'mandrake-collection' },
      { id: 'br-2', name: 'Urban Line', slug: 'urban-line' },
      { id: 'br-3', name: 'Denim House', slug: 'denim-house' },
      { id: 'br-4', name: 'Street Footwear', slug: 'street-footwear' },
    ],
    banners: [
      { id: 'ban-1', order: 1, eyebrow: 'Nova coleção', title: 'Moda urbana assumida', description: 'Peças autorais com caimento impecável e acabamento premium. Lançamentos toda semana.', ctaLabel: 'Ver coleção', ctaLink: '/categoria/camisetas', image: productImage('1490481651871-ab68de25d43d', 1800), active: true },
      { id: 'ban-2', order: 2, eyebrow: 'Camisetas e polos', title: 'Essenciais que definem o look', description: 'Malhas encorpadas, gola firme e modelagem oversized. O básico bem feito.', ctaLabel: 'Comprar camisetas', ctaLink: '/categoria/camisetas', image: productImage('1521572163474-6864f9cf17ab', 1800), active: true },
      { id: 'ban-3', order: 3, eyebrow: 'Calçados originais', title: 'Pisada premium', description: 'Tênis e botas de marcas autorizadas, com garantia e originalidade garantida.', ctaLabel: 'Ver calçados', ctaLink: '/categoria/calcados', image: productImage('1595950653106-6c9ebd614d3a', 1800), active: true },
      { id: 'ban-4', order: 4, eyebrow: 'Marcas em destaque', title: 'Streetwear de verdade', description: 'Revendedor autorizado. Mais de 5 anos vestindo a cena de Patos de Minas.', ctaLabel: 'Ver catálogo', ctaLink: '/produtos', image: productImage('1523381210434-271e8be1f52b', 1800), active: true },
    ],
    orders: [],
    neighborhoods: [
      { id: 'nb-1', name: 'Centro', fee: 8, estimate: 'Mesmo dia', active: true },
      { id: 'nb-2', name: 'Rosário', fee: 10, estimate: 'Até 24h', active: true },
      { id: 'nb-3', name: 'Sobradinho', fee: 12, estimate: 'Até 24h', active: true },
      { id: 'nb-4', name: 'Caiçaras', fee: 14, estimate: '1 a 2 dias úteis', active: true },
      { id: 'nb-5', name: 'Bela Vista', fee: 14, estimate: '1 a 2 dias úteis', active: true },
      { id: 'nb-6', name: 'Cidade Jardim', fee: 16, estimate: '1 a 2 dias úteis', active: true },
    ],
    settings: DEFAULT_SETTINGS,
    cart: [],
    customer: null,
    customerAddress: null,
    myOrderCodes: [],
  }
}
