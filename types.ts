export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  icon: string;
  description?: string;
  includes?: string[];
  image?: string;
  category?: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  initials: string;
  email?: string;
  password?: string;
  photo?: string;
  bio?: string;
  specialties?: string[];
  showInVitrine: boolean;
  cpf?: string;
  dob?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'done' | 'cancelled';

export interface Appointment {
  id: number;
  name: string;
  phone: string;
  email?: string;
  serviceId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  profName: string;
  profId: string;
  paid: boolean;
  discount: number;
  finalPrice: number;
  client_id?: string;
}

export interface Client {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  dob?: string;
  gender?: string;
  children?: string;
  profession?: string;
  photo?: string;
}

export interface Review {
  id?: number;
  client_cpf: string;
  client_name: string;
  service_id: number;
  stars: number;
  comment: string;
  created_at?: string;
}

export interface FAQItem {
  id?: number;
  q: string;
  a: string;
}

export interface WorkingHours {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface CarouselSlide {
  id: number;
  image: string;
  title?: string;
  subtitle?: string;
  order: number;
  titleColor?: string;
  titleAlign?: 'left' | 'center' | 'right';
  titleFont?: string;
  discountBadgeText?: string;
  showDiscountBadge?: boolean;
}
