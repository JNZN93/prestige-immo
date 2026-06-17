import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = readFileSync(join(root, 'src/environments/environment.ts'), 'utf8');

const supabaseUrl = envFile.match(/supabaseUrl:\s*['"]([^'"]+)['"]/)?.[1] ?? '';
const supabaseAnonKey = envFile.match(/supabaseAnonKey:\s*['"]([^'"]+)['"]/)?.[1] ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ supabaseUrl oder supabaseAnonKey fehlt in src/environments/environment.ts');
  process.exit(1);
}

console.log('🔗 Projekt:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data, error } = await supabase
  .from('properties')
  .select('id, title, published')
  .limit(5);

if (error) {
  if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
    console.log('\n⚠️  Tabelle "properties" existiert noch nicht.');
    console.log('\nNächster Schritt:');
    console.log('1. Öffne den SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]}/sql/new`);
    console.log('2. Kopiere den Inhalt von supabase/schema.sql');
    console.log('3. Klicke auf "Run"');
    console.log('4. Führe dieses Script erneut aus: npm run verify:supabase');
    process.exit(1);
  }

  console.error('❌ Fehler:', error.message);
  process.exit(1);
}

console.log(`\n✅ Verbindung OK — ${data.length} Inserat(e) gefunden:`);
for (const row of data) {
  console.log(`   • ${row.title} (${row.published ? 'veröffentlicht' : 'Entwurf'})`);
}

const { error: bucketError } = await supabase.storage.from('property-images').list('', { limit: 1 });

if (bucketError) {
  console.log('\n⚠️  Storage-Bucket "property-images" fehlt noch — schema.sql ausführen.');
} else {
  console.log('\n✅ Storage-Bucket "property-images" ist bereit.');
}

console.log('\n📋 Noch offen (falls noch nicht erledigt):');
console.log('   • Betreiber-User anlegen: Dashboard → Authentication → Users → Add user');
console.log('   • Login testen: http://localhost:4200/admin/login');
