import { useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

export function LoginCard({ onSuccess }: { onSuccess: () => void }) {
  const { loginAdmin } = useStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (loginAdmin(password)) {
          toast.success('Acesso liberado')
          onSuccess()
        } else {
          setError('Senha incorreta. Verifique e tente novamente.')
        }
      }}
      className="w-full max-w-sm border border-border bg-card p-6"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto grid size-11 place-items-center border border-border"><Lock className="size-4" /></div>
        <p className="mt-4 font-display text-2xl uppercase tracking-[0.14em]">Mandrake</p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Painel administrativo</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Senha de acesso</span>
        <input
          className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-white/50"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          type="password"
          autoFocus
          required
        />
      </label>
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      <Button type="submit" className="mt-4 h-11 w-full rounded-sm bg-white text-[11px] uppercase tracking-[0.16em] text-black">Entrar no painel</Button>
      <p className="mt-4 border border-border bg-secondary/40 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        Acesso de demonstração: senha <span className="text-foreground">mandrake2025</span>. Em produção, a autenticação deve ser migrada para Supabase Auth com perfis e MFA.
      </p>
      <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Voltar para a loja</Link>
    </form>
  )
}
