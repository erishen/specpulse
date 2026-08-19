/**
 * Runtime URL sanitization, mirroring the compile-time whitelist in
 * src/generator/reactGenerator.ts so the dynamic export / any spec.json is
 * hardened even if a spec was never run through the generator.
 */
export function sanitizeUrl(value: string): string {
  const v = String(value ?? '').trim();
  if (/^https?:/i.test(v)) return v;
  if (/^blob:/i.test(v)) return v;
  if (/^data:image\//i.test(v)) return v;
  if (v.startsWith('#')) return v;
  if (/^\.{0,2}\//.test(v)) return v;
  return '';
}
