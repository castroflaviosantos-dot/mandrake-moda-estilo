import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CheckoutStep = 'carrinho' | 'entrega' | 'checkout' | 'confirmado'

const steps: { id: CheckoutStep; label: string; to: string }[] = [
  { id: 'carrinho', label: 'Carrinho', to: '/carrinho' },
  { id: 'entrega', label: 'Entrega', to: '/entrega' },
  { id: 'checkout', label: 'Checkout', to: '/checkout' },
  { id: 'confirmado', label: 'Confirmação', to: '' },
]

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = steps.findIndex((s) => s.id === current)

  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border bg-card px-4 py-3">
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const content = (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full border text-[11px] font-semibold',
                done && 'border-white bg-white text-black',
                active && 'border-white text-white',
                !done && !active && 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-[10px] uppercase tracking-[0.16em]',
                active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/60',
              )}
            >
              {step.label}
            </span>
          </span>
        )

        return (
          <li key={step.id} className="flex items-center gap-3">
            {step.to && !active ? (
              <Link to={step.to} className="hover:opacity-80">{content}</Link>
            ) : content}
            {index < steps.length - 1 && <span className="h-px w-6 bg-border sm:w-10" />}
          </li>
        )
      })}
    </ol>
  )
}
