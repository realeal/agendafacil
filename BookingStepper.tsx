import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatBRL, toTitleCase } from '@/src/lib/utils';
import { Check, Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Service, Professional, AppointmentStatus, WorkingHours } from '@/src/types';
import { api } from '@/src/services/api';

const STEPS = [
  { id: 1, label: 'Serviço', icon: '⚙️' },
  { id: 2, label: 'Profissional', icon: '👤' },
  { id: 3, label: 'Quando', icon: '📅' },
  { id: 4, label: 'Confirmar', icon: '✓' },
];

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function BookingStepper({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  
  // Initialize with today's date (Local Time)
  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDateStr());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingHours, setLoadingHours] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [loggedInClientCpf, setLoggedInClientCpf] = useState<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    // Check for logged in client
    const savedClient = localStorage.getItem('customer_portal_client');
    if (savedClient) {
      const client = JSON.parse(savedClient);
      setUserName(client.name);
      setUserPhone(client.phone);
      setUserEmail(client.email);
      setIsClientLoggedIn(true);
      setLoggedInClientCpf(client.cpf);
    }

    async function loadData() {
      // Load services
      api.getServices()
        .then(setServices)
        .catch(err => {
          console.error('Error loading services:', err);
          setError('Erro ao carregar serviços.');
        })
        .finally(() => setLoadingServices(false));

      // Load professionals
      api.getProfessionals()
        .then(setProfessionals)
        .catch(err => {
          console.error('Error loading professionals:', err);
          setError('Erro ao carregar profissionais.');
        })
        .finally(() => setLoadingProfessionals(false));

      // Load working hours
      api.getWorkingHours()
        .then(setWorkingHours)
        .catch(err => {
          console.error('Error loading working hours:', err);
          setError('Erro ao carregar horários de funcionamento.');
        })
        .finally(() => setLoadingHours(false));
    }
    loadData();
  }, []);

  // Fetch booked slots when date/prof changes
  useEffect(() => {
    if (selectedProf && selectedDate) {
      api.getBookedSlots(selectedProf.id, selectedDate)
        .then(setBookedSlots)
        .catch(console.error);
    }
  }, [selectedProf, selectedDate]);

  const generateTimeSlots = (dateStr: string) => {
    const defaultSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    
    if (!workingHours || workingHours.length === 0) {
      console.log('BookingStepper: Usando horários padrão (tabela vazia)');
      return defaultSlots;
    }
    
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find(h => h.day_of_week === dayOfWeek);

    if (!dayHours || !dayHours.is_active) {
      console.log(`BookingStepper: Sem horários configurados para o dia da semana ${dayOfWeek}`);
      return [];
    }

    try {
      const slots: string[] = [];
      // Use a fixed date to calculate times
      const baseDate = "2000-01-01T";
      const start = new Date(`${baseDate}${dayHours.start_time}${dayHours.start_time.includes(':') ? '' : ':00'}`);
      const end = new Date(`${baseDate}${dayHours.end_time}${dayHours.end_time.includes(':') ? '' : ':00'}`);
      
      const interval = selectedService?.duration || 60;
      
      let current = new Date(start);
      while (current <= end) {
        slots.push(current.toTimeString().substring(0, 5));
        current.setMinutes(current.getMinutes() + interval);
      }

      return slots.length > 0 ? slots : defaultSlots;
    } catch (err) {
      console.error('Error generating slots from DB data:', err);
      return defaultSlots;
    }
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return !!selectedProf;
    if (step === 3) return !!selectedDate && !!selectedTime;
    return true;
  };

  const handleNext = () => {
    if (canGoNext()) setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const isLoadingCurrentStep = () => {
    if (step === 1) return loadingServices;
    if (step === 2) return loadingProfessionals;
    if (step === 3) return loadingHours;
    return false;
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedProf || !selectedDate || !selectedTime || !userName || !userPhone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log('BookingStepper: Iniciando confirmação de agendamento...');
      const appointmentData = {
        name: toTitleCase(userName),
        phone: userPhone,
        email: userEmail,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        status: 'pending' as AppointmentStatus,
        profName: selectedProf.name,
        profId: selectedProf.id,
        paid: false,
        discount: 0,
        finalPrice: selectedService.price,
        client_id: loggedInClientCpf || userPhone
      };
      
      console.log('BookingStepper: Dados do agendamento:', appointmentData);
      
      await api.createAppointment(appointmentData);

      console.log('BookingStepper: Agendamento criado com sucesso!');
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('BookingStepper: Erro ao criar agendamento:', err);
      setError(`Erro ao confirmar agendamento: ${err.message || 'Verifique sua conexão.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-6"
      >
        <div className="w-20 h-20 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="text-accent w-10 h-10" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black mb-4">Agendamento confirmado!</h2>
        <p className="text-text-muted mb-8 max-w-md mx-auto">
          Você receberá uma confirmação via WhatsApp em breve. Até lá! 🎉
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-surface border border-border-custom px-8 py-3 rounded-xl font-bold hover:bg-surface-hover transition-all"
        >
          Fazer outro agendamento
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-background border-1.5 border-border-custom rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden">
      {/* Stepper Header */}
      <div className="relative flex justify-between mb-12 px-2">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-border-custom -z-0" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500 -z-0" 
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        
        {STEPS.map((s) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              disabled={s.id >= step}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                step === s.id ? "bg-accent border-accent text-background scale-110 shadow-[0_0_0_6px_var(--color-accent-t15)]" :
                step > s.id ? "bg-accent/15 border-accent text-accent" :
                "bg-surface-hover border-border-custom text-text-muted"
              )}
            >
              {step > s.id ? <Check size={18} strokeWidth={3} /> : <span>{s.id}</span>}
            </button>
            <span className={cn(
              "text-[0.65rem] md:text-[0.75rem] font-bold uppercase tracking-wider transition-colors",
              step === s.id ? "text-accent" : "text-text-muted"
            )}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {isLoadingCurrentStep() ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <p className="text-text-muted">Carregando dados necessários...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-black">O que você precisa?</h3>
                  <p className="text-text-muted">Escolha o serviço desejado</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s); handleNext(); }}
                      className={cn(
                        "relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all group",
                        selectedService?.id === s.id 
                          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" 
                          : "border-border-custom bg-surface hover:border-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-2xl group-hover:bg-accent/20 transition-colors">
                          {s.image ? <img src={s.image} className="w-full h-full object-cover rounded-lg" /> : s.icon}
                        </div>
                        {selectedService?.id === s.id && (
                          <div className="w-6 h-6 rounded-full bg-accent text-background flex items-center justify-center">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-lg mb-1">{s.name}</h4>
                      <div className="flex gap-3 text-xs text-text-muted mb-4">
                        <span className="flex items-center gap-1"><Clock size={12} /> {s.duration} min</span>
                        {s.category && <span className="flex items-center gap-1">📂 {s.category}</span>}
                      </div>
                      <div className="mt-auto text-xl font-black text-accent">
                        {formatBRL(s.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-black">Com quem?</h3>
                  <p className="text-text-muted">Escolha seu profissional de preferência</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProf(p); handleNext(); }}
                      className={cn(
                        "relative flex flex-col items-center p-6 rounded-2xl border-2 text-center transition-all group",
                        selectedProf?.id === p.id 
                          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" 
                          : "border-border-custom bg-surface hover:border-accent/50"
                      )}
                    >
                      <div className={cn(
                        "w-24 h-24 rounded-full border-3 flex items-center justify-center text-3xl font-black mb-4 transition-all overflow-hidden",
                        selectedProf?.id === p.id ? "border-accent bg-accent/20 text-accent" : "border-border-custom bg-surface-hover text-text-muted"
                      )}>
                        {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : p.initials}
                      </div>
                      <h4 className="font-bold text-lg mb-1">{p.name}</h4>
                      <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">{p.role}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {p.specialties?.slice(0, 2).map((spec, i) => (
                          <span key={i} className="text-[0.65rem] bg-surface-hover px-2 py-1 rounded-md text-text-muted border border-border-custom">
                            {spec}
                          </span>
                        ))}
                      </div>
                      {selectedProf?.id === p.id && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent text-background flex items-center justify-center">
                          <Check size={14} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <button onClick={handleBack} className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-bold">
                    <ChevronLeft size={20} /> Voltar
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-black">Quando?</h3>
                  <p className="text-text-muted">Selecione data e horário disponível</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Dynamic Calendar */}
                  <div className="bg-surface border border-border-custom rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold capitalize">
                        {new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (currentMonth > new Date().getMonth() || currentYear > new Date().getFullYear()) {
                              if (currentMonth === 0) {
                                setCurrentMonth(11);
                                setCurrentYear(currentYear - 1);
                              } else {
                                setCurrentMonth(currentMonth - 1);
                              }
                            }
                          }}
                          disabled={currentMonth <= new Date().getMonth() && currentYear <= new Date().getFullYear()}
                          className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-20 transition-all"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          onClick={() => {
                            if (currentMonth === 11) {
                              setCurrentMonth(0);
                              setCurrentYear(currentYear + 1);
                            } else {
                              setCurrentMonth(currentMonth + 1);
                            }
                          }}
                          disabled={currentMonth === 11 && currentYear === new Date().getFullYear()}
                          className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-20 transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-[0.65rem] font-bold text-text-muted uppercase mb-4">
                      {['D','S','T','Q','Q','S','S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const days = [];
                        // Empty slots for days before the first of the month
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} />);
                        }
                        
                        // Days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const isSelected = selectedDate === dateStr;
                          const dateObj = new Date(currentYear, currentMonth, day);
                          const isPast = dateObj < today;
                          
                          days.push(
                            <button
                              key={day}
                              disabled={isPast}
                              onClick={() => setSelectedDate(dateStr)}
                              className={cn(
                                "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all border-2 border-transparent",
                                isSelected ? "bg-accent text-background font-bold" : 
                                isPast ? "opacity-20 cursor-not-allowed" : "hover:bg-surface-hover text-text-main"
                              )}
                            >
                              {day}
                            </button>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="bg-surface border border-border-custom rounded-2xl p-6">
                    <h4 className="font-bold text-text-muted uppercase text-[0.7rem] tracking-widest mb-6 border-b border-border-custom pb-4">
                      Horários disponíveis
                    </h4>
                    {!selectedDate ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-40">
                        <CalendarIcon size={32} className="mb-2" />
                        <p className="text-sm">Selecione uma data ao lado</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {generateTimeSlots(selectedDate).map((t) => {
                          const isBooked = bookedSlots.includes(t);
                          
                          // Check if time has passed for today
                          const isToday = selectedDate === getLocalDateStr();
                          const now = new Date();
                          const [slotHour, slotMinute] = t.split(':').map(Number);
                          const isPastTime = isToday && (slotHour < now.getHours() || (slotHour === now.getHours() && slotMinute <= now.getMinutes()));
                          
                          const isDisabled = isBooked || isPastTime;

                          return (
                            <button
                              key={t}
                              disabled={isDisabled}
                              onClick={() => { setSelectedTime(t); handleNext(); }}
                              className={cn(
                                "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                                selectedTime === t 
                                  ? "bg-accent border-accent text-background shadow-lg shadow-accent/20" 
                                  : isDisabled 
                                    ? "bg-surface-hover border-border-custom opacity-30 cursor-not-allowed line-through"
                                    : "bg-surface-hover border-border-custom hover:border-accent text-text-main"
                              )}
                            >
                              {t}
                            </button>
                          );
                        })}
                        {generateTimeSlots(selectedDate).length === 0 && (
                          <div className="col-span-3 py-10 text-center text-text-muted text-sm font-bold">
                            Nenhum horário disponível para este dia.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={handleBack} className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-bold">
                    <ChevronLeft size={20} /> Voltar
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!selectedDate || !selectedTime}
                    className="bg-accent text-background px-8 py-3 rounded-xl font-bold disabled:opacity-30 transition-all"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-base md:text-lg font-black">Quase lá!</h3>
                  <p className="text-text-muted text-xs">Revise e confirme seu agendamento</p>
                </div>

                <div className="bg-surface border border-border-custom rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                    <div className="text-2xl mb-2">{selectedService?.icon}</div>
                    <h4 className="text-lg font-black">{selectedService?.name}</h4>
                    <div className="text-xl font-black text-accent">{formatBRL(selectedService?.price || 0)}</div>
                    <div className="text-xs text-text-muted flex items-center gap-2">
                      <Clock size={16} /> {selectedService?.duration} min
                    </div>
                  </div>
                  
                  <div className="flex-[1.5] w-full space-y-4 border-t md:border-t-0 md:border-l border-border-custom pt-6 md:pt-0 md:pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-accent"><User size={20} /></div>
                      <div>
                        <div className="text-[0.65rem] text-text-muted uppercase font-bold tracking-widest">Profissional</div>
                        <div className="font-bold">{selectedProf?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-accent"><CalendarIcon size={20} /></div>
                      <div>
                        <div className="text-[0.65rem] text-text-muted uppercase font-bold tracking-widest">Data</div>
                        <div className="font-bold">{selectedDate?.split('-').reverse().join('/')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-accent"><Clock size={20} /></div>
                      <div>
                        <div className="text-[0.65rem] text-text-muted uppercase font-bold tracking-widest">Horário</div>
                        <div className="font-bold">{selectedTime}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-bold uppercase text-text-muted ml-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="Seu nome" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-bold uppercase text-text-muted ml-1">WhatsApp *</label>
                    <input 
                      type="tel" 
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="(00) 00000-0000" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[0.7rem] font-bold uppercase text-text-muted ml-1">E-mail</label>
                    <input 
                      type="email" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="seu@email.com" 
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-4 rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-12">
                  <button onClick={handleBack} className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-bold order-2 md:order-1">
                    <ChevronLeft size={20} /> Voltar
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full md:w-auto bg-accent text-background px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-100 transition-all order-1 md:order-2 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Confirmando...
                      </>
                    ) : (
                      <>✦ Confirmar Agendamento</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}
