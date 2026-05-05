import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database Types
export interface Department {
  id: string;
  name: string;
  slug: string;
  department_id: string;
  password: string;
  head_name?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  panel_link: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentData {
  id: string;
  department_id: string;
  data_type: string;
  title: string;
  content: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  priority: string;
  department_id?: string;
  created_by?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date?: string;
  location?: string;
  department_id?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollegeSettings {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}
