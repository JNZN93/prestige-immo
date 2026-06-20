export const environment = {
  production: true,
  supabaseUrl: 'https://vvdzmkirnaxxqcmctrsf.supabase.co',
  supabaseAnonKey: 'sb_publishable_mMOraOiAzaTGXG-dNiaCuA_78zHHuw0',
  heroFramesBaseUrl: null,
};

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(environment.supabaseUrl && environment.supabaseAnonKey) &&
    !environment.supabaseUrl.includes('YOUR_PROJECT') &&
    environment.supabaseAnonKey !== 'YOUR_ANON_KEY'
  );
}
