import { useState, useEffect } from 'react';
import { api } from '@/src/services/api';
import { Appointment, Professional, AppointmentStatus } from '@/src/types';
import { formatBRL, cn, toTitleCase, maskCPF, maskDate } from '@/src/lib/utils';
import { 
  Calendar, 
  Clock, 
  Users, 
  LogOut,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
  Search,
  Filter,
  Phone,
  Mail,
  User,
  ChevronRight,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfessionalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loggedProf, setLoggedProf] = useState<Professional | null>(null);
  
  // Recovery State
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryDob, setRecoveryDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'clientes' | 'perfil'>('agenda');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProf, setEditingProf] = useState<Partial<Professional> | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const profs = await api.getProfessionals();
      const found = profs.find(p => p.email === email && p.password === password);
      
      if (found) {
        setLoggedProf(found);
        setEditingProf(found);
        setIsLoggedIn(true);
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async () => {
    setRecoveryError('');
    if (!recoveryEmail || !recoveryCpf || !recoveryDob) {
      setRecoveryError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const isValid = await api.verifyProfessionalForRecovery(recoveryEmail, recoveryCpf, recoveryDob);
      if (isValid) {
        setRecoveryStep(2);
      } else {
        setRecoveryError('Dados não conferem. Verifique E-mail, CPF e Data de Nascimento.');
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
      await api.resetProfessionalPassword(recoveryEmail, newPassword);
      alert('Senha alterada com sucesso! Você já pode entrar.');
      setView('login');
      setRecoveryStep(1);
      setRecoveryEmail('');
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

  useEffect(() => {
    if (isLoggedIn && loggedProf) {
      loadData();
    }
  }, [isLoggedIn, loggedProf]);

  async function loadData() {
    if (!loggedProf) return;
    try {
      setLoading(true);
      const apts = await api.getAppointmentsByProfessional(loggedProf.id);
      setAppointments(apts);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (id: number, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProf) return;
    try {
      setLoading(true);
      const cleanCpf = editingProf.cpf?.replace(/\D/g, '') || '';
      const payload = { ...editingProf, cpf: cleanCpf };
      await api.upsertProfessional(payload);
      setLoggedProf(payload as Professional);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-surface border-2 border-accent/20 rounded-[2.5rem] p-10 shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mx-auto mb-6">
              <User size={40} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">
              {view === 'login' ? 'Área do Profissional' : 'Recuperar Senha'}
            </h1>
            <p className="text-text-muted">
              {view === 'login' 
                ? 'Acesse sua agenda e gerencie seus atendimentos.' 
                : 'Confirme seus dados para redefinir sua senha.'}
            </p>
          </div>

          {view === 'login' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail Profissional</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted">Senha</label>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>

              {loginError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-danger text-sm font-bold text-center"
                >
                  E-mail ou senha incorretos.
                </motion.p>
              )}

              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Painel'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {recoveryStep === 1 ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
                      <input 
                        type="email" 
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">CPF</label>
                      <input 
                        type="text" 
                        value={recoveryCpf}
                        onChange={(e) => setRecoveryCpf(maskCPF(e.target.value))}
                        className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Data de Nascimento</label>
                      <input 
                        type="text" 
                        value={recoveryDob}
                        onChange={(e) => setRecoveryDob(maskDate(e.target.value))}
                        className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
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
                    className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verificar Dados'}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nova Senha</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Confirmar Nova Senha</label>
                      <input 
                        type="password" 
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-background border-2 border-border-custom rounded-2xl px-6 py-4 focus:border-accent outline-none transition-all font-bold"
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
                    className="w-full bg-accent text-background py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
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
        </motion.div>
      </div>
    );
  }

  const filteredAppointments = appointments.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  );

  const uniqueClients = Array.from(new Set(appointments.map(a => a.phone))).map(phone => {
    return appointments.find(a => a.phone === phone);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-surface border-r border-border-custom p-8 flex flex-col gap-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-black text-xl overflow-hidden">
            {loggedProf?.photo ? (
              <img src={loggedProf.photo} className="w-full h-full object-cover" />
            ) : (
              loggedProf?.initials
            )}
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight">{loggedProf?.name}</h2>
            <p className="text-accent text-xs font-bold uppercase tracking-wider">{loggedProf?.role}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'agenda' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <Calendar size={20} /> Agenda
          </button>
          <button 
            onClick={() => setActiveTab('clientes')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'clientes' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <Users size={20} /> Meus Clientes
          </button>
          <button 
            onClick={() => setActiveTab('perfil')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'perfil' ? "bg-accent text-background shadow-lg shadow-accent/20" : "text-text-muted hover:bg-surface-hover hover:text-text-main"
            )}
          >
            <Settings size={20} /> Meu Perfil
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-border-custom">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-danger hover:bg-danger/10 transition-all w-full"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
              {activeTab === 'agenda' ? 'Sua Agenda' : 'Seus Clientes'}
            </h1>
            <p className="text-text-muted">
              {activeTab === 'agenda' 
                ? `Você tem ${appointments.filter(a => a.status === 'pending').length} agendamentos pendentes.`
                : `Você já atendeu ${uniqueClients.length} clientes diferentes.`}
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border-2 border-border-custom rounded-2xl pl-12 pr-6 py-4 w-full md:w-80 focus:border-accent outline-none transition-all font-bold"
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'agenda' ? (
            <motion.div 
              key="agenda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-accent w-10 h-10" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-surface border-2 border-dashed border-border-custom rounded-[2.5rem] p-20 text-center">
                  <Calendar size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                  <p className="text-text-muted font-bold">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAppointments.map((apt) => (
                    <div 
                      key={apt.id}
                      className="bg-surface border border-border-custom rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 transition-all group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-background rounded-2xl flex flex-col items-center justify-center border border-border-custom">
                          <span className="text-[10px] font-black uppercase text-accent">{apt.date.split('-')[2]}</span>
                          <span className="text-xl font-black">{apt.time}</span>
                        </div>
                        <div>
                          <h3 className="font-black text-lg group-hover:text-accent transition-colors">{toTitleCase(apt.name)}</h3>
                          <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                            <span className="flex items-center gap-1"><Phone size={14} /> {apt.phone}</span>
                            <span className="flex items-center gap-1 font-bold text-text-main">{formatBRL(apt.finalPrice)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {apt.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                              className="flex-1 md:flex-none bg-accent/10 text-accent px-6 py-3 rounded-xl font-black hover:bg-accent hover:text-background transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={18} /> Confirmar
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                              className="flex-1 md:flex-none bg-danger/10 text-danger px-6 py-3 rounded-xl font-black hover:bg-danger hover:text-white transition-all flex items-center gap-2"
                            >
                              <XCircle size={18} /> Cancelar
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <div className="flex items-center gap-2 text-accent font-black bg-accent/10 px-6 py-3 rounded-xl">
                            <CheckCircle2 size={18} /> Confirmado
                            <button 
                              onClick={() => handleStatusUpdate(apt.id, 'done')}
                              className="ml-4 text-xs underline hover:text-text-main"
                            >
                              Marcar como concluído
                            </button>
                          </div>
                        )}
                        {apt.status === 'done' && (
                          <div className="flex items-center gap-2 text-text-muted font-black bg-surface-hover px-6 py-3 rounded-xl">
                            <CheckCircle2 size={18} /> Concluído
                          </div>
                        )}
                        {apt.status === 'cancelled' && (
                          <div className="flex items-center gap-2 text-danger font-black bg-danger/10 px-6 py-3 rounded-xl">
                            <XCircle size={18} /> Cancelado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'clientes' ? (
            <motion.div 
              key="clientes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {uniqueClients.map((client, idx) => (
                <div key={idx} className="bg-surface border border-border-custom rounded-[2rem] p-8 hover:border-accent/50 transition-all group">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <User size={32} />
                  </div>
                  <h3 className="text-xl font-black mb-2">{toTitleCase(client?.name || '')}</h3>
                  <div className="space-y-3 mb-8">
                    <p className="text-text-muted text-sm flex items-center gap-3">
                      <Phone size={16} className="text-accent" /> {client?.phone}
                    </p>
                    {client?.email && (
                      <p className="text-text-muted text-sm flex items-center gap-3">
                        <Mail size={16} className="text-accent" /> {client?.email}
                      </p>
                    )}
                  </div>
                  <div className="pt-6 border-t border-border-custom flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-text-muted">Total de Agendamentos</span>
                    <span className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center font-black text-accent">
                      {appointments.filter(a => a.phone === client?.phone).length}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="perfil"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl"
            >
              <div className="bg-surface border border-border-custom rounded-[2.5rem] p-10 space-y-8">
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-accent/10 flex items-center justify-center text-accent font-black text-4xl overflow-hidden border-2 border-accent/20">
                    {editingProf?.photo ? (
                      <img src={editingProf.photo} className="w-full h-full object-cover" />
                    ) : (
                      editingProf?.initials
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">URL da Foto</label>
                      <input 
                        type="text" 
                        value={editingProf?.photo || ''}
                        onChange={(e) => setEditingProf({ ...editingProf!, photo: e.target.value })}
                        className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nome</label>
                    <input 
                      type="text" 
                      value={editingProf?.name || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, name: e.target.value })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Cargo</label>
                    <input 
                      type="text" 
                      value={editingProf?.role || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, role: e.target.value })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
                    <input 
                      type="email" 
                      value={editingProf?.email || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, email: e.target.value })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Senha</label>
                    <input 
                      type="text" 
                      value={editingProf?.password || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, password: e.target.value })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">CPF</label>
                    <input 
                      type="text" 
                      value={editingProf?.cpf || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, cpf: maskCPF(e.target.value) })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Data de Nascimento</label>
                    <input 
                      type="text" 
                      value={editingProf?.dob ? (editingProf.dob.includes('-') ? editingProf.dob.split('-').reverse().join('/') : editingProf.dob) : ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, dob: maskDate(e.target.value) })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Bio</label>
                    <textarea 
                      value={editingProf?.bio || ''}
                      onChange={(e) => setEditingProf({ ...editingProf!, bio: e.target.value })}
                      className="w-full bg-background border-2 border-border-custom rounded-xl px-4 py-3 focus:border-accent outline-none transition-all font-bold min-h-[120px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full bg-accent text-background py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
