import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'js', 'supabase-config.js');

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error(
    'Faltan variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY.\n' +
      'Configúralas en Netlify → Site configuration → Environment variables.'
  );
  process.exit(1);
}

const content = `// Generado en build — no editar a mano en producción
window.SUPABASE_URL = ${JSON.stringify(url)};
window.SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

writeFileSync(outPath, content, 'utf8');
console.log('OK: js/supabase-config.js generado para el deploy.');
