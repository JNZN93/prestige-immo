export const environment = {
  production: false,
  supabaseUrl: 'https://vvdzmkirnaxxqcmctrsf.supabase.co',
  supabaseAnonKey: 'sb_publishable_mMOraOiAzaTGXG-dNiaCuA_78zHHuw0',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
}
