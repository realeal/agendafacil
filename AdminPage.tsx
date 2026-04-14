import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Appointment, Service, AppointmentStatus, CarouselSlide, FAQItem, WorkingHours, Professional, Client } from '@/src/types';
import { formatBRL, cn, toTitleCase, maskCPF, maskPhone, maskDate } from '@/src/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Users, 
  Clock, 
  HelpCircle, 
  Palette, 
  Lock, 
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock3,
  Trash2,
  Loader2,
  Plus,
  Image as ImageIcon,
  Save,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Edit2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PROFESSIONS = [
  "Administrador", "Advogado", "Arquiteto", "Autônomo", "Auxiliar Administrativo",
  "Bancário", "Comerciante", "Contador", "Cozinheiro", "Dentista",
  "Enfermeiro", "Engenheiro", "Esteticista", "Estudante", "Fisioterapeuta",
  "Médico", "Motorista", "Professor", "Psicólogo", "Vendedor"
];

type AdminTab = 'dashboard' | 'agendamentos' | 'servicos' | 'clientes' | 'relatorios' | 'horarios' | 'faq' | 'vitrine' | 'seguranca';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'login' | 'recovery'>('login');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin Recovery State
  const [adminSecurityQuestion, setAdminSecurityQuestion] = useState('');
  const [adminSecurityAnswer, setAdminSecurityAnswer] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const hasSupabaseKeys = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Carousel Slide Form State
  const [editingSlide, setEditingSlide] = useState<Partial<CarouselSlide> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingProf, setEditingProf] = useState<Partial<Professional> | null>(null);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [footerSettings, setFooterSettings] = useState<any>({
    instagram: '',
    facebook: '',
    whatsapp: '',
    address: '',
    phone: '',
    email: ''
  });
  const [accentColor, setAccentColor] = useState('#c8f565');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedClientPhone, setSelectedClientPhone] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('142536');
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsLoggedIn(true);
      setLoginError(false);
      localStorage.setItem('admin_session', 'active');
      
      // Add access log
      const newLog = {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        event: 'Login realizado com sucesso',
        type: 'success'
      };
      const updatedLogs = [newLog, ...accessLogs].slice(0, 20);
      setAccessLogs(updatedLogs);
      api.updateSettings('admin_access_logs', updatedLogs).catch(console.error);
    } else {
      setLoginError(true);
      setPassword('');
      
      // Add failed log
      const newLog = {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        event: 'Tentativa de login falhou',
        type: 'error'
      };
      const updatedLogs = [newLog, ...accessLogs].slice(0, 20);
      setAccessLogs(updatedLogs);
      api.updateSettings('admin_access_logs', updatedLogs).catch(console.error);
    }
  };

  const handleVerifyAdminRecovery = () => {
    setRecoveryError('');
    if (!adminSecurityQuestion) {
      setRecoveryError('Nenhuma pergunta de segurança configurada. Entre em contato com o suporte.');
      return;
    }
    if (recoveryAnswer.toLowerCase().trim() === adminSecurityAnswer.toLowerCase().trim()) {
      setRecoveryStep(2);
    } else {
      setRecoveryError('Resposta incorreta.');
    }
  };

  const handleResetAdminPassword = async () => {
    if (newAdminPassword !== confirmAdminPassword) {
      setRecoveryError('As senhas não coincidem.');
      return;
    }
    if (newAdminPassword.length < 4) {
      setRecoveryError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    try {
      setLoading(true);
      await api.updateSettings('admin_password', newAdminPassword);
      setAdminPassword(newAdminPassword);
      setSuccessMessage('Senha do administrador redefinida com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
      setView('login');
      setRecoveryStep(1);
      setRecoveryAnswer('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err) {
      setRecoveryError('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session === 'active') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    try {
      setLoading(true);
      await api.updateSettings('admin_password', newPassword);
      setAdminPassword(newPassword);
      setIsChangingPassword(false);
      setNewPassword('');
      setSuccessMessage('Senha alterada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('admin_session');
  };

  async function loadData() {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled([
        api.getAllAppointments(),
        api.getServices(),
        api.getProfessionals(),
        api.getCarouselSlides(),
        api.getFAQs(),
        api.getWorkingHours(),
        api.getAllClients(),
        api.getSettings('footer'),
        api.getSettings('accent_color'),
        api.getSettings('theme'),
        api.getSettings('admin_password'),
        api.getSettings('admin_access_logs')
      ]);

      const [
        aptsRes, 
        svcsRes, 
        profsRes, 
        slidesRes, 
        faqRes, 
        hoursRes, 
        clientsRes,
        footerRes, 
        colorRes, 
        themeRes,
        passwordRes,
        logsRes
      ] = results;

      if (aptsRes.status === 'fulfilled') setAppointments(aptsRes.value);
      if (svcsRes.status === 'fulfilled') setServices(svcsRes.value);
      if (profsRes.status === 'fulfilled') setProfessionals(profsRes.value);
      if (slidesRes.status === 'fulfilled') setCarouselSlides(slidesRes.value);
      if (faqRes.status === 'fulfilled') setFaqs(faqRes.value);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value);
      if (passwordRes.status === 'fulfilled' && passwordRes.value) setAdminPassword(passwordRes.value);
      if (logsRes.status === 'fulfilled' && logsRes.value) setAccessLogs(logsRes.value);
      
      // Load admin security settings
      api.getSettings('admin_security_question').then(q => q && setAdminSecurityQuestion(q));
      api.getSettings('admin_security_answer').then(a => a && setAdminSecurityAnswer(a));
      
      if (footerRes.status === 'fulfilled' && footerRes.value) {
        setFooterSettings(footerRes.value);
      }

      if (colorRes.status === 'fulfilled' && colorRes.value) {
        setAccentColor(colorRes.value);
        document.documentElement.style.setProperty('--accent-color', colorRes.value);
      }

      if (themeRes.status === 'fulfilled' && themeRes.value) {
        setTheme(themeRes.value);
        if (themeRes.value === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }
      
      if (hoursRes.status === 'fulfilled') {
        if (hoursRes.value.length === 0) {
          const defaultHours: WorkingHours[] = [
            { day_of_week: 1, start_time: '08:00', end_time: '18:00', is_active: true },
            { day_of_week: 2, start_time: '08:00', end_time: '18:00', is_active: true },
            { day_of_week: 3, start_time: '08:00', end_time: '18:00', is_active: true },
            { day_of_week: 4, start_time: '08:00', end_time: '18:00', is_active: true },
            { day_of_week: 5, start_time: '08:00', end_time: '18:00', is_active: true },
            { day_of_week: 6, start_time: '08:00', end_time: '12:00', is_active: true },
            { day_of_week: 0, start_time: '08:00', end_time: '12:00', is_active: false },
          ];
          setWorkingHours(defaultHours);
        } else {
          setWorkingHours(hoursRes.value);
        }
      }

      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some data failed to load:', failures);
        // We don't alert here to avoid annoying the user if only one non-critical thing failed
      }

    } catch (err: any) {
      console.error('Error loading admin data:', err);
      alert('Erro crítico ao carregar dados: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: number, status: AppointmentStatus) => {
    try {
      console.log(`Updating appointment ${id} status to ${status}...`);
      await api.updateAppointmentStatus(id, status);
      console.log('Status updated successfully!');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status do agendamento.');
    }
  };

  const handleDeleteApt = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      await api.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  // Carousel Handlers
  const handleSaveSlide = async () => {
    if (!editingSlide?.image) {
      alert('Por favor, preencha a URL da imagem.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...editingSlide,
        order: editingSlide.order ?? (carouselSlides.length + 1),
        titleColor: editingSlide.titleColor || '#ffffff',
        titleAlign: editingSlide.titleAlign || 'center',
        titleFont: editingSlide.titleFont || 'sans'
      };
      
      console.log('Saving slide payload:', payload);
      await api.upsertCarouselSlide(payload);
      
      console.log('Slide saved successfully, refreshing...');
      const updatedSlides = await api.getCarouselSlides();
      setCarouselSlides(updatedSlides);
      setEditingSlide(null);
      
      setSuccessMessage('Banner salvo com sucesso! A vitrine será atualizada.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error saving slide:', err);
      const errorMsg = err.message || err.details || 'Erro desconhecido';
      
      if (err.code === 'PGRST205') {
        alert('ERRO: A tabela "carousel_slides" não existe no seu Supabase. Por favor, execute o script SQL para criá-la.');
      } else if (err.code === '42703') {
        alert('ERRO: Algumas colunas estão faltando na tabela "carousel_slides". Verifique se as colunas title_color, title_align, title_font, etc. existem.');
      } else {
        alert('Erro ao salvar o banner: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm('Excluir este banner?')) return;
    try {
      await api.deleteCarouselSlide(id);
      setCarouselSlides(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting slide:', err);
    }
  };

  // Professional Handlers
  const handleSaveProf = async () => {
    if (!editingProf?.name || !editingProf?.role) {
      alert('Nome e cargo são obrigatórios.');
      return;
    }

    if (!editingProf?.cpf || !editingProf?.dob) {
      alert('CPF e Data de Nascimento são obrigatórios para permitir a recuperação de senha.');
      return;
    }

    try {
      setLoading(true);
      const cleanCpf = editingProf.cpf.replace(/\D/g, '');
      const formattedProf = { 
        ...editingProf, 
        name: toTitleCase(editingProf.name || ''),
        cpf: cleanCpf
      };
      await api.upsertProfessional(formattedProf);
      const updated = await api.getProfessionals();
      setProfessionals(updated);
      setEditingProf(null);
      setSuccessMessage('Profissional salvo com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error saving professional:', err);
      alert('Erro ao salvar profissional.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProf = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
    try {
      setLoading(true);
      await api.deleteProfessional(id);
      const updated = await api.getProfessionals();
      setProfessionals(updated);
    } catch (err) {
      console.error('Error deleting professional:', err);
      alert('Erro ao excluir profissional.');
    } finally {
      setLoading(false);
    }
  };

  // Client Handlers
  const handleSaveClient = async () => {
    if (!editingClient?.cpf || !editingClient?.name) {
      alert('CPF e Nome são obrigatórios.');
      return;
    }
    try {
      setLoading(true);
      console.log('Admin: Iniciando salvamento de cliente:', editingClient);
      
      // Clean CPF (remove dots and dashes)
      const cleanCpf = editingClient.cpf.replace(/\D/g, '');
      
      // Convert date from DD/MM/YYYY to YYYY-MM-DD if needed
      let dob = editingClient.dob;
      if (dob && dob.includes('/')) {
        const [day, month, year] = dob.split('/');
        dob = `${year}-${month}-${day}`;
      }

      console.log('Admin: Payload para upsert:', { ...editingClient, cpf: cleanCpf, dob });

      await api.upsertClient({
        ...editingClient,
        name: toTitleCase(editingClient.name),
        cpf: cleanCpf,
        dob
      });
      
      console.log('Admin: Cliente salvo com sucesso no Supabase');
      
      const updated = await api.getAllClients();
      setClients(updated);
      setEditingClient(null);
      setSuccessMessage('Cliente cadastrado com sucesso! Os dados já estão disponíveis na base.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Admin: Erro ao salvar cliente:', err);
      alert('Erro ao salvar cliente: ' + (err.message || 'Verifique a conexão com o banco de dados.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (cpf: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      setLoading(true);
      await api.deleteClient(cpf);
      const updated = await api.getAllClients();
      setClients(updated);
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Erro ao excluir cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFooter = async () => {
    try {
      setLoading(true);
      await api.updateSettings('footer', footerSettings);
      setSuccessMessage('Configurações do rodapé salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error saving footer settings:', err);
      alert('Erro ao salvar configurações do rodapé.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColor = async (color: string) => {
    try {
      setAccentColor(color);
      document.documentElement.style.setProperty('--accent-color', color);
      await api.updateSettings('accent_color', color);
    } catch (err: any) {
      console.error('Erro ao salvar cor:', err);
    }
  };

  const handleSaveTheme = async (newTheme: 'dark' | 'light') => {
    try {
      setTheme(newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      await api.updateSettings('theme', newTheme);
    } catch (err: any) {
      console.error('Erro ao salvar tema:', err);
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async () => {
    if (!editingFaq?.q || !editingFaq?.a) {
      alert('Por favor, preencha a pergunta e a resposta.');
      return;
    }
    try {
      setLoading(true);
      console.log('Saving FAQ payload:', editingFaq);
      await api.upsertFAQ(editingFaq);
      console.log('FAQ saved successfully, refreshing...');
      const updatedFaqs = await api.getFAQs();
      setFaqs(updatedFaqs);
      setEditingFaq(null);
      setSuccessMessage('FAQ salvo com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error saving FAQ:', err);
      if (err.code === 'PGRST205') {
        alert('ERRO: A tabela "faqs" não existe no seu Supabase. Crie a tabela "faqs" com colunas "id" (bigint), "q" (text) e "a" (text).');
      } else {
        alert('Erro ao salvar FAQ: ' + (err.message || 'Erro desconhecido'));
        console.error('Full error object:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Excluir esta pergunta?')) return;
    try {
      await api.deleteFAQ(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  const handleSaveService = async () => {
    if (!editingService?.name || !editingService?.price || !editingService?.duration) {
      alert('Por favor, preencha o nome, preço e duração do serviço.');
      return;
    }
    try {
      setLoading(true);
      console.log('Saving service payload:', editingService);
      await api.upsertService(editingService as Service);
      console.log('Service saved successfully, refreshing...');
      const updatedServices = await api.getServices();
      setServices(updatedServices);
      setEditingService(null);
      setSuccessMessage('Serviço salvo com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error saving service:', err);
      alert('Erro ao salvar serviço: ' + (err.message || 'Erro desconhecido'));
      console.error('Full error object:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      setLoading(true);
      await api.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      alert('Serviço excluído com sucesso!');
    } catch (err: any) {
      console.error('Error deleting service:', err);
      alert('Erro ao excluir serviço: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      setLoading(true);
      console.log('Saving working hours payload:', workingHours);
      await api.upsertWorkingHours(workingHours);
      console.log('Working hours saved successfully!');
      setSuccessMessage('Horários salvos com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Error saving working hours:', err);
      if (err.code === 'PGRST205') {
        alert('ERRO: A tabela "working_hours" não existe no seu Supabase. Por favor, execute o script SQL fornecido no chat para criá-la.');
      } else {
        alert('Erro ao salvar horários: ' + (err.message || 'Erro desconhecido'));
        console.error('Full error object:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-20 px-6">
        <div className="bg-surface border border-border-custom rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4">
              {view === 'login' ? <Lock size={32} /> : <HelpCircle size={32} />}
            </div>
            <h2 className="text-2xl font-black">{view === 'login' ? 'Acesso Restrito' : 'Recuperar Acesso'}</h2>
            <p className="text-text-muted text-sm text-center mt-2">
              {view === 'login' 
                ? 'Digite a senha de administrador para continuar.' 
                : 'Responda sua pergunta de segurança para redefinir a senha.'}
            </p>
          </div>

          {view === 'login' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase text-text-muted tracking-widest">Senha</label>
                  <button 
                    onClick={() => {
                      setView('recovery');
                      setRecoveryStep(1);
                      setRecoveryError('');
                    }}
                    className="text-[10px] font-bold text-accent hover:underline uppercase tracking-tighter"
                  >
                    Esqueci a senha
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all pr-12" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-danger text-xs font-medium text-center">Senha incorreta. A senha padrão é 142536.</p>
              )}

              <button 
                onClick={handleLogin}
                className="w-full bg-accent text-background py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all"
              >
                Entrar no Painel
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {recoveryStep === 1 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                    <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Sua Pergunta</div>
                    <div className="font-bold text-sm">{adminSecurityQuestion || 'Nenhuma pergunta configurada.'}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-muted ml-1 tracking-widest">Sua Resposta</label>
                    <input 
                      type="text" 
                      value={recoveryAnswer}
                      onChange={(e) => setRecoveryAnswer(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="Digite sua resposta" 
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-danger text-xs font-medium text-center">{recoveryError}</p>
                  )}

                  <button 
                    onClick={handleVerifyAdminRecovery}
                    className="w-full bg-accent text-background py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all"
                  >
                    Verificar Resposta
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-muted ml-1 tracking-widest">Nova Senha</label>
                    <input 
                      type="password" 
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="••••••••" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-muted ml-1 tracking-widest">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      className="w-full bg-surface-hover border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                      placeholder="••••••••" 
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-danger text-xs font-medium text-center">{recoveryError}</p>
                  )}

                  <button 
                    onClick={handleResetAdminPassword}
                    disabled={loading}
                    className="w-full bg-accent text-background py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Redefinir Senha'}
                  </button>
                </div>
              )}

              <button 
                onClick={() => setView('login')}
                className="w-full flex items-center justify-center gap-2 text-text-muted font-bold hover:text-accent transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredApts = appointments.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.phone.includes(searchTerm) ||
                         a.profName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApts.length / itemsPerPage);
  const paginatedApts = filteredApts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    today: appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    total: appointments.length,
    revenue: appointments.reduce((acc, a) => a.status !== 'cancelled' ? acc + a.finalPrice : acc, 0)
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row -mx-4 md:-mx-8 lg:-mx-12 pt-10">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-surface border-r border-border-custom p-8 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-black text-xl overflow-hidden">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight">Painel Admin</h2>
            <p className="text-accent text-xs font-bold uppercase tracking-wider">Gestão Total</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
            { id: 'servicos', label: 'Serviços', icon: Settings },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
            { id: 'horarios', label: 'Horários', icon: Clock },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'vitrine', label: 'Vitrine', icon: Palette },
            { id: 'seguranca', label: 'Segurança', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 rounded-2xl font-bold transition-all text-sm",
                activeTab === tab.id 
                  ? "bg-accent text-background shadow-lg shadow-accent/20" 
                  : "text-text-muted hover:bg-surface-hover hover:text-text-main"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-border-custom">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-danger hover:bg-danger/10 transition-all w-full"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
            >
              <motion.div 
                className="bg-surface border-4 border-accent rounded-[3rem] p-10 shadow-2xl max-w-sm w-full text-center space-y-6"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
              >
                <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2">Sucesso!</h3>
                  <p className="text-text-muted font-bold leading-relaxed">
                    {successMessage}
                  </p>
                </div>
                <div className="h-1.5 w-full bg-border-custom rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-accent"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>
                <button 
                  onClick={() => setSuccessMessage('')}
                  className="w-full py-3 bg-surface-hover hover:bg-border-custom rounded-xl font-black transition-colors"
                >
                  Entendido
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasSupabaseKeys && (
          <div className="mb-8 bg-danger/10 border border-danger/20 rounded-3xl p-6 flex items-center gap-4 text-danger">
            <div className="w-12 h-12 bg-danger/20 rounded-2xl flex items-center justify-center shrink-0">
              <HelpCircle size={24} />
            </div>
            <div>
              <div className="text-lg font-black mb-1">Configuração Incompleta</div>
              <div className="text-sm opacity-80">
                As chaves do Supabase não foram encontradas no ambiente. 
                Para corrigir, vá em <span className="font-bold">Settings {'>'} Secrets</span> no menu do AI Studio e adicione:
                <code className="mx-2 bg-danger/20 px-2 py-0.5 rounded">VITE_SUPABASE_URL</code> e 
                <code className="mx-2 bg-danger/20 px-2 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black mb-1 tracking-tighter">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-text-muted">Gerencie as informações do seu negócio</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <p className="text-text-muted mb-6">Carregando dados do painel...</p>
            <button 
              onClick={() => loadData()}
              className="px-6 py-2 bg-surface border border-border-custom rounded-xl text-sm font-bold hover:bg-surface-hover transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <div className="max-w-6xl space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Hoje', value: stats.today, sub: 'agendamentos', color: 'text-accent' },
                      { label: 'Pendentes', value: stats.pending, sub: 'aguardando', color: 'text-orange-400' },
                      { label: 'Total', value: stats.total, sub: 'cadastrados', color: 'text-accent-secondary' },
                      { label: 'Receita Total', value: formatBRL(stats.revenue), sub: 'estimada', color: 'text-accent' },
                    ].map((kpi, i) => (
                      <div key={i} className="bg-surface border border-border-custom rounded-2xl p-6 hover:border-accent/30 transition-all">
                        <div className="text-[0.7rem] font-bold uppercase text-text-muted tracking-widest mb-2">{kpi.label}</div>
                        <div className={cn("text-3xl font-black mb-1", kpi.color)}>{kpi.value}</div>
                        <div className="text-xs text-text-muted">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Calendar size={18} /> Próximos Agendamentos
                    </h3>
                    <div className="space-y-3">
                      {appointments.slice(0, 5).map((apt) => (
                        <div key={apt.id} className="bg-surface border border-border-custom rounded-xl p-4 flex items-center gap-4 hover:border-accent/50 transition-all">
                          <div className="w-12 h-12 rounded-lg bg-background flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-text-muted uppercase leading-none">{apt.date.split('-')[1]}</span>
                            <span className="text-lg font-black text-accent leading-none">{apt.date.split('-')[2]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold truncate">{toTitleCase(apt.name)}</div>
                            <div className="text-xs text-text-muted">{apt.time} • {apt.profName}</div>
                          </div>
                          <div className={cn(
                            "text-[0.6rem] font-black uppercase px-2 py-1 rounded-full",
                            apt.status === 'confirmed' ? "bg-accent/10 text-accent" :
                            apt.status === 'pending' ? "bg-orange-400/10 text-orange-400" :
                            apt.status === 'done' ? "bg-accent-secondary/10 text-accent-secondary" :
                            "bg-danger/10 text-danger"
                          )}>
                            {apt.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Users size={18} /> Por Profissional
                    </h3>
                    <div className="bg-surface border border-border-custom rounded-2xl p-6 space-y-6">
                      {Array.from(new Set(appointments.map(a => a.profName))).map(prof => {
                        const count = appointments.filter(a => a.profName === prof).length;
                        const pct = appointments.length > 0 ? (count / appointments.length) * 100 : 0;
                        return (
                          <div key={prof} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                              <span className="truncate pr-2">{prof}</span>
                              <span className="text-accent">{count}</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agendamentos' && (
              <div className="max-w-6xl space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, celular ou profissional..."
                      className="w-full bg-surface border border-border-custom rounded-xl pl-12 pr-4 py-3 focus:border-accent outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-surface border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Todos os status</option>
                      <option value="pending">Pendentes</option>
                      <option value="confirmed">Confirmados</option>
                      <option value="done">Concluídos</option>
                      <option value="cancelled">Cancelados</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {paginatedApts.map((apt) => (
                    <div key={apt.id} className="bg-surface border border-border-custom rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 hover:border-accent/40 transition-all">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-background flex flex-col items-center justify-center shrink-0 border border-border-custom">
                          <span className="text-[0.6rem] font-bold text-text-muted uppercase leading-none mb-1">
                            {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-xl font-black text-accent leading-none">{apt.date.split('-')[2]}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-lg truncate">{toTitleCase(apt.name)}</div>
                          <div className="text-sm text-text-muted flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1"><Clock size={14} /> {apt.time}</span>
                            <span className="flex items-center gap-1"><Users size={14} /> {apt.profName}</span>
                            <span className="flex items-center gap-1">📱 {apt.phone}</span>
                            {apt.client_id && <span className="flex items-center gap-1">🆔 {apt.client_id}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0">
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase border-2",
                          apt.status === 'confirmed' ? "bg-accent/5 border-accent/20 text-accent" :
                          apt.status === 'pending' ? "bg-orange-400/5 border-orange-400/20 text-orange-400" :
                          apt.status === 'done' ? "bg-accent-secondary/5 border-accent-secondary/20 text-accent-secondary" :
                          "bg-danger/5 border-danger/20 text-danger"
                        )}>
                          {apt.status === 'confirmed' && <CheckCircle2 size={14} />}
                          {apt.status === 'pending' && <Clock3 size={14} />}
                          {apt.status === 'cancelled' && <XCircle size={14} />}
                          {apt.status}
                        </div>

                        <div className="flex gap-2">
                          {apt.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                              className="p-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-background transition-all"
                              title="Confirmar"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          )}
                          {apt.status !== 'done' && apt.status !== 'cancelled' && (
                            <button 
                              onClick={() => handleUpdateStatus(apt.id, 'done')}
                              className="p-2.5 rounded-xl bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary hover:text-background transition-all"
                              title="Concluir"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteApt(apt.id)}
                            className="p-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-background transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredApts.length === 0 && (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border-custom">
                      <Search size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                      <p className="text-text-muted font-bold">Nenhum agendamento encontrado.</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-surface border border-border-custom p-4 rounded-2xl">
                    <div className="text-sm text-text-muted font-bold">
                      Mostrando <span className="text-text-main">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-text-main">{Math.min(currentPage * itemsPerPage, filteredApts.length)}</span> de <span className="text-text-main">{filteredApts.length}</span> agendamentos
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl bg-surface-hover border border-border-custom text-text-muted hover:text-accent disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          // Show first, last, and pages around current
                          if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  "w-10 h-10 rounded-xl font-black text-sm transition-all",
                                  currentPage === page 
                                    ? "bg-accent text-background shadow-lg shadow-accent/20" 
                                    : "bg-surface-hover text-text-muted hover:text-text-main"
                                )}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                          ) {
                            return <span key={page} className="text-text-muted px-1">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl bg-surface-hover border border-border-custom text-text-muted hover:text-accent disabled:opacity-30 transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vitrine' && (
              <div className="max-w-5xl space-y-12">
                {/* Global Appearance Settings */}
                <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-black flex items-center gap-2 mb-2">
                        <Palette size={24} className="text-accent" /> Aparência Global
                      </h3>
                      <p className="text-text-muted text-sm">Defina a identidade visual principal do seu site.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 bg-background p-4 rounded-3xl border border-border-custom">
                      {/* Color Picker */}
                      <div className="space-y-1">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-text-muted ml-1">Cor de Destaque</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={accentColor}
                            onChange={(e) => handleSaveColor(e.target.value)}
                            className="w-10 h-10 bg-transparent border-none outline-none cursor-pointer rounded-lg overflow-hidden"
                          />
                          <input 
                            type="text" 
                            value={accentColor}
                            onChange={(e) => handleSaveColor(e.target.value)}
                            className="bg-transparent border-none outline-none font-mono font-bold text-accent w-20 text-sm uppercase"
                          />
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-10 bg-border-custom" />

                      {/* Theme Toggle */}
                      <div className="space-y-1">
                        <label className="text-[0.6rem] font-black uppercase tracking-widest text-text-muted ml-1">Tema do Site</label>
                        <div className="flex bg-surface p-1 rounded-xl border border-border-custom">
                          <button 
                            onClick={() => handleSaveTheme('dark')}
                            className={cn(
                              "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold",
                              theme === 'dark' ? "bg-accent text-background" : "text-text-muted hover:text-text-main"
                            )}
                          >
                            <Moon size={14} /> Escuro
                          </button>
                          <button 
                            onClick={() => handleSaveTheme('light')}
                            className={cn(
                              "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold",
                              theme === 'light' ? "bg-accent text-background" : "text-text-muted hover:text-text-main"
                            )}
                          >
                            <Sun size={14} /> Claro
                          </button>
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-10 bg-border-custom" />
                      
                      <div 
                        className="w-10 h-10 rounded-xl shadow-lg shadow-accent/20"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                  </div>
                </div>

                {/* Carousel Management */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <ImageIcon size={24} className="text-accent" /> Gestão do Carrossel
                    </h3>
                    <button 
                      onClick={() => setEditingSlide({ title: '', subtitle: '', image: '', order: carouselSlides.length + 1 })}
                      className="bg-accent text-background px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Plus size={18} /> Novo Banner
                    </button>
                  </div>

                  {editingSlide && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-surface border-2 border-accent/30 rounded-3xl p-6 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Título (Opcional)</label>
                          <input 
                            type="text" 
                            value={editingSlide.title || ''}
                            onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="Ex: Excelência em Cuidados" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Subtítulo (Opcional)</label>
                          <input 
                            type="text" 
                            value={editingSlide.subtitle || ''}
                            onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="Ex: Os melhores profissionais..." 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">URL da Imagem</label>
                          <input 
                            type="text" 
                            value={editingSlide.image || ''}
                            onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="https://images.unsplash.com/..." 
                          />
                        </div>
                        
                        {/* Formatting Options */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Cor do Título</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={editingSlide.titleColor || '#ffffff'}
                              onChange={(e) => setEditingSlide({ ...editingSlide, titleColor: e.target.value })}
                              className="w-12 h-12 bg-background border border-border-custom rounded-xl p-1 outline-none cursor-pointer" 
                            />
                            <input 
                              type="text" 
                              value={editingSlide.titleColor || '#ffffff'}
                              onChange={(e) => setEditingSlide({ ...editingSlide, titleColor: e.target.value })}
                              className="flex-1 bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all uppercase" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Alinhamento</label>
                            <select 
                              value={editingSlide.titleAlign || 'center'}
                              onChange={(e) => setEditingSlide({ ...editingSlide, titleAlign: e.target.value as any })}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                            >
                              <option value="left">Esquerda</option>
                              <option value="center">Centro</option>
                              <option value="right">Direita</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Fonte</label>
                            <select 
                              value={editingSlide.titleFont || 'sans'}
                              onChange={(e) => setEditingSlide({ ...editingSlide, titleFont: e.target.value })}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                            >
                              <option value="sans">Sans</option>
                              <option value="serif">Serif</option>
                              <option value="mono">Mono</option>
                            </select>
                          </div>
                        </div>

                        {/* Discount Badge Settings */}
                        <div className="bg-background/50 p-6 rounded-2xl border border-border-custom space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-muted">Selo de Desconto</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editingSlide.showDiscountBadge || false}
                                onChange={(e) => setEditingSlide({ ...editingSlide, showDiscountBadge: e.target.checked })}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-surface border border-border-custom peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                              <span className="ml-3 text-xs font-bold text-text-muted">Exibir Selo</span>
                            </label>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Texto do Selo</label>
                            <input 
                              type="text" 
                              disabled={!editingSlide.showDiscountBadge}
                              value={editingSlide.discountBadgeText || ''}
                              onChange={(e) => setEditingSlide({ ...editingSlide, discountBadgeText: e.target.value })}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all disabled:opacity-50" 
                              placeholder="Ex: 20% OFF, Black Friday, etc." 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button 
                          onClick={() => setEditingSlide(null)}
                          className="px-6 py-2 rounded-xl font-bold text-text-muted hover:text-text-main transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveSlide}
                          disabled={loading}
                          className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          Salvar Banner
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {carouselSlides.map((slide) => (
                      <div key={slide.id} className="bg-surface border border-border-custom rounded-3xl overflow-hidden group hover:border-accent/50 transition-all">
                        <div className="h-40 relative">
                          <img src={slide.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                            <button 
                              onClick={() => setEditingSlide(slide)}
                              className="p-3 bg-white text-black rounded-full hover:scale-110 transition-all"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="p-3 bg-danger text-white rounded-full hover:scale-110 transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                          <div className="absolute top-4 left-4 bg-accent text-background px-3 py-1 rounded-full text-xs font-black">
                            #{slide.order}
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="font-black text-lg mb-1">{slide.title}</h4>
                          <p className="text-sm text-text-muted">{slide.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Management */}
                <div className="space-y-8 pt-12 border-t border-border-custom">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <Users size={24} className="text-accent" /> Gestão da Equipe
                    </h3>
                    <button 
                      onClick={() => setEditingProf({ name: '', role: '', photo: '', bio: '', showInVitrine: true })}
                      className="bg-accent text-background px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Plus size={18} /> Novo Profissional
                    </button>
                  </div>

                  {editingProf && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-surface border-2 border-accent/30 rounded-3xl p-6 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Nome</label>
                          <input 
                            type="text" 
                            value={editingProf.name || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, name: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="Ex: Dr. Ricardo Silva" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Cargo/Especialidade</label>
                          <input 
                            type="text" 
                            value={editingProf.role || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, role: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="Ex: Barbeiro Master" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">E-mail de Acesso</label>
                          <input 
                            type="email" 
                            value={editingProf.email || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, email: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="exemplo@email.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Senha de Acesso</label>
                          <input 
                            type="text" 
                            value={editingProf.password || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, password: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="Defina uma senha" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">CPF (Para Recuperação)</label>
                          <input 
                            type="text" 
                            value={editingProf.cpf || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, cpf: maskCPF(e.target.value) })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="000.000.000-00" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Data de Nascimento (Para Recuperação)</label>
                          <input 
                            type="text" 
                            value={editingProf.dob ? (editingProf.dob.includes('-') ? editingProf.dob.split('-').reverse().join('/') : editingProf.dob) : ''}
                            onChange={(e) => setEditingProf({ ...editingProf, dob: maskDate(e.target.value) })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">URL da Foto</label>
                          <input 
                            type="text" 
                            value={editingProf.photo || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, photo: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                            placeholder="https://images.unsplash.com/..." 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase text-text-muted ml-1">Bio (Opcional)</label>
                          <textarea 
                            value={editingProf.bio || ''}
                            onChange={(e) => setEditingProf({ ...editingProf, bio: e.target.value })}
                            className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all min-h-[100px]" 
                            placeholder="Conte um pouco sobre o profissional..." 
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button 
                          onClick={() => setEditingProf(null)}
                          className="px-6 py-2 rounded-xl font-bold text-text-muted hover:text-text-main transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveProf}
                          disabled={loading}
                          className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          Salvar Profissional
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {professionals.map((prof) => (
                      <div key={prof.id} className="bg-surface border border-border-custom rounded-3xl overflow-hidden group hover:border-accent/50 transition-all">
                        <div className="h-48 relative">
                          <img src={prof.photo || `https://ui-avatars.com/api/?name=${prof.name}&background=random`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                            <button 
                              onClick={() => setEditingProf(prof)}
                              className="p-3 bg-white text-black rounded-full hover:scale-110 transition-all"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProf(prof.id)}
                              className="p-3 bg-danger text-white rounded-full hover:scale-110 transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="font-black text-lg mb-1">{prof.name}</h4>
                          <p className="text-sm text-accent font-bold">{prof.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Management */}
                <div className="space-y-8 pt-12 border-t border-border-custom">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <LayoutDashboard size={24} className="text-accent" /> Gestão do Rodapé
                    </h3>
                    <button 
                      onClick={handleSaveFooter}
                      disabled={loading}
                      className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      Salvar Rodapé
                    </button>
                  </div>
                  
                  <div className="bg-surface border border-border-custom rounded-3xl p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Instagram (URL)</label>
                        <input 
                          type="text" 
                          value={footerSettings.instagram || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, instagram: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="https://instagram.com/seuusuario" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Facebook (URL)</label>
                        <input 
                          type="text" 
                          value={footerSettings.facebook || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, facebook: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="https://facebook.com/suapagina" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">WhatsApp (Link ou Número)</label>
                        <input 
                          type="text" 
                          value={footerSettings.whatsapp || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, whatsapp: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="https://wa.me/55..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Telefone de Contato</label>
                        <input 
                          type="text" 
                          value={footerSettings.phone || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, phone: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="(11) 99999-9999" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">E-mail</label>
                        <input 
                          type="email" 
                          value={footerSettings.email || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, email: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="contato@empresa.com.br" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Endereço Completo</label>
                        <textarea 
                          value={footerSettings.address || ''}
                          onChange={(e) => setFooterSettings({ ...footerSettings, address: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all min-h-[80px]" 
                          placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'servicos' && (
              <div className="max-w-6xl space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Settings size={24} className="text-accent" /> Gestão de Serviços
                  </h3>
                  <button 
                    onClick={() => setEditingService({ name: '', price: 0, duration: 30, icon: '✂️', category: 'Geral' })}
                    className="bg-accent text-background px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Plus size={18} /> Novo Serviço
                  </button>
                </div>

                {editingService && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface border-2 border-accent/30 rounded-3xl p-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Nome do Serviço</label>
                        <input 
                          type="text" 
                          value={editingService.name || ''}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="Ex: Corte de Cabelo Masculino" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Categoria</label>
                        <input 
                          type="text" 
                          value={editingService.category || ''}
                          onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="Ex: Cabelo, Barba, Estética..." 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Preço (R$)</label>
                        <input 
                          type="number" 
                          value={editingService.price || ''}
                          onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="0.00" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Duração (minutos)</label>
                        <input 
                          type="number" 
                          value={editingService.duration || ''}
                          onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="30" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Emoji/Ícone</label>
                        <input 
                          type="text" 
                          value={editingService.icon || ''}
                          onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="Ex: ✂️" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">URL da Imagem (Opcional)</label>
                        <input 
                          type="text" 
                          value={editingService.image || ''}
                          onChange={(e) => setEditingService({ ...editingService, image: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="https://images.unsplash.com/..." 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button 
                        onClick={() => setEditingService(null)}
                        className="px-6 py-2 rounded-xl font-bold text-text-muted hover:text-text-main transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveService}
                        disabled={loading}
                        className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                        Salvar Serviço
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(s => (
                    <div key={s.id} className="bg-surface border border-border-custom rounded-3xl p-6 flex flex-col gap-4 group hover:border-accent/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center text-3xl border border-border-custom group-hover:bg-accent/10 transition-colors">
                          {s.image ? <img src={s.image} className="w-full h-full object-cover rounded-xl" /> : s.icon}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingService(s)}
                            className="p-2 bg-surface-hover text-text-muted hover:text-accent rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteService(s.id)}
                            className="p-2 bg-surface-hover text-text-muted hover:text-danger rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[0.65rem] font-black uppercase text-accent tracking-widest mb-1">{s.category}</div>
                        <h4 className="font-black text-xl mb-1">{s.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1"><Clock size={14} /> {s.duration}min</span>
                          <span className="font-black text-text-main">{formatBRL(s.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-surface rounded-3xl border border-dashed border-border-custom">
                      <Settings size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                      <p className="text-text-muted font-bold">Nenhum serviço cadastrado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clientes' && (
              <div className="max-w-6xl space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black">Base de Clientes</h3>
                    <button 
                      onClick={() => setEditingClient({ name: '', cpf: '', email: '', phone: '' })}
                      className="bg-accent text-background px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Plus size={18} /> Novo Cliente
                    </button>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, CPF ou WhatsApp..."
                      className="w-full bg-surface border border-border-custom rounded-xl pl-12 pr-4 py-3 focus:border-accent outline-none transition-all"
                    />
                  </div>
                </div>

                {editingClient && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface border-2 border-accent/30 rounded-3xl p-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Nome Completo</label>
                        <input 
                          type="text" 
                          value={editingClient.name || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="Ex: João Silva" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">CPF</label>
                        <input 
                          type="text" 
                          value={editingClient.cpf || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, cpf: maskCPF(e.target.value) })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="000.000.000-00" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">WhatsApp</label>
                        <input 
                          type="text" 
                          value={editingClient.phone || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, phone: maskPhone(e.target.value) })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">E-mail</label>
                        <input 
                          type="email" 
                          value={editingClient.email || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="joao@email.com" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Data de Nascimento</label>
                        <input 
                          type="text" 
                          value={editingClient.dob ? (editingClient.dob.includes('-') ? editingClient.dob.split('-').reverse().join('/') : editingClient.dob) : ''}
                          onChange={(e) => setEditingClient({ ...editingClient, dob: maskDate(e.target.value) })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Profissão</label>
                        <select 
                          value={editingClient.profession || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, profession: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all appearance-none"
                        >
                          <option value="">Selecione uma profissão</option>
                          {PROFESSIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                          <option value="Outra">Outra</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button 
                        onClick={() => setEditingClient(null)}
                        className="px-6 py-2 rounded-xl font-bold text-text-muted hover:text-text-main transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveClient}
                        disabled={loading}
                        className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                        Salvar Cliente
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="bg-surface border border-border-custom rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-background border-b border-border-custom">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Cliente</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">CPF</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">WhatsApp</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">E-mail</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-custom">
                        {clients
                          .filter(c => 
                            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.cpf.includes(searchTerm) ||
                            c.phone.includes(searchTerm)
                          )
                          .map(client => (
                            <tr key={client.cpf} className="hover:bg-surface-hover transition-colors group">
                              <td className="px-6 py-4">
                                <div className="font-bold text-text-main">{toTitleCase(client.name)}</div>
                                <div className="text-[0.65rem] text-text-muted uppercase font-black tracking-tighter">
                                  {client.profession || 'Sem profissão'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-text-muted font-medium">{client.cpf}</td>
                              <td className="px-6 py-4 text-text-muted font-medium">{client.phone}</td>
                              <td className="px-6 py-4 text-text-muted font-medium">{client.email}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingClient(client)}
                                    className="p-2 text-text-muted hover:text-accent transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClient(client.cpf)}
                                    className="p-2 text-text-muted hover:text-danger transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {clients.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center text-text-muted font-bold">
                              Nenhum cliente cadastrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'relatorios' && (
              <div className="max-w-6xl space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <BarChart3 size={24} className="text-accent" /> Relatórios de CRM
                  </h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-surface border border-border-custom rounded-xl text-sm font-bold hover:bg-surface-hover transition-all flex items-center gap-2">
                      <Filter size={16} /> Filtrar Período
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface border border-border-custom rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        <Users size={24} />
                      </div>
                      <div className="flex items-center gap-1 text-accent text-xs font-bold">
                        <TrendingUp size={14} /> +12%
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black">{clients.length}</div>
                      <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Total de Clientes</div>
                    </div>
                  </div>

                  <div className="bg-surface border border-border-custom rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
                        <Target size={24} />
                      </div>
                      <div className="flex items-center gap-1 text-accent-secondary text-xs font-bold">
                        <TrendingUp size={14} /> +5%
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black">
                        {(() => {
                          const clientAptCount = new Map();
                          appointments.forEach(a => {
                            clientAptCount.set(a.phone, (clientAptCount.get(a.phone) || 0) + 1);
                          });
                          const recurring = Array.from(clientAptCount.values()).filter(count => count > 1).length;
                          return clients.length > 0 ? Math.round((recurring / clients.length) * 100) : 0;
                        })()}%
                      </div>
                      <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Taxa de Retenção</div>
                    </div>
                  </div>

                  <div className="bg-surface border border-border-custom rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center text-orange-400">
                        <PieChart size={24} />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black">
                        {formatBRL(appointments.reduce((acc, curr) => acc + (curr.status !== 'cancelled' ? curr.finalPrice : 0), 0) / (clients.length || 1))}
                      </div>
                      <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Ticket Médio p/ Cliente</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-surface border border-border-custom rounded-3xl p-8 space-y-6">
                    <h4 className="font-black uppercase tracking-widest text-text-muted text-sm">Serviços Mais Procurados</h4>
                    <div className="space-y-4">
                      {(() => {
                        const serviceStats = new Map();
                        appointments.forEach(a => {
                          const s = services.find(svc => svc.id === a.serviceId);
                          if (s) {
                            const current = serviceStats.get(s.name) || { count: 0, revenue: 0 };
                            serviceStats.set(s.name, {
                              count: current.count + 1,
                              revenue: current.revenue + a.finalPrice
                            });
                          }
                        });
                        return Array.from(serviceStats.entries())
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 5)
                          .map(([name, stat]) => (
                            <div key={name} className="space-y-2">
                              <div className="flex justify-between text-sm font-bold">
                                <span>{name}</span>
                                <span className="text-accent">{stat.count} agend.</span>
                              </div>
                              <div className="h-2 bg-background rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(stat.count / appointments.length) * 100}%` }}
                                  className="h-full bg-accent"
                                />
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>

                  <div className="bg-surface border border-border-custom rounded-3xl p-8 space-y-6">
                    <h4 className="font-black uppercase tracking-widest text-text-muted text-sm">Desempenho da Equipe</h4>
                    <div className="space-y-4">
                      {(() => {
                        const profStats = new Map();
                        appointments.forEach(a => {
                          const current = profStats.get(a.profName) || { count: 0, revenue: 0 };
                          profStats.set(a.profName, {
                            count: current.count + 1,
                            revenue: current.revenue + a.finalPrice
                          });
                        });
                        return Array.from(profStats.entries())
                          .sort((a, b) => b[1].revenue - a[1].revenue)
                          .slice(0, 5)
                          .map(([name, stat]) => (
                            <div key={name} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border-custom">
                              <div className="font-bold text-sm">{name}</div>
                              <div className="text-right">
                                <div className="text-accent font-black">{formatBRL(stat.revenue)}</div>
                                <div className="text-[0.6rem] text-text-muted uppercase font-bold">{stat.count} atendimentos</div>
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'horarios' && (
              <div className="max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <Clock size={24} className="text-accent" /> Horário de Funcionamento
                  </h3>
                  <button 
                    onClick={handleSaveWorkingHours}
                    disabled={loading}
                    className="bg-accent text-background px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                    Salvar Alterações
                  </button>
                </div>

                <div className="bg-surface border border-border-custom rounded-3xl overflow-hidden">
                  <div className="divide-y divide-border-custom">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day, i) => {
                      const hours = workingHours.find(h => h.day_of_week === i) || { day_of_week: i, start_time: '08:00', end_time: '18:00', is_active: false };
                      return (
                        <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-surface-hover transition-colors">
                          <div className="flex items-center gap-4 min-w-[150px]">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center font-black",
                              hours.is_active ? "bg-accent/10 text-accent" : "bg-surface-hover text-text-muted"
                            )}>
                              {day.substring(0, 3)}
                            </div>
                            <span className="font-bold text-lg">{day}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                              <input 
                                type="time" 
                                value={hours.start_time}
                                disabled={!hours.is_active}
                                onChange={(e) => {
                                  const newHours = [...workingHours];
                                  const idx = newHours.findIndex(h => h.day_of_week === i);
                                  if (idx !== -1) {
                                    newHours[idx].start_time = e.target.value;
                                  } else {
                                    newHours.push({ ...hours, start_time: e.target.value });
                                  }
                                  setWorkingHours(newHours);
                                }}
                                className="bg-background border border-border-custom rounded-lg px-3 py-2 focus:border-accent outline-none transition-all disabled:opacity-30"
                              />
                              <span className="text-text-muted">até</span>
                              <input 
                                type="time" 
                                value={hours.end_time}
                                disabled={!hours.is_active}
                                onChange={(e) => {
                                  const newHours = [...workingHours];
                                  const idx = newHours.findIndex(h => h.day_of_week === i);
                                  if (idx !== -1) {
                                    newHours[idx].end_time = e.target.value;
                                  } else {
                                    newHours.push({ ...hours, end_time: e.target.value });
                                  }
                                  setWorkingHours(newHours);
                                }}
                                className="bg-background border border-border-custom rounded-lg px-3 py-2 focus:border-accent outline-none transition-all disabled:opacity-30"
                              />
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={hours.is_active}
                                onChange={(e) => {
                                  const newHours = [...workingHours];
                                  const idx = newHours.findIndex(h => h.day_of_week === i);
                                  if (idx !== -1) {
                                    newHours[idx].is_active = e.target.checked;
                                  } else {
                                    newHours.push({ ...hours, is_active: e.target.checked });
                                  }
                                  setWorkingHours(newHours);
                                }}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                              <span className="ml-3 text-sm font-bold text-text-muted">
                                {hours.is_active ? 'Aberto' : 'Fechado'}
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <HelpCircle size={24} className="text-accent" /> Gestão de FAQ
                  </h3>
                  <button 
                    onClick={() => setEditingFaq({ q: '', a: '' })}
                    className="bg-accent text-background px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Plus size={18} /> Nova Pergunta
                  </button>
                </div>

                {editingFaq && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface border-2 border-accent/30 rounded-3xl p-6 space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Pergunta</label>
                        <input 
                          type="text" 
                          value={editingFaq.q || ''}
                          onChange={(e) => setEditingFaq({ ...editingFaq, q: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                          placeholder="Ex: Qual o horário de funcionamento?" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted ml-1">Resposta</label>
                        <textarea 
                          value={editingFaq.a || ''}
                          onChange={(e) => setEditingFaq({ ...editingFaq, a: e.target.value })}
                          className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all min-h-[120px]" 
                          placeholder="Ex: Atendemos de segunda a sexta..." 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button 
                        onClick={() => setEditingFaq(null)}
                        className="px-6 py-2 rounded-xl font-bold text-text-muted hover:text-text-main transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveFaq}
                        disabled={loading}
                        className="bg-accent text-background px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                        Salvar FAQ
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="bg-surface border border-border-custom rounded-2xl p-6 flex items-start justify-between gap-4 group hover:border-accent/40 transition-all">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">{faq.q}</h4>
                        <p className="text-text-muted text-sm line-clamp-2">{faq.a}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingFaq(faq)}
                          className="p-2 bg-surface-hover text-text-muted hover:text-accent rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFaq(faq.id!)}
                          className="p-2 bg-surface-hover text-text-muted hover:text-danger rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border-custom">
                      <HelpCircle size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                      <p className="text-text-muted font-bold">Nenhuma pergunta cadastrada.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="max-w-4xl space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Lock size={24} className="text-accent" /> Segurança do Painel
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface border border-border-custom rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Senha do Administrador</div>
                        <div className="text-xs text-text-muted">Altere a senha de acesso ao painel</div>
                      </div>
                      <button 
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="bg-accent/10 text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent/20 transition-all"
                      >
                        {isChangingPassword ? 'Cancelar' : 'Alterar'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isChangingPassword && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-border-custom"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Nova Senha</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                              placeholder="Digite a nova senha" 
                            />
                          </div>
                          <button 
                            onClick={handleUpdatePassword}
                            disabled={loading}
                            className="w-full bg-accent text-background py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Salvar Nova Senha'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-surface border border-border-custom rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Pergunta de Segurança</div>
                        <div className="text-xs text-text-muted">Para recuperação de senha sem e-mail</div>
                      </div>
                      <button 
                        onClick={() => setIsEditingSecurity(!isEditingSecurity)}
                        className="bg-accent/10 text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent/20 transition-all"
                      >
                        {isEditingSecurity ? 'Cancelar' : 'Configurar'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isEditingSecurity && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-border-custom"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Pergunta</label>
                            <input 
                              type="text" 
                              value={adminSecurityQuestion}
                              onChange={(e) => setAdminSecurityQuestion(e.target.value)}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                              placeholder="Ex: Qual o nome do seu primeiro pet?" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted ml-1">Resposta</label>
                            <input 
                              type="text" 
                              value={adminSecurityAnswer}
                              onChange={(e) => setAdminSecurityAnswer(e.target.value)}
                              className="w-full bg-background border border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all" 
                              placeholder="Sua resposta secreta" 
                            />
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                await api.updateSettings('admin_security_question', adminSecurityQuestion);
                                await api.updateSettings('admin_security_answer', adminSecurityAnswer);
                                setIsEditingSecurity(false);
                                setSuccessMessage('Pergunta de segurança salva com sucesso!');
                                setTimeout(() => setSuccessMessage(''), 5000);
                              } catch (err) {
                                alert('Erro ao salvar pergunta.');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            className="w-full bg-accent text-background py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Salvar Configuração'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-surface border border-border-custom rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">Logs de Acesso</div>
                        <div className="text-xs text-text-muted">Veja quem acessou o painel recentemente</div>
                      </div>
                      <button 
                        onClick={() => setShowLogs(!showLogs)}
                        className="bg-accent/10 text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent/20 transition-all"
                      >
                        {showLogs ? 'Ocultar' : 'Ver Logs'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showLogs && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-4 border-t border-border-custom max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                        >
                          {accessLogs.length > 0 ? (
                            accessLogs.map(log => (
                              <div key={log.id} className="p-3 bg-background rounded-xl border border-border-custom text-xs">
                                <div className="flex justify-between mb-1">
                                  <span className={cn("font-bold", log.type === 'error' ? "text-danger" : "text-accent")}>
                                    {log.event}
                                  </span>
                                  <span className="text-text-muted">{log.date}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-text-muted py-4">Nenhum log registrado.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      </main>
    </div>
  );
}
