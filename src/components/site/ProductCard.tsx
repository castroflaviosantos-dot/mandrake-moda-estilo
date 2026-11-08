import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { useStore } from '@/lib/store'
import { brl, discountPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { addToCart } = useStore()
  const discount = discountPercent(product.price, product.comparePrice)
  const stock = product.variants.reduce((acc, v) => acc + v.stock, 0)
  const available = product.variants.some((v) => v.stock > 0)
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 14 * 86400000

  const quickAdd = () => {
    const first = product.variants.find((v) => v.stock > 0)
    if (!first) {
      toast.error('Produto sem estoque no momento')
      return
    }
    addToCart(product.id, first.size, first.color, 1)
    toast.success('Adicionado ao carrinho')
  }

  return (
    <article className={cn('group flex flex-col', className)}>
      <div className="relative overflow-hidden bg-muted">
        <Link to={`/produto/${product.slug}`} className="block aspect-[3/4] overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">-{discount}%</span>
          )}
          {isNew && (
            <span className="bg-black px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">NOVO</span>
          )}
          {!available && (
            <span className="bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground">ESGOTADO</span>
          )}
        </div>
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={quickAdd}
            disabled={!available}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-white text-[10px] font-bold uppercase tracking-[0.16em] text-black transition-all duration-200 hover:bg-white/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="size-3.5" /> Adicionar
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</p>
        <Link to={`/produto/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className="text-[15px] font-semibold">{brl(product.price)}</span>
          {product.comparePrice ? (
            <span className="text-xs text-muted-foreground line-through">{brl(product.comparePrice)}</span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground">3x de {brl(product.price / 3)} sem juros</p>
        <Link
          to={`/produto/${product.slug}`}
          className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Ver produto
        </Link>
      </div>
    </article>
  )
}
