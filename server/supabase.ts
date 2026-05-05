import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseServiceRoleKey);

if (!isConfigured) {
  console.warn('WARNING: Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set. Database features will return empty results.');
}

function createMockSupabase(): any {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' }, count: 0 };
  const chainable: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return (..._args: any[]) => chainable;
    }
  });

  const mockQuery: any = new Proxy(Promise.resolve(mockResponse), {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return target[prop as keyof typeof target].bind(target);
      }
      return (..._args: any[]) => mockQuery;
    }
  });

  return {
    from: (_table: string) => ({
      select: (..._args: any[]) => mockQuery,
      insert: (..._args: any[]) => mockQuery,
      update: (..._args: any[]) => mockQuery,
      delete: () => mockQuery,
      upsert: (..._args: any[]) => mockQuery,
    }),
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    channel: (_name: string) => ({
      on: (..._args: any[]) => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
    removeChannel: () => {},
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
}

export const supabase: SupabaseClient | any = isConfigured
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createMockSupabase();

export const supabaseAnon: SupabaseClient | any = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })
  : createMockSupabase();
