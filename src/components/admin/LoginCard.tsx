import { useState } from 'react'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

const input = 'h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-white/50'
const label = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

export function LoginCard({ onSuccess }: { onSuccess: () => void }) {
  const { loginAdmin, loginError, adminMode } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const supabaseMode = adminMode === 'supabase'
  const emailValue = supabaseMode ? email : password

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await loginAdmin(emailValue, supabaseMode ? password : undefined)
      if (ok) {
        toast.success('Acesso liberado')
        onSuccess()
      } else {
        setError(loginError || 'Credenciais inválidas. Verifique e tente novamente.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm border border-border bg-card p-6">
      <div className="mb-6 text-center">
        <div className="mx-auto grid size-11 place-items-center border border-border"><Lock className="size-4" /></div>
        <p className="mt-4 font-display text-2xl uppercase tracking-[0.14em]">Mandrake</p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Painel administrativo</p>
      </div>

      {supabaseMode ? (
        <div className="space-y-3">
          <label className="block">
            <span className={label}>E-mail do administrador</span>
            <input className={input} value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} type="email" autoComplete="username" autoFocus required />
          </label>
          <label className="block">
            <span className={label}>Senha</span>
            <input className={input} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} type="password" autoComplete="current-password" required />
          </label>
        </div>
      ) : (
        <label className="block">
          <span className={label}>Senha de acesso (demonstração)</span>
          <input className={input} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} type="password" autoComplete="current-password" autoFocus required />
        </label>
      )}

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}

      <Button type="submit" disabled={busy} className="mt-4 h-11 w-full bg-white text-[11px] uppercase tracking-[0.16em] text-black">
        {busy && <Loader2 className="size-4 animate-spin" />} {busy ? 'Entrando…' : 'Entrar no painel'}
      </Button>

      <p className="mt-4 border border-border bg-secondary/40 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        {supabaseMode
          ? 'Acesso restrito a contas cadastradas como administrador. Fale com o responsável para liberar um novo acesso.'
          : 'Este ambiente está sem conexão com o banco (URL e chave não chegaram ao build). Por isso o acesso é apenas pela senha de demonstração.'}
      </p>
      <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Voltar para a loja</Link>
    </form>
  )
}
