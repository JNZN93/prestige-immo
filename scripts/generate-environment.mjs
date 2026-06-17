import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envDir = join(root, 'src/environments');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NG_APP_SUPABASE_URL ||
  'https://YOUR_PROJECT.supabase.co';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NG_APP_SUPABASE_ANON_KEY ||
  'YOUR_ANON_KEY';

const environmentProd = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
}
`;

writeFileSync(join(envDir, 'environment.prod.ts'), environmentProd);

const configured =
  supabaseUrl !== 'https://YOUR_PROJECT.supabase.co' && supabaseAnonKey !== 'YOUR_ANON_KEY';

console.log(
  configured
    ? '✓ environment.prod.ts generated with Supabase config'
    : '⚠ environment.prod.ts generated with placeholders',
);
