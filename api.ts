import { supabase } from './supabase';
import { Service, Professional, Appointment, AppointmentStatus, CarouselSlide, FAQItem, WorkingHours, Client, Review } from '../types';

export const api = {
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getProfessionals(): Promise<Professional[]> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      initials: p.initials,
      email: p.email,
      password: p.password,
      photo: p.photo,
      bio: p.bio,
      specialties: p.specialties,
      showInVitrine: p.show_in_vitrine,
      cpf: p.cpf,
      dob: p.dob
    }));
  },

  async upsertProfessional(prof: Partial<Professional>): Promise<void> {
    let dob = prof.dob;
    if (dob && dob.includes('/')) {
      const [day, month, year] = dob.split('/');
      dob = `${year}-${month}-${day}`;
    }

    const payload: any = {
      name: prof.name,
      role: prof.role,
      initials: prof.initials,
      email: prof.email,
      password: prof.password,
      photo: prof.photo,
      bio: prof.bio,
      specialties: prof.specialties,
      show_in_vitrine: prof.showInVitrine ?? true,
      cpf: prof.cpf ? prof.cpf.replace(/\D/g, '') : undefined,
      dob: dob
    };

    if (prof.id) {
      const { error } = await supabase
        .from('professionals')
        .update(payload)
        .eq('id', prof.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('professionals')
        .insert([payload]);
      if (error) throw error;
    }
  },

  async verifyProfessionalForRecovery(email: string, cpf: string, dob: string): Promise<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    let cleanDob = dob;
    if (cleanDob && cleanDob.includes('/')) {
      const [day, month, year] = cleanDob.split('/');
      cleanDob = `${year}-${month}-${day}`;
    }

    const { data, error } = await supabase
      .from('professionals')
      .select('id')
      .eq('email', email)
      .eq('cpf', cleanCpf)
      .eq('dob', cleanDob)
      .single();
    
    if (error) return false;
    return !!data;
  },

  async resetProfessionalPassword(email: string, newPassword: string): Promise<void> {
    const { error } = await supabase
      .from('professionals')
      .update({ password: newPassword })
      .eq('email', email);
    
    if (error) throw error;
  },

  async deleteProfessional(id: string): Promise<void> {
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getAppointmentsByProfessional(profId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('prof_id', profId)
      .order('date', { ascending: false })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      email: a.email,
      serviceId: a.service_id,
      date: a.date,
      time: a.time,
      status: a.status,
      profName: a.prof_name,
      profId: a.prof_id,
      paid: a.paid,
      discount: a.discount,
      finalPrice: a.final_price,
      client_id: a.client_id
    }));
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    console.log('API: Criando agendamento:', appointment);
    const cleanClientId = appointment.client_id ? appointment.client_id.replace(/\D/g, '') : appointment.phone.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        name: appointment.name,
        phone: appointment.phone,
        email: appointment.email,
        service_id: appointment.serviceId,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        prof_name: appointment.profName,
        prof_id: appointment.profId,
        paid: appointment.paid,
        discount: appointment.discount,
        final_price: appointment.finalPrice,
        client_id: cleanClientId
      }])
      .select()
      .single();
    
    if (error) {
      console.error('API: Erro ao criar agendamento:', error);
      throw error;
    }
    return data;
  },

  async getBookedSlots(profId: string, date: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('prof_id', profId)
      .eq('date', date)
      .not('status', 'eq', 'cancelled');
    
    if (error) throw error;
    return (data || []).map(a => a.time);
  },

  async getAllAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      email: a.email,
      serviceId: a.service_id,
      date: a.date,
      time: a.time,
      status: a.status,
      profName: a.prof_name,
      profId: a.prof_id,
      paid: a.paid,
      discount: a.discount,
      finalPrice: a.final_price,
      client_id: a.client_id
    }));
  },

  async getAppointmentsByClientId(clientId: string): Promise<Appointment[]> {
    const cleanId = clientId.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', cleanId)
      .order('date', { ascending: false })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      name: a.name,
      phone: a.phone,
      email: a.email,
      serviceId: a.service_id,
      date: a.date,
      time: a.time,
      status: a.status,
      profName: a.prof_name,
      profId: a.prof_id,
      paid: a.paid,
      discount: a.discount,
      finalPrice: a.final_price,
      client_id: a.client_id
    }));
  },

  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteAppointment(id: number): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertService(service: Partial<Service>): Promise<void> {
    const payload: any = {
      name: service.name,
      duration: service.duration,
      price: service.price,
      icon: service.icon,
      description: service.description,
      includes: service.includes,
      image: service.image,
      category: service.category
    };

    if (service.id) {
      const { error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', service.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('services')
        .insert([payload]);
      if (error) throw error;
    }
  },

  async deleteService(id: number): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCarouselSlides(): Promise<CarouselSlide[]> {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      image: s.image,
      title: s.title,
      subtitle: s.subtitle,
      order: s.order,
      titleColor: s.title_color,
      titleAlign: s.title_align,
      titleFont: s.title_font,
      discountBadgeText: s.discount_badge_text,
      showDiscountBadge: s.show_discount_badge
    }));
  },

  async upsertCarouselSlide(slide: Partial<CarouselSlide>): Promise<void> {
    const payload: any = {
      image: slide.image,
      title: slide.title || null,
      subtitle: slide.subtitle || null,
      order: slide.order || 0,
      title_color: slide.titleColor || '#ffffff',
      title_align: slide.titleAlign || 'center',
      title_font: slide.titleFont || 'sans',
      discount_badge_text: slide.discountBadgeText || null,
      show_discount_badge: slide.showDiscountBadge ?? false
    };

    if (slide.id) {
      payload.id = slide.id;
    }

    const { error } = await supabase
      .from('carousel_slides')
      .upsert(payload);
    
    if (error) {
      console.error('Supabase error in upsertCarouselSlide:', error);
      throw error;
    }
  },

  async deleteCarouselSlide(id: number): Promise<void> {
    const { error } = await supabase
      .from('carousel_slides')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getFAQs(): Promise<FAQItem[]> {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async upsertFAQ(faq: Partial<FAQItem>): Promise<void> {
    const payload: any = {
      q: faq.q,
      a: faq.a
    };

    if (faq.id) {
      const { error } = await supabase
        .from('faqs')
        .update(payload)
        .eq('id', faq.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('faqs')
        .insert([payload]);
      if (error) throw error;
    }
  },

  async deleteFAQ(id: number): Promise<void> {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getWorkingHours(): Promise<WorkingHours[]> {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async upsertWorkingHours(hours: WorkingHours[]): Promise<void> {
    // Strip id from payload to avoid identity column conflicts
    const payload = hours.map(({ id, ...rest }) => rest);
    
    const { error } = await supabase
      .from('working_hours')
      .upsert(payload, { onConflict: 'day_of_week' });
    
    if (error) throw error;
  },

  // Client Operations
  async getClientByCpf(cpf: string): Promise<Client | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    console.log('API: Buscando cliente por CPF:', cleanCpf);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('cpf', cleanCpf)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('API: Nenhum cliente encontrado com este CPF.');
        return null;
      }
      console.error('API: Erro ao buscar cliente:', error);
      throw error;
    }
    return data;
  },

  async upsertClient(client: Partial<Client>): Promise<void> {
    console.log('API: Upserting client:', client);
    const payload: any = {};
    
    const allowedFields = [
      'cpf', 'name', 'email', 'phone', 'password', 'cep', 'street', 
      'number', 'complement', 'neighborhood', 'city', 'state', 
      'dob', 'gender', 'children', 'profession', 'photo'
    ];

    allowedFields.forEach(field => {
      if ((client as any)[field] !== undefined) {
        payload[field] = (client as any)[field];
      }
    });

    if (payload.dob && payload.dob.includes('/')) {
      const [day, month, year] = payload.dob.split('/');
      payload.dob = `${year}-${month}-${day}`;
    }

    if (payload.cpf) {
      payload.cpf = payload.cpf.replace(/\D/g, '');
    }

    if (!payload.cpf) throw new Error('CPF is required for upsert');

    const { error } = await supabase
      .from('clients')
      .upsert(payload, { onConflict: 'cpf' });
    
    if (error) {
      console.error('API: Error in upsertClient:', error);
      throw error;
    }
  },

  async createClient(client: Client): Promise<void> {
    return this.upsertClient(client);
  },

  async updateClient(cpf: string, updates: Partial<Client>): Promise<void> {
    return this.upsertClient({ ...updates, cpf });
  },

  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async deleteClient(cpf: string): Promise<void> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('cpf', cleanCpf);
    
    if (error) throw error;
  },

  async verifyClientForRecovery(cpf: string, dob: string): Promise<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    let cleanDob = dob;
    if (cleanDob && cleanDob.includes('/')) {
      const [day, month, year] = cleanDob.split('/');
      cleanDob = `${year}-${month}-${day}`;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('cpf')
      .eq('cpf', cleanCpf)
      .eq('dob', cleanDob)
      .single();
    
    if (error) return false;
    return !!data;
  },

  async resetClientPassword(cpf: string, newPassword: string): Promise<void> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const { error } = await supabase
      .from('clients')
      .update({ password: newPassword })
      .eq('cpf', cleanCpf);
    
    if (error) throw error;
  },

  // Review Operations
  async getReviews(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createReview(review: Review): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .insert([review]);
    
    if (error) throw error;
  },

  // Settings Operations
  async getSettings(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data.value;
  },

  async updateSettings(key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });
    
    if (error) throw error;
  }
};
