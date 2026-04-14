import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BookingStepper from './components/BookingStepper';
import ServicesPage from './pages/ServicesPage';
import AdminPage from './pages/AdminPage';
import ProfessionalPage from './pages/ProfessionalPage';
import CustomerPortal from './pages/CustomerPortal';
import Carousel from './components/Carousel';
import ProfessionalSection from './components/ProfessionalSection';
import ReviewsSection from './components/ReviewsSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';

// Placeholder Components for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6">
    <h2 className="text-3xl font-bold text-accent mb-4">{title}</h2>
    <p className="text-text-muted">Esta página está em construção.</p>
  </div>
);

export default function App() {
  useEffect(() => {
    async function loadTheme() {
      try {
        const [color, theme] = await Promise.all([
          api.getSettings('accent_color'),
          api.getSettings('theme')
        ]);

        if (color) {
          document.documentElement.style.setProperty('--accent-color', color);
        }

        if (theme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      }
    }
    loadTheme();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 px-4 md:px-8 lg:px-12">
          <main className="max-w-[1400px] mx-auto w-full animate-fade-in pb-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/servicos" element={<ServicesPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/profissional" element={<ProfessionalPage />} />
              <Route path="/clientes" element={<CustomerPortal />} />
            </Routes>
          </main>
        </div>
        
        <Footer />
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <>
      <Carousel />

      <section id="booking-flow" className="bg-surface border border-border-custom py-16 md:py-24 px-6 mt-12 rounded-3xl shadow-2xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-xl md:text-2xl font-black mb-4">Agende seu horário</h2>
          <p className="text-text-muted text-xs max-w-2xl mx-auto">
            Escolha o serviço, o profissional e o melhor momento para você em poucos cliques.
          </p>
        </div>
        <BookingStepper />
      </section>
      
      <ProfessionalSection />

      <div className="bg-surface border border-border-custom rounded-3xl shadow-2xl">
        <ReviewsSection />
      </div>
      
      <FAQSection />
    </>
  );
}
