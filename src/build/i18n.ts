import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(
        base[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function loadI18n(
  language: string,
  i18nDir: string,
): Record<string, unknown> {
  const enFile = join(i18nDir, 'en.json');
  const en: Record<string, unknown> = JSON.parse(
    readFileSync(enFile, 'utf8'),
  );
  if (language === 'en') return en;

  const langFile = join(i18nDir, `${language}.json`);
  if (!existsSync(langFile)) return en;

  const lang: Record<string, unknown> = JSON.parse(
    readFileSync(langFile, 'utf8'),
  );
  return deepMerge(en, lang);
}
