import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { Menu, X, ChevronDown, UserCircle, ShieldCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mainTabs = [
    { name: 'Agendar', path: '/' },
    { name: 'Serviços', path: '/servicos' },
  ];

  const accessTabs = [
    { name: 'Portal do Cliente', path: '/clientes', icon: Users },
    { name: 'Área do Profissional', path: '/profissional', icon: UserCircle },
    { name: 'Acesso Administrativo', path: '/admin', icon: ShieldCheck },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when location changes
  useEffect(() => {
    setDropdownOpen(false);
    setIsOpen(false);
  }, [location]);

  const isAccessActive = accessTabs.some(tab => location.pathname === tab.path);

  return (
    <div className="sticky top-4 z-[100] px-4 md:px-8 lg:px-12">
      <nav className="max-w-[1400px] mx-auto border border-white/10 bg-background/60 backdrop-blur-xl px-6 py-4 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
          <div className="text-lg md:text-xl font-black tracking-tighter">
            <span className="text-text-main">agenda</span>
            <span className="text-accent">fácil</span>
          </div>
        </Link>

        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-surface p-1 rounded-xl border border-border-custom">
          {mainTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                location.pathname === tab.path
                  ? "bg-accent text-background"
                  : "text-text-muted hover:text-text-main hover:bg-surface-hover"
              )}
            >
              {tab.name}
            </Link>
          ))}

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all outline-none",
                isAccessActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-main hover:bg-surface-hover",
                dropdownOpen && "bg-surface-hover text-text-main"
              )}
            >
              Áreas de Acesso
              <ChevronDown size={16} className={cn("transition-transform duration-300", dropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-surface border border-border-custom rounded-2xl shadow-2xl p-2 overflow-hidden"
                >
                  {accessTabs.map((tab) => (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        location.pathname === tab.path
                          ? "bg-accent text-background"
                          : "text-text-muted hover:text-text-main hover:bg-surface-hover"
                      )}
                    >
                      <tab.icon size={18} />
                      {tab.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-text-main"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-border-custom overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-2">
              <div className="text-[0.65rem] font-black uppercase tracking-widest text-text-muted px-4 mb-1">Navegação</div>
              {mainTabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-4 py-3 rounded-xl text-base font-bold",
                    location.pathname === tab.path
                      ? "bg-accent text-background"
                      : "text-text-muted"
                  )}
                >
                  {tab.name}
                </Link>
              ))}
              
              <div className="h-px bg-border-custom my-2 mx-4" />
              <div className="text-[0.65rem] font-black uppercase tracking-widest text-text-muted px-4 mb-1">Áreas de Acesso</div>
              {accessTabs.map((tab) => (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold",
                    location.pathname === tab.path
                      ? "bg-accent text-background"
                      : "text-text-muted"
                  )}
                >
                  <tab.icon size={20} />
                  {tab.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </div>
  );
}
