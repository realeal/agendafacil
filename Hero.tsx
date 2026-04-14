import { motion } from 'motion/react';

export default function Hero() {
  const stats = [
    { value: '280k+', label: 'Membros ativos' },
    { value: '4.9★', label: 'Avaliação média' },
    { value: '98%', label: 'Satisfação' },
    { value: '12k+', label: 'Agendamentos/mês' },
  ];

  return (
    <section className="relative pt-16 pb-12 px-6 text-center max-w-7xl mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        {/* Spinning Badge */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          <div className="absolute inset-0 border-3 border-dashed border-accent rounded-full animate-spin-slow" />
          <div className="absolute inset-[-10px] border border-dotted border-accent/35 rounded-full animate-spin-reverse-slow" />
          <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 bg-accent rounded-full flex flex-col items-center justify-center shadow-[0_0_0_6px_var(--color-accent-t15)]">
            <span className="text-[0.5rem] md:text-[0.55rem] font-bold text-background/45 uppercase tracking-wider">até</span>
            <span className="text-2xl md:text-4xl font-black text-background leading-none">80%</span>
            <span className="text-[0.6rem] md:text-[0.75rem] font-extrabold text-background uppercase tracking-widest leading-none">OFF</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-start">
          <div className="bg-surface-hover border border-border-custom text-accent-secondary text-[0.7rem] font-medium px-4 py-1.5 rounded-full uppercase tracking-wider">
            ✦ Reserva online 24h
          </div>
          <div className="bg-accent/10 border border-accent text-accent text-[0.7rem] font-medium px-4 py-1.5 rounded-full uppercase tracking-wider">
            🔥 Oferta por tempo limitado
          </div>
        </div>
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-6"
      >
        Agende seu<br />
        <em className="not-italic text-accent">horário perfeito</em>
      </motion.h1>

      <p className="text-text-muted text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
        Escolha o serviço, selecione data e horário, e confirme em menos de 2 minutos.
      </p>

      {/* Avatar Stack */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex -space-x-3">
          {['AM', 'CR', 'BL', 'JF', 'PT'].map((initials, i) => (
            <div 
              key={i}
              className="w-9 h-9 rounded-full bg-surface-hover border-2 border-background flex items-center justify-center text-[0.7rem] font-bold text-accent"
            >
              {initials}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[0.6rem] font-black text-background">
            +
          </div>
        </div>
        <span className="ml-4 text-sm text-text-muted">Junte-se a milhares de clientes satisfeitos</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 max-w-4xl mx-auto">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center px-4 md:border-r last:border-0 border-border-custom">
            <div className="text-2xl font-extrabold text-text-main leading-none">
              {stat.value.split('').map((char, j) => (
                <span key={j} className={char === '★' || char === '%' || char === '+' ? 'text-accent' : ''}>
                  {char}
                </span>
              ))}
            </div>
            <div className="text-[0.7rem] text-text-muted uppercase tracking-wider mt-2">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
