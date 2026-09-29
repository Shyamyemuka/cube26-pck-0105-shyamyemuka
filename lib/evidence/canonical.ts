/**
 * Canonical JSON serialization:
 * - Recursively sorts object keys alphabetically
 * - Drops undefined object properties
 * - Uses exact JSON.stringify for primitives (strings, numbers, booleans, null)
 * - Deterministic representation regardless of key insertion order
 */
export function canonicalJson(obj: unknown): string {
  if (obj === undefined) {
    return '';
  }
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => (item === undefined ? 'null' : canonicalJson(item))).join(',') + ']';
  }

  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();

  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson(record[k]))
      .join(',') +
    '}'
  );
}
