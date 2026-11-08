import { Link } from 'react-router-dom'
import { Camera, MapPin, MessageCircle, Phone, ShieldCheck, Truck, CreditCard, Store } from 'lucide-react'
import { useStore } from '@/lib/store'
import { whatsappLink } from '@/lib/format'

export function Footer() {
  const { state } = useStore()
  const s = state.settings
  return (
    <footer className="mt-24 border-t border-border bg-[#080808]">
      <div className="border-b border-border/70">
        <div className="container-mandrake grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: 'Envio nacional', text: 'Para todo o Brasil' },
            { icon: Store, title: 'Retirada na loja', text: 'Em Patos de Minas' },
            { icon: CreditCard, title: 'Pix e cartão', text: 'Até 3x sem juros' },
            { icon: ShieldCheck, title: 'Produtos originais', text: 'Revenda autorizada' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-white/70" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">{title}</p>
                <p className="text-[11px] text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-mandrake grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <img src="/logo-mandrake.png" alt="Mandrake Moda e Estilo" width={48} height={48} className="size-12 shrink-0 rounded-full object-contain ring-1 ring-white/10" />
            <div>
              <p className="font-display text-2xl tracking-[0.14em]">MANDRAKE</p>
              <p className="mt-1 text-[9px] tracking-[0.4em] text-muted-foreground">MODA E ESTILO</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Moda urbana, vestuário e marcas originais. Há mais de 5 anos vestindo atitude em Patos de Minas e em todo o Brasil.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={`https://instagram.com/${s.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-full border border-border hover:bg-white hover:text-black"><Camera className="size-4" /></a>
            <a href={whatsappLink(s.whatsapp, 'Olá! Vim pelo site.')} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-9 place-items-center rounded-full border border-border hover:bg-white hover:text-black"><MessageCircle className="size-4" /></a>
            <a href={`tel:+55${s.whatsapp}`} aria-label="Telefone" className="grid size-9 place-items-center rounded-full border border-border hover:bg-white hover:text-black"><Phone className="size-4" /></a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Loja</p>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/produtos" className="hover:text-foreground">Todos os produtos</Link></li>
            <li><Link to="/novidades" className="hover:text-foreground">Novidades</Link></li>
            {state.categories.slice(0, 4).map((c) => (
              <li key={c.id}><Link to={`/categoria/${c.slug}`} className="hover:text-foreground">{c.name}</Link></li>
            ))}
            <li><Link to="/marcas" className="hover:text-foreground">Marcas</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Atendimento</p>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/conta" className="hover:text-foreground">Minha conta</Link></li>
            <li><Link to="/acompanhar" className="hover:text-foreground">Acompanhar pedido</Link></li>
            <li><a href={whatsappLink(s.whatsapp, 'Olá! Preciso de ajuda com meu pedido.')} target="_blank" rel="noreferrer" className="hover:text-foreground">Trocas e devoluções</a></li>
            <li><a href={whatsappLink(s.whatsapp, 'Olá! Tenho uma dúvida sobre entrega.')} target="_blank" rel="noreferrer" className="hover:text-foreground">Prazos e entregas</a></li>
            <li><Link to="/admin" className="hover:text-foreground">Área do administrador</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Loja física</p>
          <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>{s.address.street}, {s.address.number} — {s.address.neighborhood}<br />{s.address.city} / {s.address.state}</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Seg a Sex, 9h às 18h · Sáb, 9h às 13h
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            WhatsApp<br /><a href={whatsappLink(s.whatsapp, 'Olá!')} target="_blank" rel="noreferrer" className="text-base font-medium text-foreground">(34) 99879-5725</a>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Instagram<br /><a href={`https://instagram.com/${s.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-foreground">{s.instagram}</a></p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container-mandrake flex flex-col items-center justify-between gap-2 py-5 text-[11px] text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Mandrake Moda e Estilo · CNPJ 00.000.000/0001-00</p>
          <p>Patos de Minas — MG · Compra segura</p>
        </div>
      </div>
    </footer>
  )
}
