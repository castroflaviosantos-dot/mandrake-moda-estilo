import type { Product } from './types'
import { productImage } from './format'

const img = (id: string) => productImage(id)
const gallery = (id: string) => [img(id), img('1523381210434-271e8be1f52b'), img('1551232864-3f0890e580d9')]

type Seed = {
  slug: string
  name: string
  brand: string
  category: string
  price: number
  comparePrice?: number
  description: string
  image: string
  sizes?: string[]
  tags?: string[]
  daysAgo?: number
}

const seeds: Seed[] = [
  { slug: 'camiseta-oversized-mandrake', name: 'Camiseta Oversized Signature', brand: 'Mandrake Collection', category: 'camisetas', price: 149.9, comparePrice: 189.9, description: 'Algodão penteado 240g, modelagem oversized e estampa exclusiva em silk de alta definição.', image: '1521572163474-6864f9cf17ab', tags: ['mais-vendidos', 'destaques'], daysAgo: 3 },
  { slug: 'camiseta-essential-preta', name: 'Camiseta Essential Preta', brand: 'Mandrake Collection', category: 'camisetas', price: 119.9, comparePrice: 149.9, description: 'Básico que sustenta o visual. Gola dupla, caimento reto e malha encorpada.', image: '1583743814966-8936f5b7be1a', tags: ['mais-vendidos', 'ofertas'], daysAgo: 12 },
  { slug: 'polo-piquet-nobre', name: 'Polo Piquet Nobre', brand: 'Mandrake Collection', category: 'camisetas', price: 229.9, comparePrice: 279.9, description: 'Piquet premium com detalhes em contraste, ideal para o equilíbrio entre casual e formal.', image: '1620012253295-c15cc3e65df4', tags: ['destaques', 'ofertas'], daysAgo: 20 },
  { slug: 'camiseta-cropped-urbana', name: 'Camiseta Cropped Urbana', brand: 'Urban Line', category: 'camisetas', price: 99.9, description: 'Cropped de malha leve com recortes modernos e acabamento reforçado.', image: '1503342217505-b0a15ec3261c', tags: ['novidades', 'mais-vendidos'], daysAgo: 1 },
  { slug: 'camiseta-manga-longa-heavy', name: 'Camiseta Manga Longa Heavy', brand: 'Mandrake Collection', category: 'camisetas', price: 179.9, comparePrice: 219.9, description: 'Malha pesada com punho canelado. Pensada para as noites frias de Patos de Minas.', image: '1618354691373-d851c5c3a990', tags: ['novidades', 'ofertas'], daysAgo: 5 },
  { slug: 'jaqueta-corta-vento-tech', name: 'Jaqueta Corta-Vento Tech', brand: 'Mandrake Collection', category: 'jaquetas', price: 349.9, comparePrice: 449.9, description: 'Tecido ripstop resistente à agua, capuz embutido e bolsos técnicos.', image: '1591047139829-d91aecb6caea', tags: ['destaques', 'mais-vendidos', 'ofertas'], daysAgo: 8 },
  { slug: 'moletom-hoodie-concrete', name: 'Moletom Hoodie Concrete', brand: 'Urban Line', category: 'jaquetas', price: 319.9, description: 'Moletom flanelado 400g com capuz forrado e estampa em puffs holográfico sutil.', image: '1556821840-3a63f95609a7', tags: ['mais-vendidos'], daysAgo: 15 },
  { slug: 'bomber-essential-preta', name: 'Jaqueta Bomber Essential', brand: 'Mandrake Collection', category: 'jaquetas', price: 389.9, comparePrice: 489.9, description: 'Bomber em sarja premium com forro quente e acabamento monocromático.', image: '1520975954732-35dd22299614', tags: ['destaques', 'ofertas'], daysAgo: 25 },
  { slug: 'calca-cargo-tactical', name: 'Calça Cargo Tactical', brand: 'Mandrake Collection', category: 'calcas', price: 249.9, comparePrice: 299.9, description: 'Ripstop encorpado, seis bolsos e ajuste de barra com cordão.', image: '1541099649105-f69ad21f3246', tags: ['mais-vendidos', 'destaques', 'ofertas'], daysAgo: 6 },
  { slug: 'calca-jeans-reta-stone', name: 'Calça Jeans Reta Stone', brand: 'Denim House', category: 'calcas', price: 219.9, description: 'Jeans stone com lavagem mediana, cós confortável e modelagem reta contemporânea.', image: '1542272604-787c3835535d', tags: ['novidades'], daysAgo: 2 },
  { slug: 'bermuda-sarja-street', name: 'Bermuda Sarja Street', brand: 'Mandrake Collection', category: 'bermudas', price: 159.9, comparePrice: 199.9, description: 'Sarja com elastano, comprimento na altura do joelho e bolsos utilitários.', image: '1591195853828-11db59a44f6b', tags: ['mais-vendidos', 'ofertas'], daysAgo: 18 },
  { slug: 'bermuda-alfaiataria-flow', name: 'Bermuda Alfaiataria Flow', brand: 'Urban Line', category: 'bermudas', price: 189.9, description: 'Alfaiataria leve com pregas frontais e cinto faixa removível.', image: '1473966968600-fa801b869a1a', tags: ['novidades'], daysAgo: 4 },
  { slug: 'tenis-runner-mono', name: 'Tênis Runner Mono', brand: 'Street Footwear', category: 'calcados', price: 429.9, comparePrice: 549.9, description: 'Cabedal em couro sintético premium, entressola em EVA e solado antiderrapante.', image: '1595950653106-6c9ebd614d3a', tags: ['destaques', 'mais-vendidos', 'ofertas'], daysAgo: 9 },
  { slug: 'tenis-canvas-classic', name: 'Tênis Canvas Classic', brand: 'Street Footwear', category: 'calcados', price: 259.9, description: 'Lona resinada, bico em borracha e palmilha anatômica removível.', image: '1525966222134-fcfa99b8ae77', tags: ['novidades', 'destaques'], daysAgo: 11 },
  { slug: 'bota-couro-military', name: 'Bota Couro Military', brand: 'Street Footwear', category: 'calcados', price: 499.9, comparePrice: 649.9, description: 'Couro legítimo, cadarço reforçado e solado tratorado para máxima aderência.', image: '1608256246200-53e635b5b65f', tags: ['ofertas'], daysAgo: 30 },
  { slug: 'bone-aba-curva-logo', name: 'Boné Aba Curva Logo', brand: 'Mandrake Collection', category: 'acessorios', price: 89.9, description: 'Aba curva estruturada com bordado frontal e fecho snapback metálico.', image: '1588850561407-ed78c282e89b', tags: ['mais-vendidos', 'novidades'], daysAgo: 14 },
  { slug: 'cinto-couro-pulseira', name: 'Cinto Couro Pulseira', brand: 'Urban Line', category: 'acessorios', price: 129.9, comparePrice: 159.9, description: 'Couro legítimo com fivela em aço escovado e ajuste livre.', image: '1624222247344-550fb60583dc', tags: ['ofertas'], daysAgo: 22 },
  { slug: 'mochila-utility-25l', name: 'Mochila Utility 25L', brand: 'Urban Line', category: 'acessorios', price: 289.9, description: 'Nylon resistente com compartimento para notebook 15", bolsos laterais e costas acolchoadas.', image: '1553062407-98eeb64c6a62', tags: ['novidades', 'destaques'], daysAgo: 7 },
]

const sizesFor = (category: string) =>
  category === 'calcados' ? ['37', '38', '39', '40', '41', '42', '43'] : category === 'acessorios' ? ['Único'] : ['P', 'M', 'G', 'GG']

const colorsFor = (category: string) =>
  category === 'calcados'
    ? [{ name: 'Preto', hex: '#050505' }, { name: 'Off-white', hex: '#e8e4dc' }]
    : [{ name: 'Preto', hex: '#050505' }, { name: 'Grafite', hex: '#4a4a4a' }, { name: 'Off-white', hex: '#e8e4dc' }]

export const SEED_PRODUCTS: Product[] = seeds.map((s, index) => {
  const sizes = sizesFor(s.category)
  const colors = colorsFor(s.category)
  const variants = sizes.flatMap((size, si) =>
    colors.map((color, ci) => ({ size, color: color.name, stock: (index + si + ci) % 5 === 0 ? 0 : 3 + ((index + si * 2 + ci) % 9) })),
  )
  const created = new Date()
  created.setDate(created.getDate() - (s.daysAgo ?? 10))
  return {
    id: `prod-${String(index + 1).padStart(2, '0')}`,
    slug: s.slug,
    name: s.name,
    brand: s.brand,
    category: s.category,
    description: s.description,
    details: ['Produto original com etiqueta', 'Peça selecionada pela curadoria Mandrake', 'Troca em até 7 dias na loja física'],
    price: s.price,
    comparePrice: s.comparePrice,
    images: gallery(s.image),
    colors,
    sizes,
    variants,
    tags: s.tags ?? [],
    active: true,
    createdAt: created.toISOString(),
  }
})
