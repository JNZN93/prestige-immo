import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const framesDir = join(root, 'public/videos/hero-frames');
const bucket = 'hero-frames';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, e.g.\n' +
      'SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run upload:hero-frames',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function uploadHeroFrames() {
  const files = (await readdir(framesDir)).filter((name) => /\.(webp|jpg|json)$/i.test(name));

  if (!files.length) {
    throw new Error('No hero frame assets found. Run npm run extract:hero-frames first.');
  }

  console.log(`Uploading ${files.length} files to bucket "${bucket}"…`);

  for (const name of files) {
    const path = join(framesDir, name);
    const body = await readFile(path);
    const contentType = name.endsWith('.json')
      ? 'application/json'
      : name.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

    const { error } = await supabase.storage.from(bucket).upload(name, body, {
      upsert: true,
      contentType,
      cacheControl: '31536000',
    });

    if (error) {
      throw new Error(`Upload failed for ${name}: ${error.message}`);
    }

    console.log(`  ✓ ${name}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl('manifest.json');
  const publicBase = data.publicUrl.replace(/\/manifest\.json$/, '');

  console.log('\nUpload complete.');
  console.log('Set in environment (production):');
  console.log(`  heroFramesBaseUrl: '${publicBase}'`);
  console.log('\nOr update manifest.json baseUrl to the same value.');
}

uploadHeroFrames().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
