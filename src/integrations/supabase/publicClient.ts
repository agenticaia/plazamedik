import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Cliente público para el frontend. Usa la URL y la llave anónima públicas del backend.
const SUPABASE_URL = 'https://pvgcrywkxzbgeywwhyqm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NyeXdreHpiZ2V5d3doeXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjY2NDUsImV4cCI6MjA3OTE0MjY0NX0.TUKAVhu5veF3DxYRJdrYM3IE0l4zWE5w8yia2knx5UM';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
