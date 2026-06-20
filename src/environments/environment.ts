export const environment = {
  production: false,
  supabaseUrl: 'https://vvdzmkirnaxxqcmctrsf.supabase.co',
  supabaseAnonKey: 'sb_publishable_mMOraOiAzaTGXG-dNiaCuA_78zHHuw0',
  /** Optional CDN base for hero frames, e.g. Supabase Storage public URL. */
  heroFramesBaseUrl: null as string | null,
};

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(environment.supabaseUrl && environment.supabaseAnonKey) &&
    !environment.supabaseUrl.includes('YOUR_PROJECT') &&
    environment.supabaseAnonKey !== 'YOUR_ANON_KEY'
  );
}
