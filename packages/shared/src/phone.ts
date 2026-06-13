import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Normalización de teléfonos para Riffas.
 *
 * Problema que resuelve: la v1 de Kimi hacía `normalizePhone(phone, "CO")` con
 * Colombia FIJA. La base real es ~80% venezolana (0424/0414/0412/0416/0426 -> +58),
 * con minorías de CO (+57), CL (+569), PE (+519), EC (+593), ES (+34).
 *
 * Estrategia:
 *  1. Si el número ya viene en formato internacional (+...), se respeta su país.
 *  2. Si viene local (empieza por 0 o sin código), se asume `defaultCountry` (VE por defecto).
 *  3. Devuelve E.164 (`+58412...`) o `null` si no es un teléfono válido.
 */

// Prefijos internacionales detectables -> país (para decidir sin depender solo del default)
const INTL_PREFIX_TO_COUNTRY: Array<[string, CountryCode]> = [
  ["+58", "VE"],
  ["+57", "CO"],
  ["+569", "CL"],
  ["+56", "CL"],
  ["+51", "PE"],
  ["+593", "EC"],
  ["+34", "ES"],
  ["+1", "US"],
];

function guessCountryFromIntl(raw: string): CountryCode | undefined {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return undefined;
  for (const [prefix, country] of INTL_PREFIX_TO_COUNTRY) {
    if (cleaned.startsWith(prefix)) return country;
  }
  return undefined;
}

/**
 * Normaliza un único número a E.164. Default: Venezuela.
 */
export function normalizePhone(
  raw: string,
  defaultCountry: CountryCode = "VE"
): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();

  // País por prefijo internacional si existe; si no, el default.
  const country = guessCountryFromIntl(cleaned) ?? defaultCountry;

  try {
    const parsed = parsePhoneNumberFromString(cleaned, country);
    if (parsed && parsed.isValid()) return parsed.number; // E.164
  } catch {
    /* cae al fallback */
  }

  // Fallback para locales venezolanos tipo "04241234567" o "4241234567"
  const digits = cleaned.replace(/\D/g, "");
  if (defaultCountry === "VE") {
    if (/^0?4\d{9}$/.test(digits)) {
      const local = digits.replace(/^0/, "");
      return `+58${local}`;
    }
  }
  return null;
}

/**
 * Un mismo campo de Google Contacts puede traer varios números:
 *   "+584124373068 ::: +58 412-4373068"  -> separados por ":::", "/", ","
 * Esta función los separa, normaliza y deduplica.
 */
export function splitAndNormalizePhones(
  rawField: string,
  defaultCountry: CountryCode = "VE"
): string[] {
  if (!rawField) return [];
  const parts = rawField.split(/:::|\/|,|;/g);
  const out = new Set<string>();
  for (const p of parts) {
    const n = normalizePhone(p, defaultCountry);
    if (n) out.add(n);
  }
  return [...out];
}

/** País ISO a partir del E.164 (para guardar Contact.country correctamente). */
export function countryFromE164(e164: string): CountryCode | "XX" {
  return guessCountryFromIntl(e164) ?? "XX";
}
