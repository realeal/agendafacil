import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/src/services/api';
import { CarouselSlide } from '@/src/types';
import { cn } from '@/src/lib/utils';

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1920&auto=format&fit=crop",
    title: "Excelência em Cuidados",
    subtitle: "Os melhores profissionais para o seu bem-estar.",
    order: 1,
    titleColor: "#ffffff",
    titleAlign: "center",
    titleFont: "sans"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1920&auto=format&fit=crop",
    title: "Ambiente Acolhedor",
    subtitle: "Sinta-se em casa enquanto cuidamos de você.",
    order: 2,
    titleColor: "#ffffff",
    titleAlign: "center",
    titleFont: "sans"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1512496011212-724e747f710a?q=80&w=1920&auto=format&fit=crop",
    title: "Tecnologia de Ponta",
    subtitle: "Equipamentos modernos para resultados precisos.",
    order: 3,
    titleColor: "#ffffff",
    titleAlign: "center",
    titleFont: "sans"
  }
];

export default function Carousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSlides() {
      const hasKeys = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!hasKeys) {
        console.warn('Carousel: Supabase keys missing, using default slides.');
        setSlides(DEFAULT_SLIDES);
        setLoading(false);
        return;
      }
      try {
        const data = await api.getCarouselSlides();
        setSlides(data.length > 0 ? data : DEFAULT_SLIDES);
      } catch (err) {
        console.error('Error loading carousel slides:', err);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    }
    loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  if (loading) {
    return (
      <div className="w-full h-[400px] md:h-[600px] flex items-center justify-center bg-surface border border-border-custom rounded-3xl mt-8">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden rounded-3xl mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
          
          <div className={cn(
            "absolute inset-0 flex flex-col px-6 justify-center",
            slides[current].titleAlign === 'left' ? "items-start text-left" :
            slides[current].titleAlign === 'right' ? "items-end text-right" :
            "items-center text-center"
          )}>
            {slides[current].showDiscountBadge && slides[current].discountBadgeText && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute top-4 right-4 md:top-8 md:right-8 bg-accent text-background px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-accent/40 z-10"
              >
                {slides[current].discountBadgeText}
              </motion.div>
            )}
            {slides[current].title && (
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                  "text-2xl md:text-4xl font-black mb-4 drop-shadow-2xl px-4",
                  slides[current].titleFont === 'serif' ? "font-serif" :
                  slides[current].titleFont === 'mono' ? "font-mono" :
                  "font-sans"
                )}
                style={{ color: slides[current].titleColor || '#ffffff' }}
              >
                {slides[current].title}
              </motion.h2>
            )}
            {slides[current].subtitle && (
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-base md:text-lg text-text-muted max-w-2xl drop-shadow-lg"
              >
                {slides[current].subtitle}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-all ${current === i ? 'bg-accent w-8' : 'bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>

          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-all"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-all"
          >
            <ChevronRight className="text-white" size={24} />
          </button>
        </>
      )}
    </div>
  );
}
