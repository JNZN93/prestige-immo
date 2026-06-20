export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  heroFramesBaseUrl: null as string | null,
};

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(environment.supabaseUrl && environment.supabaseAnonKey) &&
    !environment.supabaseUrl.includes('YOUR_PROJECT') &&
    environment.supabaseAnonKey !== 'YOUR_ANON_KEY'
  );
}
