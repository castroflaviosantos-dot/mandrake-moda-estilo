import { useMemo } from 'react'
import { brl } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Gráfico de barras interativo em SVG puro (sem dependências extras). */
export function BarChart({ data, height = 180, format = 'currency' }: { data: { label: string; value: number }[]; height?: number; format?: 'currency' | 'number' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const fmt = (v: number) => (format === 'currency' ? brl(v) : String(v))
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-black px-2 py-1 text-[10px] group-hover:block">
            {d.label}: {fmt(d.value)}
          </div>
          <div
            className={cn('w-full rounded-t-[2px] transition-all duration-300', d.value > 0 ? 'bg-white/85 group-hover:bg-white' : 'bg-secondary')}
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
          <p className="mt-1.5 truncate text-center text-[9px] uppercase tracking-wider text-muted-foreground">{d.label}</p>
        </div>
      ))}
    </div>
  )
}

/** Gráfico de linha/área com pontos interativos. */
export function LineChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 600
  const h = height
  const pad = 8
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const points = useMemo(
    () => data.map((d, i) => ({ x: pad + i * step, y: h - pad - (d.value / max) * (h - pad * 2), ...d })),
    [data, max, step, h],
  )
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${points[points.length - 1]?.x ?? 0},${h} L${points[0]?.x ?? 0},${h} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="#242424" strokeWidth={1} />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={path} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={2.4} fill="#050505" stroke="#ffffff" strokeWidth={1.4}>
            <title>{`${p.label}: ${brl(p.value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  )
}

/** Comparativo de períodos em barras horizontais. */
export function CompareBars({ rows }: { rows: { label: string; current: number; previous: number }[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.current, r.previous]))
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const diff = r.previous ? ((r.current - r.previous) / r.previous) * 100 : 0
        return (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between text-[11px]">
              <span className="uppercase tracking-[0.12em] text-muted-foreground">{r.label}</span>
              <span className="flex items-center gap-2"><span className="font-semibold">{brl(r.current)}</span>
                <span className={cn('text-[10px]', diff >= 0 ? 'text-emerald-400' : 'text-red-400')}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-1 bg-white/40" style={{ width: `${(r.previous / max) * 100}%` }} />
            </div>
            <div className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-2 bg-white" style={{ width: `${(r.current / max) * 100}%` }} />
            </div>
          </div>
        )
      })}
      <p className="flex gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-1 w-4 bg-white/40" /> Período anterior</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-4 bg-white" /> Período atual</span>
      </p>
    </div>
  )
}
