import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Credenciais do Supabase não encontradas!');
  console.info('Para corrigir: Vá em "Settings" -> "Secrets" no AI Studio e adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co',
  supabaseAnonKey || 'missing-key'
);
