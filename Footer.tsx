import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '@/src/services/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.getSettings('footer').then(data => {
      if (data) setSettings(data);
    });
  }, []);

  const instagramUrl = settings?.instagram || "#";
  const facebookUrl = settings?.facebook || "#";
  const whatsappUrl = settings?.whatsapp || "#";
  const address = settings?.address || "Av. Paulista, 1000 - Bela Vista, São Paulo - SP";
  const phone = settings?.phone || "(11) 99999-9999";
  const email = settings?.email || "contato@agendafacil.com.br";

  return (
    <footer className="bg-surface border-t border-border-custom pt-20 pb-10 px-4 md:px-8 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <span className="text-text-main">agenda</span>
              <span className="text-accent">fácil</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              Sua plataforma definitiva para agendamentos inteligentes. Conectamos você aos melhores profissionais com praticidade e elegância.
            </p>
            <div className="flex gap-4">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-hover border border-border-custom flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all">
                <Instagram size={20} />
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-hover border border-border-custom flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all">
                <Facebook size={20} />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-surface-hover border border-border-custom flex items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all">
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-xs tracking-widest text-text-main">Navegação</h4>
            <ul className="space-y-4">
              {[
                { label: 'Início', path: '/' },
                { label: 'Serviços', path: '/servicos' },
                { label: 'Portal do Cliente', path: '/clientes' },
                { label: 'Administração', path: '/admin' },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-text-muted hover:text-accent text-sm flex items-center gap-2 group transition-colors"
                  >
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-xs tracking-widest text-text-main">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-text-muted text-sm">
                <MapPin size={18} className="text-accent shrink-0" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3 text-text-muted text-sm">
                <Phone size={18} className="text-accent shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex items-center gap-3 text-text-muted text-sm">
                <Mail size={18} className="text-accent shrink-0" />
                <span>{email}</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-xs tracking-widest text-text-main">Horários</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-text-muted text-sm">
                <Clock size={18} className="text-accent shrink-0" />
                <div>
                  <p className="font-bold text-text-main">Segunda - Sexta</p>
                  <p>08:00 - 20:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-text-muted text-sm">
                <Clock size={18} className="text-accent shrink-0" />
                <div>
                  <p className="font-bold text-text-main">Sábado</p>
                  <p>09:00 - 16:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-text-muted text-sm opacity-50">
                <Clock size={18} className="shrink-0" />
                <div>
                  <p className="font-bold">Domingo</p>
                  <p>Fechado</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-xs tracking-widest text-text-main">Políticas</h4>
            <ul className="space-y-4">
              {[
                { label: 'Política de privacidade', path: '#' },
                { label: 'Termos de uso', path: '#' },
                { label: 'Cancelamentos', path: '#' },
              ].map((link, i) => (
                <li key={i}>
                  <a 
                    href={link.path} 
                    className="text-text-muted hover:text-accent text-sm flex items-center gap-2 group transition-colors"
                  >
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-custom flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs">
            © {currentYear} AgendaFácil. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Segurança & Transparência</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
