// Reeksportujemy store
export { useAuthStore, useStore } from './store/index';

// Reeksportujemy operacje bazodanowe
export { dbOperations } from './db/db';

// Reeksportujemy auth
export { auth } from './store/auth';

// Reeksportujemy supabase
export { getSupabase, getSupabaseAdmin } from './api/supabase';

// Reeksportujemy testConnection
export { testConnection } from './db/db'; 