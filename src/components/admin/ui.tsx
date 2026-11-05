import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {subtitle && <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{subtitle}</p>}
        <h1 className="font-display text-3xl uppercase leading-none">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn('border border-border bg-card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title && <h2 className="text-[11px] font-bold uppercase tracking-[0.16em]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 py-10" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-lg border border-border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em]">{title}</h2>
          <button onClick={onClose} className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Fechar</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export const adminInput =
  'h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-white/50'

export function AdminField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
