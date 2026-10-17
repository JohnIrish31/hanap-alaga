import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk('dist');
const totals = {};
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
for (const f of files.sort()) {
  const buf = readFileSync(f), gz = gzipSync(buf, { level: 9 }).length, ext = extname(f).slice(1);
  totals[ext] = totals[ext] || { raw: 0, gz: 0, n: 0 };
  totals[ext].raw += buf.length; totals[ext].gz += gz; totals[ext].n++;
  if (ext !== 'svg') console.log(`${kb(buf.length)} ${kb(gz)} gz  ${f}`);
}
console.log('\nby type:');
for (const [ext, t] of Object.entries(totals)) console.log(`  ${ext.padEnd(5)} ${String(t.n).padStart(3)} files ${kb(t.raw)} ${kb(t.gz)} gz`);
const js = (totals.js?.gz ?? 0) / 1024, css = (totals.css?.gz ?? 0) / 1024;
const ok = js <= 75 && css <= 8;
console.log(`\nbudget: JS ${js.toFixed(1)} / 75 KB gz, CSS ${css.toFixed(1)} / 8 KB gz -> ${ok ? 'OK' : 'OVER BUDGET'}`);
process.exit(ok ? 0 : 1);
