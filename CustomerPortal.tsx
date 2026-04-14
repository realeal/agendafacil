import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Client, Service, Review, Appointment } from '@/src/types';
import BookingStepper from '@/src/components/BookingStepper';
import { cn, toTitleCase, maskCPF, maskPhone, maskDate } from '@/src/lib/utils';
import { 
  User, 
  Lock, 
  LogOut, 
  Star, 
  MessageSquare, 
  Save, 
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  MapPin,
  Baby,
  Briefcase,
  Settings,
  Heart,
  Camera,
  Clock,
  ArrowLeft,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'recovery'>('login');
  
  // Login State
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Recovery State
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryDob, setRecoveryDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  
  // Register State
  const [regForm, setRegForm] = useState({
    cpf: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });
  const [registerError, setRegisterError] = useState('');
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState<'agendamento' | 'meus-agendamentos' | 'avaliacoes' | 'perfil'>('agendamento');
  const [profileSubTab, setProfileSubTab] = useState<'dados' | 'seguranca'>('dados');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const professions = [
    "Administrador", "Advogado", "Analista de Sistemas", "Arquiteto", 
    "Assistente Social", "Autônomo", "Contador", "Designer", 
    "Educador Físico", "Enfermeiro", "Engenheiro", "Esteticista", 
    "Farmacêutico", "Fisioterapeuta", "Médico", "Nutricionista", 
    "Psicólogo", "Professor", "Publicitário", "Vendedor", "Outra"
  ];

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setEditingClient(prev => prev ? {
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        } : null);
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setLoadingCep(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    service_id: 0,
    stars: 5,
    comment: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const hasSupabaseKeys = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const savedClient = localStorage.getItem('customer_portal_client');
    if (savedClient) {
      const client = JSON.parse(savedClient);
      setCurrentClient(client);
      setEditingClient(client);
      setIsLoggedIn(true);
      
      // Fetch latest data from DB to ensure it's up to date
      api.getClientByCpf(client.cpf).then(latest => {
        if (latest) {
          setCurrentClient(latest);
          setEditingClient(latest);
          localStorage.setItem('customer_portal_client', JSON.stringify(latest));
        }
      }).catch(err => console.error('Error fetching latest client data:', err));
    }
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await api.getServices();
      setServices(data);
      if (data.length > 0) {
        setNewReview(prev => ({ ...prev, service_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }

  useEffect(() => {
    if (isLoggedIn && currentClient) {
      loadClientAppointments();
    }
  }, [isLoggedIn, currentClient]);

  const loadClientAppointments = async () => {
    if (!currentClient) return;
    try {
      const data = await api.getAppointmentsByClientId(currentClient.cpf);
      setClientAppointments(data);
    } catch (err) {
      console.error('Error loading client appointments:', err);
    }
  };

  const handleLogin = async () => {
    if (!loginCpf || !loginPassword) {
      setLoginError('Preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    try {
      const client = await api.getClientByCpf(loginCpf);
      if (client && client.password === loginPassword) {
        setCurrentClient(client);
        setEditingClient(client);
        setIsLoggedIn(true);
        localStorage.setItem('customer_portal_client', JSON.stringify(client));
        setLoginError('');
        setSuccessMessage(`Bem-vindo de volta, ${toTitleCase(client.name).split(' ')[0]}! É um prazer ter você aqui.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setLoginError('CPF ou senha incorretos.');
      }
    } catch (err) {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async () => {
    setRecoveryError('');
    if (!recoveryCpf || !recoveryDob) {
      setRecoveryError('Preencha CPF e Data de Nascimento.');
      return;
    }
    setLoading(true);
    try {
      const isValid = await api.verifyClientForRecovery(recoveryCpf, recoveryDob);
      if (isValid) {
        setRecoveryStep(2);
      } else {
        setRecoveryError('Dados não conferem. Verifique o CPF e a Data de Nascimento.');
      }
    } catch (err) {
      setRecoveryError('Erro ao verificar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setRecoveryError('');
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setRecoveryError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.resetClientPassword(recoveryCpf, newPassword);
      setSuccessMessage('Senha alterada com sucesso! Você já pode entrar.');
      setView('login');
      setRecoveryStep(1);
      setRecoveryCpf('');
      setRecoveryDob('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setRecoveryError('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegisterError('');
    if (Object.values(regForm).some(v => !v)) {
      setRegisterError('Preencha todos os campos.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegisterError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Checking if client exists with CPF:', regForm.cpf);
      const existing = await api.getClientByCpf(regForm.cpf);
      if (existing) {
        setRegisterError('Este CPF já está cadastrado.');
        return;
      }
      
      const { confirmPassword, ...clientData } = regForm;
      clientData.name = toTitleCase(clientData.name);
      console.log('Creating client with payload:', clientData);
      await api.createClient(clientData);
      setSuccessMessage('O cadastro foi realizado com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
        setView('login');
        setLoginCpf(regForm.cpf);
      }, 3000);
    } catch (err: any) {
      console.error('Error during registration:', err);
      let msg = 'Erro ao realizar cadastro. ';
      if (err.message?.includes('relation "clients" does not exist')) {
        msg = 'A tabela "clients" não existe no seu Supabase. Por favor, execute o script SQL fornecido para criar as tabelas.';
      } else if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        msg = 'Algumas colunas estão faltando na tabela "clients". Verifique se você executou o script SQL de atualização.';
      } else {
        msg += (err.message || 'Verifique sua conexão e se o script SQL foi executado no Supabase.');
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentClient(null);
    localStorage.removeItem('customer_portal_client');
  };

  const handleSaveReview = async () => {
    if (!currentClient) {
      alert('Você precisa estar logado para avaliar.');
      return;
    }
    
    // Ensure we have a service selected
    const serviceId = newReview.service_id || (services.length > 0 ? services[0].id : 0);
    
    if (!serviceId) {
      alert('Selecione um serviço para avaliar.');
      return;
    }

    if (!newReview.comment.trim()) {
      alert('Por favor, escreva um comentário sobre sua experiência.');
      return;
    }
    
    setLoading(true);
    try {
      const review: Review = {
        client_cpf: currentClient.cpf,
        client_name: currentClient.name,
        service_id: Number(serviceId),
        stars: newReview.stars,
        comment: newReview.comment
      };
      console.log('Tentando salvar avaliação:', review);
      await api.createReview(review);
      console.log('Avaliação salva com sucesso!');
      setSuccessMessage(`✨ Que alegria, ${currentClient.name.split(' ')[0]}! Sua avaliação foi publicada com sucesso na vitrine do nosso site.\n\nMuito obrigado por compartilhar sua experiência conosco. Seu feedback é fundamental para continuarmos evoluindo! ❤️`);
      setNewReview({ ...newReview, comment: '' });
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Erro detalhado ao salvar avaliação:', err);
      alert('Erro ao enviar avaliação: ' + (err.message || 'Verifique se você executou o script SQL no Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingClient || !currentClient) return;
    
    setLoading(true);
    try {
      const formattedClient = { ...editingClient, name: toTitleCase(editingClient.name) };
      console.log('CustomerPortal: Salvando perfil...', formattedClient);
      await api.updateClient(currentClient.cpf, formattedClient);
      setCurrentClient(formattedClient);
      localStorage.setItem('customer_portal_client', JSON.stringify(formattedClient));
      setSuccessMessage('O cadastro foi realizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      let msg = 'Erro ao salvar perfil. ';
      if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        msg = 'Algumas colunas estão faltando na tabela "clients". Verifique se você executou o script SQL de atualização.';
      } else {
        msg += (err.message || 'Verifique sua conexão.');
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentClient) return;
    if (passwordForm.current !== currentClient.password) {
      alert('Senha atual incorreta.');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('As novas senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    try {
      await api.updateClient(currentClient.cpf, { password: passwordForm.new });
      const updatedClient = { ...currentClient, password: passwordForm.new };
      setCurrentClient(updatedClient);
      localStorage.setItem('customer_portal_client', JSON.stringify(updatedClient));
      setSuccessMessage('Senha alterada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      alert('Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-6 relative">
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

        <div className="w-full max-w-md">
          {!hasSupabaseKeys && (
            <div className="mb-6 bg-danger/10 border border-danger/20 rounded-2xl p-4 text-danger flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <div className="text-xs font-bold">
                Configuração Pendente: Adicione as chaves do Supabase em Settings {'>'} Secrets para habilitar o cadastro.
              </div>
            </div>
          )}
          <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-accent"></div>
            
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {view === 'login' ? <User size={40} className="text-accent" /> : <UserPlus size={40} className="text-accent" />}
              </div>
              <h2 className="text-3xl font-black mb-2">
                {view === 'login' ? 'Portal do Cliente' : view === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
              </h2>
              <p className="text-text-muted font-medium">
                {view === 'login' 
                  ? 'Acesse sua conta para gerenciar seu perfil' 
                  : view === 'register' 
                    ? 'Cadastre-se para avaliar nossos serviços'
                    : 'Confirme seus dados para redefinir sua senha'}
              </p>
            </div>

            {view === 'login' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">CPF</label>
                  <input 
                    type="text" 
                    value={loginCpf}
                    onChange={(e) => setLoginCpf(maskCPF(e.target.value))}
                    className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                    placeholder="000.000.000-00" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-black uppercase tracking-wider text-text-muted">Senha</label>
                    <button 
                      onClick={() => {
                        setView('recovery');
                        setRecoveryStep(1);
                        setRecoveryError('');
                      }}
                      className="text-xs font-bold text-accent hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                    placeholder="••••••••" 
                  />
                </div>

                {loginError && (
                  <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-bold p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} /> {loginError}
                  </div>
                )}

                <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Entrar Agora'}
                </button>
                
                <p className="text-center text-text-muted font-bold">
                  Não tem conta? <button onClick={() => setView('register')} className="text-accent hover:underline">Cadastre-se</button>
                </p>
              </div>
            ) : view === 'register' ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  value={regForm.name}
                  onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="text" 
                  placeholder="CPF"
                  value={regForm.cpf}
                  onChange={(e) => setRegForm({...regForm, cpf: maskCPF(e.target.value)})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="email" 
                  placeholder="E-mail"
                  value={regForm.email}
                  onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="text" 
                  placeholder="WhatsApp"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({...regForm, phone: maskPhone(e.target.value)})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="text" 
                  placeholder="Data de Nascimento (DD/MM/AAAA)"
                  value={regForm.dob}
                  onChange={(e) => setRegForm({...regForm, dob: maskDate(e.target.value)})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="password" 
                  placeholder="Senha"
                  value={regForm.password}
                  onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />
                <input 
                  type="password" 
                  placeholder="Confirmar Senha"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})}
                  className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-3 focus:border-accent outline-none transition-all font-bold" 
                />

                <button 
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-accent text-background py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Criar Minha Conta'}
                </button>

                {registerError && (
                  <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-bold p-4 rounded-xl text-center">
                    {registerError}
                  </div>
                )}
                
                <p className="text-center text-text-muted font-bold">
                  Já tem conta? <button onClick={() => setView('login')} className="text-accent hover:underline">Fazer Login</button>
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recoveryStep === 1 ? (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Seu CPF</label>
                        <input 
                          type="text" 
                          value={recoveryCpf}
                          onChange={(e) => setRecoveryCpf(maskCPF(e.target.value))}
                          className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                          placeholder="000.000.000-00" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Data de Nascimento</label>
                        <input 
                          type="text" 
                          value={recoveryDob}
                          onChange={(e) => setRecoveryDob(maskDate(e.target.value))}
                          className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                    </div>

                    {recoveryError && (
                      <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-bold p-4 rounded-xl flex items-center gap-2">
                        <AlertCircle size={18} /> {recoveryError}
                      </div>
                    )}

                    <button 
                      onClick={handleVerifyRecovery}
                      disabled={loading}
                      className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Verificar Dados'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Nova Senha</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                          placeholder="••••••••" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Confirmar Nova Senha</label>
                        <input 
                          type="password" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold" 
                          placeholder="••••••••" 
                        />
                      </div>
                    </div>

                    {recoveryError && (
                      <div className="bg-danger/10 border border-danger/20 text-danger text-sm font-bold p-4 rounded-xl flex items-center gap-2">
                        <AlertCircle size={18} /> {recoveryError}
                      </div>
                    )}

                    <button 
                      onClick={handleResetPassword}
                      disabled={loading}
                      className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Redefinir Senha'}
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setView('login')}
                  className="w-full flex items-center justify-center gap-2 text-text-muted font-bold hover:text-accent transition-colors"
                >
                  <ArrowLeft size={18} /> Voltar para o Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-surface border-r border-border-custom p-8 flex flex-col gap-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-black text-xl overflow-hidden border-2 border-accent/20">
            {currentClient?.photo ? (
              <img src={currentClient.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight">{toTitleCase(currentClient?.name || '').split(' ')[0]}</h2>
            <p className="text-accent text-xs font-bold uppercase tracking-wider">Cliente VIP</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('agendamento')}
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              activeTab === 'agendamento' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <CalendarIcon size={18} /> Novo Agendamento
          </button>
          <button 
            onClick={() => setActiveTab('meus-agendamentos')}
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              activeTab === 'meus-agendamentos' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <Clock size={18} /> Meus Agendamentos
          </button>
          <button 
            onClick={() => setActiveTab('avaliacoes')}
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              activeTab === 'avaliacoes' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <MessageSquare size={18} /> Avaliações
          </button>
          <button 
            onClick={() => setActiveTab('perfil')}
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              activeTab === 'perfil' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <Settings size={18} /> Meu Perfil
          </button>
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

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative no-scrollbar">
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

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">
              {activeTab === 'agendamento' ? 'Novo Agendamento' : activeTab === 'meus-agendamentos' ? 'Meus Agendamentos' : activeTab === 'avaliacoes' ? 'Suas Avaliações' : 'Seu Perfil'}
            </h1>
            <p className="text-text-muted text-sm">
              {activeTab === 'agendamento' 
                ? 'Escolha o melhor horário para você.' 
                : activeTab === 'meus-agendamentos'
                  ? 'Acompanhe seus horários marcados.'
                  : activeTab === 'avaliacoes' 
                    ? 'Compartilhe sua experiência conosco.' 
                    : 'Mantenha seus dados sempre atualizados.'}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'agendamento' ? (
            <motion.div 
              key="agendamento"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                <BookingStepper onSuccess={loadClientAppointments} />
              </div>
            </motion.div>
          ) : activeTab === 'meus-agendamentos' ? (
            <motion.div 
              key="meus-agendamentos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <div className="space-y-4">
                {clientAppointments.length === 0 ? (
                  <div className="bg-surface border border-border-custom rounded-[2.5rem] p-12 text-center">
                    <CalendarIcon size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                    <p className="text-text-muted font-bold">Você ainda não possui agendamentos.</p>
                    <button 
                      onClick={() => setActiveTab('agendamento')}
                      className="mt-6 text-accent font-black uppercase tracking-widest text-xs hover:underline"
                    >
                      Agendar agora
                    </button>
                  </div>
                ) : (
                  clientAppointments.map((app) => (
                    <div key={app.id} className="bg-surface border border-border-custom rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex flex-col items-center justify-center text-accent">
                          <span className="text-xs font-black uppercase">{new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                          <span className="text-xl font-black">{new Date(app.date + 'T00:00:00').getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-lg">{services.find(s => s.id === app.serviceId)?.name || 'Serviço'}</h4>
                          <div className="flex flex-wrap gap-4 mt-1">
                            <span className="flex items-center gap-1.5 text-sm text-text-muted font-bold">
                              <Clock size={14} /> {app.time}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-text-muted font-bold">
                              <User size={14} /> {app.profName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                          app.status === 'confirmed' ? "bg-success/10 text-success" : 
                          app.status === 'pending' ? "bg-warning/10 text-warning" : 
                          "bg-danger/10 text-danger"
                        )}>
                          {app.status === 'confirmed' ? 'Confirmado' : app.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                        <span className="text-lg font-black text-accent">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.finalPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : activeTab === 'avaliacoes' ? (
            <motion.div 
              key="avaliacoes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Serviço</label>
                      <select 
                        value={newReview.service_id}
                        onChange={(e) => setNewReview({...newReview, service_id: Number(e.target.value)})}
                        className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Nota</label>
                      <div className="flex items-center gap-2 bg-surface-hover border border-border-custom rounded-2xl px-5 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setNewReview({...newReview, stars: star})}
                            className="transition-transform hover:scale-125"
                          >
                            <Star 
                              size={24} 
                              className={cn(
                                "transition-colors",
                                star <= newReview.stars ? "text-yellow-400 fill-yellow-400" : "text-text-muted opacity-30"
                              )} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-wider text-text-muted ml-1">Seu Comentário</label>
                    <textarea 
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      rows={4}
                      className="w-full bg-surface-hover border border-border-custom rounded-2xl px-5 py-4 focus:border-accent outline-none transition-all font-bold resize-none"
                      placeholder="Como foi o atendimento? O resultado ficou como você esperava?"
                    />
                  </div>

                  <button 
                    onClick={handleSaveReview}
                    disabled={loading}
                    className="bg-accent text-background px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 active:scale-100 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Enviar Avaliação</>}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="perfil"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl"
            >
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setProfileSubTab('dados')}
                  className={cn(
                    "px-6 py-3 rounded-xl font-bold transition-all",
                    profileSubTab === 'dados' ? "bg-accent text-background shadow-lg shadow-accent/20" : "bg-surface border border-border-custom text-text-muted hover:text-text-main"
                  )}
                >
                  Dados Pessoais
                </button>
                <button 
                  onClick={() => setProfileSubTab('seguranca')}
                  className={cn(
                    "px-6 py-3 rounded-xl font-bold transition-all",
                    profileSubTab === 'seguranca' ? "bg-accent text-background shadow-lg shadow-accent/20" : "bg-surface border border-border-custom text-text-muted hover:text-text-main"
                  )}
                >
                  Segurança
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {profileSubTab === 'dados' ? (
                    <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                      {/* Foto do Perfil */}
                      <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-accent/10 border-4 border-accent/20 overflow-hidden flex items-center justify-center transition-all group-hover:border-accent/40">
                            {editingClient?.photo ? (
                              <img src={editingClient.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={48} className="text-accent/40" />
                            )}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-background shadow-lg border-4 border-surface">
                            <Camera size={18} />
                          </div>
                        </div>
                        <div className="mt-6 w-full max-w-xs">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 block mb-2 text-center">URL da Foto</label>
                          <input 
                            type="text" 
                            value={editingClient?.photo || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, photo: e.target.value })}
                            placeholder="https://exemplo.com/foto.jpg"
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold text-sm text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nome Completo</label>
                          <input 
                            type="text" 
                            value={editingClient?.name || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, name: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">CPF (Inalterável)</label>
                          <input 
                            type="text" 
                            value={maskCPF(editingClient?.cpf || '')}
                            disabled
                            className="w-full bg-background/50 border-2 border-border-custom rounded-xl px-4 py-3 outline-none font-bold text-text-muted cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
                          <input 
                            type="email" 
                            value={editingClient?.email || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, email: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">WhatsApp</label>
                          <input 
                            type="text" 
                            value={maskPhone(editingClient?.phone || '')}
                            onChange={(e) => setEditingClient({ ...editingClient!, phone: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>
                        
                        {/* Endereço */}
                        <div className="md:col-span-2 pt-4 border-t border-border-custom mt-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-accent mb-4">Endereço</h4>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                            <MapPin size={14} /> CEP
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={maskCEP(editingClient?.cep || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingClient({ ...editingClient!, cep: val });
                                if (val.replace(/\D/g, '').length === 8) handleCepLookup(val);
                              }}
                              className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                              placeholder="00000-000"
                            />
                            {loadingCep && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent" />}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Logradouro</label>
                          <input 
                            type="text" 
                            value={editingClient?.street || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, street: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Número</label>
                          <input 
                            type="text" 
                            value={editingClient?.number || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, number: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Complemento</label>
                          <input 
                            type="text" 
                            value={editingClient?.complement || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, complement: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Bairro</label>
                          <input 
                            type="text" 
                            value={editingClient?.neighborhood || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, neighborhood: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Cidade</label>
                          <input 
                            type="text" 
                            value={editingClient?.city || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, city: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">UF</label>
                          <input 
                            type="text" 
                            value={editingClient?.state || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, state: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold text-center"
                            maxLength={2}
                            placeholder="UF"
                          />
                        </div>

                        {/* Outros Dados */}
                        <div className="md:col-span-2 pt-4 border-t border-border-custom mt-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-accent mb-4">Informações Adicionais</h4>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                            <CalendarIcon size={14} /> Data de Nascimento
                          </label>
                          <input 
                            type="text" 
                            value={editingClient?.dob ? (editingClient.dob.includes('-') ? editingClient.dob.split('-').reverse().join('/') : editingClient.dob) : ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, dob: maskDate(e.target.value) })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                            placeholder="DD/MM/AAAA"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                            <Heart size={14} /> Gênero
                          </label>
                          <select 
                            value={editingClient?.gender || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, gender: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          >
                            <option value="">Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                            <option value="Prefiro não dizer">Prefiro não dizer</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                            <Baby size={14} /> Filhos
                          </label>
                          <select 
                            value={editingClient?.children || ''}
                            onChange={(e) => setEditingClient({ ...editingClient!, children: e.target.value })}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                          >
                            <option value="Nenhum">Nenhum</option>
                            <option value="1 filho">1 filho</option>
                            <option value="2 filhos">2 filhos</option>
                            <option value="3 filhos">3 filhos</option>
                            <option value="4 filhos">4 filhos</option>
                            <option value="5 ou mais filhos">5 ou mais filhos</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                            <Briefcase size={14} /> Profissão
                          </label>
                          <select 
                            value={professions.includes(editingClient?.profession || '') ? editingClient?.profession : (editingClient?.profession ? 'Outra' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Outra') {
                                setEditingClient({ ...editingClient!, profession: '' });
                              } else {
                                setEditingClient({ ...editingClient!, profession: val });
                              }
                            }}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold text-sm"
                          >
                            <option value="">Selecione sua profissão...</option>
                            {professions.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          {(!professions.includes(editingClient?.profession || '') || editingClient?.profession === '') && (
                            <input 
                              type="text"
                              placeholder="Digite sua profissão"
                              value={editingClient?.profession || ''}
                              onChange={(e) => setEditingClient({ ...editingClient!, profession: e.target.value })}
                              className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold text-sm mt-2"
                            />
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="w-full mt-10 bg-accent text-background py-4 rounded-2xl font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-surface border border-border-custom rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                      <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                        <Lock className="text-accent" /> Alterar Senha
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase tracking-widest text-text-muted ml-1">Senha Atual</label>
                          <input 
                            type="password" 
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-5 py-4 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase tracking-widest text-text-muted ml-1">Nova Senha</label>
                          <input 
                            type="password" 
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-5 py-4 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase tracking-widest text-text-muted ml-1">Confirmar Nova Senha</label>
                          <input 
                            type="password" 
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                            className="w-full bg-background border-2 border-border-custom rounded-xl px-5 py-4 focus:border-accent outline-none transition-all font-bold"
                          />
                        </div>

                        <button 
                          onClick={handleChangePassword}
                          disabled={loading}
                          className="w-full bg-accent text-background py-4 rounded-2xl font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 mt-4"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Atualizar Senha</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="bg-accent/5 border border-accent/10 rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="font-black text-lg">Perfil Seguro</h4>
                    </div>
                    <p className="text-sm text-text-muted font-medium leading-relaxed">
                      Seus dados estão protegidos e são usados apenas para facilitar seus agendamentos e personalizar sua experiência.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
