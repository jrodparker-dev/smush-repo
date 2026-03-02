/**
 * Merge strategy:
 * - Official Showdown files are the base.
 * - DH2 files are treated as targeted overrides.
 * - Objects deep-merge, arrays replace (for deterministic custom data behavior).
 */

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const merged = {...base};
  for (const [key, value] of Object.entries(override)) {
    if (key in merged) {
      merged[key] = deepMerge(merged[key], value);
    } else {
      merged[key] = isPlainObject(value) ? deepMerge({}, value) : value;
    }
  }

  return merged;
}

/**
 * Normalizes line endings and trims trailing whitespace so hash + diff checks
 * focus on meaningful changes in data files.
 */
export function normalizeSourceText(source) {
  return source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n');
}
