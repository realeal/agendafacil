import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { FAQItem } from '@/src/types';
import { Plus, Minus, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    async function loadFAQs() {
      try {
        const data = await api.getFAQs();
        setFaqs(data);
      } catch (err) {
        console.error('Error loading FAQs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFAQs();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-text-muted">Carregando perguntas frequentes...</p>
      </div>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-widest mb-4">
          <HelpCircle size={14} /> Dúvidas Comuns
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter">Perguntas Frequentes</h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Tudo o que você precisa saber sobre nossos serviços, agendamentos e políticas.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div 
              key={faq.id} 
              className={cn(
                "group border border-border-custom rounded-3xl overflow-hidden transition-all duration-300",
                isOpen ? "bg-surface border-accent/30 shadow-2xl shadow-accent/5" : "bg-surface/50 hover:bg-surface hover:border-accent/20"
              )}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id!)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
              >
                <span className={cn(
                  "text-lg md:text-xl font-bold transition-colors",
                  isOpen ? "text-accent" : "text-text-main"
                )}>
                  {faq.q}
                </span>
                <div className={cn(
                  "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isOpen ? "bg-accent text-background rotate-180" : "bg-surface-hover text-text-muted group-hover:text-accent"
                )}>
                  {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 md:px-8 pb-8 text-text-muted leading-relaxed text-lg border-t border-border-custom/50 pt-6">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mt-16 p-8 bg-surface border border-border-custom rounded-3xl text-center">
        <p className="text-text-muted mb-6">Ainda tem alguma dúvida?</p>
        <button 
          onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
          className="bg-accent text-background px-8 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
        >
          Falar com nosso atendimento
        </button>
      </div>
    </section>
  );
}
