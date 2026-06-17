export const environment = {
  production: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
}
