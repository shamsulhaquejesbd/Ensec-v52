import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ykljdwdkgysnekiqqaby.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-ij_EEVGDNaAD834Nac1Iw_4nq2Iafr';
const STORAGE_KEY_URL = 'ensec_supabase_url';
const STORAGE_KEY_ANON = 'ensec_supabase_anon_key';
const STORAGE_PROJECT_ID_KEY = 'ensec_supabase_configured_project_id';
const CURRENT_PROJECT_ID = 'ykljdwdkgysnekiqqaby';

// Sync localStorage with environment variables if present
if (typeof window !== 'undefined') {
  try {
    const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string)?.trim();
    const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string)?.trim();
    if (envUrl && envUrl.startsWith('http') && envKey && envKey.length > 10) {
      const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
      if (savedUrl !== envUrl) {
        localStorage.setItem(STORAGE_KEY_URL, envUrl);
        localStorage.setItem(STORAGE_KEY_ANON, envKey);
        localStorage.removeItem('ensec_products');
        localStorage.removeItem('ensec_product_categories');
      }
    } else {
      const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
      const savedAnon = localStorage.getItem(STORAGE_KEY_ANON);
      const savedProjectId = localStorage.getItem(STORAGE_PROJECT_ID_KEY);
      const isUrlInvalid = !savedUrl || !savedUrl.startsWith('http') || savedUrl.includes('xyzproject') || savedUrl.includes('rcngtmnqukrudueendns');
      const isAnonInvalid = !savedAnon || savedAnon.trim().length < 10 || savedAnon === 'your-anon-key' || savedAnon === 'undefined' || savedAnon === 'null' || savedAnon.includes('sb_publishable_yJIfJO');
      if (!savedUrl || isUrlInvalid || isAnonInvalid || savedProjectId !== CURRENT_PROJECT_ID) {
        localStorage.setItem(STORAGE_KEY_URL, DEFAULT_SUPABASE_URL);
        localStorage.setItem(STORAGE_KEY_ANON, DEFAULT_SUPABASE_ANON_KEY);
        localStorage.setItem(STORAGE_PROJECT_ID_KEY, CURRENT_PROJECT_ID);
        localStorage.removeItem('ensec_products');
        localStorage.removeItem('ensec_product_categories');
        localStorage.removeItem('ensec_product_brands');
      }
    }
  } catch (e) {
    console.warn('Supabase localStorage notice:', e);
  }
}

export const getSupabaseUrl = (): string => {
  const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string)?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    if (saved && saved.startsWith('http') && saved !== 'undefined' && saved !== 'null') return saved.trim();
  }
  return DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string)?.trim();
  if (envKey && envKey.length > 10) {
    return envKey;
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_ANON);
    if (saved && saved.trim().length > 10 && saved !== 'undefined' && saved !== 'null') return saved.trim();
  }
  return DEFAULT_SUPABASE_ANON_KEY;
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const checkSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
};

export const isSupabaseConfigured: boolean = checkSupabaseConfigured();

export const supabase = getSupabase();

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();
    localStorage.setItem(STORAGE_KEY_URL, trimmedUrl);
    localStorage.setItem(STORAGE_KEY_ANON, trimmedKey);
    const match = trimmedUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projId = match ? match[1] : trimmedUrl;
    localStorage.setItem(STORAGE_PROJECT_ID_KEY, projId);
    // Invalidate local cached datasets so new database tables are loaded cleanly
    localStorage.removeItem('ensec_product_categories');
    localStorage.removeItem('ensec_products');
    localStorage.removeItem('ensec_product_brands');
    cachedClient = null;
    window.dispatchEvent(new Event('ensec-supabase-config-changed'));
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    localStorage.removeItem(STORAGE_PROJECT_ID_KEY);
    localStorage.removeItem('ensec_product_categories');
    localStorage.removeItem('ensec_products');
    localStorage.removeItem('ensec_product_brands');
    cachedClient = null;
    window.dispatchEvent(new Event('ensec-supabase-config-changed'));
  }
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const client = createClient(url.trim(), anonKey.trim());
    const { error } = await client.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      if (error.message && error.message.includes('fetch')) {
        return { success: false, message: `Network/CORS error: ${error.message}` };
      }
      if (error.code === '42P01') {
        return { success: true, message: 'Connected to Supabase! (Database tables need migration).' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.' };
  }
};

export const testProductsTableConnection = async (
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; tableExists: boolean; rowCount?: number }> => {
  try {
    const client = url && anonKey ? createClient(url.trim(), anonKey.trim()) : getSupabase();
    if (!client) {
      return { success: false, message: 'Supabase client is not configured.', tableExists: false };
    }
    const { data, count, error } = await client.from('products').select('id', { count: 'exact' }).limit(1);
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('relation "public.products" does not exist'))) {
        return { success: true, message: 'Connected to Supabase! But the "products" table does not exist yet. Please execute the SQL schema in the SQL Editor.', tableExists: false };
      }
      if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
        return { success: false, message: `Permission / RLS error on "products" table: ${error.message}. Enable public access policy in SQL Editor.`, tableExists: true };
      }
      return { success: false, message: `Supabase error: ${error.message}`, tableExists: false };
    }
    const rowCount = count !== null ? count : (data?.length || 0);
    return { success: true, message: `Connected to Supabase! "products" table is online (${rowCount} total products currently stored).`, tableExists: true, rowCount };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.', tableExists: false };
  }
};

export const testCategoriesTableConnection = async (
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string; tableExists: boolean; rowCount?: number }> => {
  try {
    const client = url && anonKey ? createClient(url.trim(), anonKey.trim()) : getSupabase();
    if (!client) {
      return { success: false, message: 'Supabase client is not configured.', tableExists: false };
    }
    const { data, count, error } = await client.from('product_categories').select('id', { count: 'exact' });
    if (error) {
      if (error.code === '42P01' || (error.message && error.message.includes('relation "public.product_categories" does not exist'))) {
        return { success: true, message: 'Connected to Supabase! But "product_categories" table does not exist yet. Please run the table schema from supabase_schema.sql in the SQL Editor.', tableExists: false };
      }
      if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
        return { success: false, message: `Permission / RLS error on "product_categories" table: ${error.message}. Please enable public SELECT policy in SQL Editor.`, tableExists: true };
      }
      return { success: false, message: `Supabase error: ${error.message}`, tableExists: false };
    }
    const rowCount = count !== null ? count : (data?.length || 0);
    return { success: true, message: `Connected to Supabase! "product_categories" table is online (${rowCount} categories currently stored).`, tableExists: true, rowCount };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed.', tableExists: false };
  }
};


