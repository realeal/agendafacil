import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Professional } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Star, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfessionalSection() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    api.getProfessionals()
      .then(data => {
        setProfessionals(data.filter(p => p.showInVitrine));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (professionals.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [professionals.length, isPaused]);

  const next = () => setCurrent((prev) => (prev + 1) % professionals.length);
  const prev = () => setCurrent((prev) => (prev - 1 + professionals.length) % professionals.length);

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (professionals.length === 0) return null;

  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter">Nossa Equipe</h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Conheça os especialistas dedicados a oferecer o melhor atendimento para você.
        </p>
      </div>

      <div 
        className="relative group/carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* We show 3 professionals starting from 'current' */}
            {[0, 1, 2].map((offset) => {
              const index = (current + offset) % professionals.length;
              const p = professionals[index];
              
              // On mobile we only show 1, on tablet 2, on desktop 3
              const isVisibleOnMobile = offset === 0;
              const isVisibleOnTablet = offset < 2;
              const isVisibleOnDesktop = true;

              return (
                <motion.div
                  key={`${p.id}-${offset}`}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className={cn(
                    "bg-surface border border-border-custom rounded-3xl overflow-hidden hover:border-accent/50 transition-all shadow-2xl hover:shadow-accent/20 flex flex-col h-full",
                    !isVisibleOnMobile && "hidden sm:hidden",
                    isVisibleOnMobile && "flex",
                    isVisibleOnTablet && "md:flex",
                    isVisibleOnDesktop && "lg:flex"
                  )}
                >
                  <div className="h-64 overflow-hidden relative">
                    {p.photo ? (
                      <img 
                        src={p.photo} 
                        alt={p.name} 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-hover flex items-center justify-center text-5xl font-black text-text-muted">
                        {p.initials}
                      </div>
                    )}
                    <div className="absolute top-6 right-6 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-lg">
                      <Star className="text-accent fill-accent" size={16} />
                      <span className="text-sm font-black">4.9</span>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="text-accent text-[0.7rem] font-black uppercase tracking-[0.2em] mb-2">{p.role}</div>
                    <h3 className="text-xl font-black mb-3">{p.name}</h3>
                    <p className="text-text-muted text-sm line-clamp-3 mb-6 leading-relaxed flex-1">
                      {p.bio || "Especialista dedicado com anos de experiência em sua área de atuação, focado em resultados e bem-estar."}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-8">
                      {p.specialties?.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="text-[0.65rem] font-black bg-surface-hover border border-border-custom px-3 py-1.5 rounded-xl text-text-muted uppercase tracking-wider">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <button 
                      onClick={() => document.getElementById('booking-flow')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full flex items-center justify-center gap-3 bg-accent text-background py-3.5 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20 group/btn"
                    >
                      Agendar com {p.name.split(' ')[0]}
                      <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {professionals.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-surface/80 backdrop-blur-xl border border-border-custom hover:bg-accent hover:text-background transition-all shadow-2xl z-10 opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={next}
              className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-surface/80 backdrop-blur-xl border border-border-custom hover:bg-accent hover:text-background transition-all shadow-2xl z-10 opacity-0 group-hover/carousel:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="flex justify-center gap-3 mt-12">
          {professionals.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                current === i ? "w-12 bg-accent" : "w-2 bg-border-custom hover:bg-accent/30"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
