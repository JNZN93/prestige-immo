import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envDir = join(root, 'src/environments');

function readDevEnvironment() {
  try {
    const envFile = readFileSync(join(envDir, 'environment.ts'), 'utf8');
    const supabaseUrl = envFile.match(/supabaseUrl:\s*['"]([^'"]+)['"]/)?.[1] ?? '';
    const supabaseAnonKey = envFile.match(/supabaseAnonKey:\s*['"]([^'"]+)['"]/)?.[1] ?? '';
    return { supabaseUrl, supabaseAnonKey };
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '' };
  }
}

const dev = readDevEnvironment();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NG_APP_SUPABASE_URL ||
  (dev.supabaseUrl.includes('YOUR_PROJECT') ? '' : dev.supabaseUrl) ||
  'https://YOUR_PROJECT.supabase.co';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NG_APP_SUPABASE_ANON_KEY ||
  (dev.supabaseAnonKey === 'YOUR_ANON_KEY' ? '' : dev.supabaseAnonKey) ||
  'YOUR_ANON_KEY';

const heroFramesBaseUrl = process.env.HERO_FRAMES_BASE_URL || null;

const environmentProd = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
  heroFramesBaseUrl: ${heroFramesBaseUrl ? `'${heroFramesBaseUrl}'` : 'null'},
};

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(environment.supabaseUrl && environment.supabaseAnonKey) &&
    !environment.supabaseUrl.includes('YOUR_PROJECT') &&
    environment.supabaseAnonKey !== 'YOUR_ANON_KEY'
  );
}
`;

writeFileSync(join(envDir, 'environment.prod.ts'), environmentProd);

const configured =
  supabaseUrl !== 'https://YOUR_PROJECT.supabase.co' && supabaseAnonKey !== 'YOUR_ANON_KEY';

console.log(
  configured
    ? '✓ environment.prod.ts generated with Supabase config'
    : '⚠ environment.prod.ts generated with placeholders — set SUPABASE_URL and SUPABASE_ANON_KEY',
);

if (!configured && process.env.VERCEL) {
  console.error('\n❌ Vercel build: Supabase credentials missing.');
  console.error('   Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables.');
  process.exit(1);
}
