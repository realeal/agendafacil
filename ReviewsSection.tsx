import { useState, useEffect } from 'react';
import { Star, Quote, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/src/services/api';
import { Review } from '@/src/types';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await api.getReviews();
        setReviews(data);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  // Fallback if no reviews
  const displayReviews = reviews.length > 0 ? reviews : [
    { client_name: "Ana Paula", comment: "Atendimento impecável! Recomendo a todos!", stars: 5, client_cpf: '1' },
    { client_name: "Ricardo Santos", comment: "Ambiente moderno e acolhedor. Nota 10!", stars: 5, client_cpf: '2' },
    { client_name: "Juliana Mendes", comment: "Fiquei impressionada com a atenção aos detalhes.", stars: 5, client_cpf: '3' }
  ];

  return (
    <section className="py-16 md:py-24">
      <div>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">O que dizem nossos clientes</h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            A satisfação de quem confia em nosso trabalho é o nosso maior orgulho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8, scale: 1.03, borderColor: 'var(--accent-color)' }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-background border border-border-custom rounded-3xl p-8 shadow-xl hover:shadow-accent/10 transition-all relative group"
            >
              <div className="absolute top-6 right-8 text-accent/10 group-hover:text-accent/20 transition-colors">
                <Quote size={48} />
              </div>
              
              <div className="flex gap-1 mb-6">
                {Array.from({ length: review.stars }).map((_, idx) => (
                  <Star key={idx} className="text-accent fill-accent" size={16} />
                ))}
              </div>

              <p className="text-text-muted leading-relaxed mb-8 italic relative z-10">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-accent/20 bg-accent/10 flex items-center justify-center font-black text-accent">
                  {review.client_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{review.client_name}</div>
                  <div className="text-[0.65rem] text-text-muted uppercase font-black tracking-widest">Cliente</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
