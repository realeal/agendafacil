import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Service } from '@/src/types';
import { formatBRL, cn } from '@/src/lib/utils';
import { Clock, ChevronDown, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    api.getServices().then(setServices).finally(() => setLoading(false));
  }, []);

  const categories = ['Todos', ...new Set(services.map(s => s.category).filter(Boolean) as string[])];
  const filteredServices = filter === 'Todos' ? services : services.filter(s => s.category === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-text-muted">Carregando serviços...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-2xl md:text-3xl font-black mb-2">Nossos Serviços</h2>
          <p className="text-text-muted">Clique em um serviço para ver mais detalhes</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-accent text-background px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
        >
          Agendar agora
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border-2 transition-all",
              filter === cat 
                ? "bg-accent border-accent text-background" 
                : "border-border-custom text-text-muted hover:border-accent/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredServices.map(s => (
          <div 
            key={s.id} 
            className={cn(
              "bg-surface border-2 rounded-2xl overflow-hidden transition-all",
              expandedId === s.id ? "border-accent" : "border-border-custom"
            )}
          >
            <button 
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-surface-hover flex items-center justify-center text-2xl overflow-hidden shrink-0">
                {s.image ? <img src={s.image} className="w-full h-full object-cover" /> : s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg truncate">{s.name}</h4>
                <div className="flex gap-4 text-xs text-text-muted mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {s.duration} min</span>
                  {s.category && <span>📂 {s.category}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-accent text-lg">{formatBRL(s.price)}</div>
                <ChevronDown className={cn("w-5 h-5 text-text-muted transition-transform ml-auto mt-1", expandedId === s.id && "rotate-180 text-accent")} />
              </div>
            </button>

            <AnimatePresence>
              {expandedId === s.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border-custom"
                >
                  <div className="p-6 space-y-6">
                    {s.description && <p className="text-text-muted leading-relaxed">{s.description}</p>}
                    
                    {s.includes && s.includes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {s.includes.map((item, i) => (
                          <span key={i} className="bg-accent/10 border border-accent/20 text-accent text-[0.7rem] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Check size={12} strokeWidth={4} /> {item}
                          </span>
                        ))}
                      </div>
                    )}

                    <button 
                      onClick={() => window.location.href = '/'}
                      className="w-full bg-accent text-background py-4 rounded-xl font-black hover:scale-[1.01] active:scale-100 transition-all"
                    >
                      Agendar este serviço →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
