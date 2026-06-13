import Papa from "papaparse";
import {
  splitAndNormalizePhones,
  countryFromE164,
} from "./phone";
import type { CountryCode } from "libphonenumber-js";

/**
 * Parser de la exportación REAL de Google Contacts (Google CSV).
 *
 * Resuelve lo que el `importCSV` de Kimi NO hacía:
 *  - Concatena First + Middle + Last Name (limpiando espacios dobles).
 *  - Lee TODAS las columnas "Phone N - Value" y separa los múltiples por ":::".
 *  - Normaliza a E.164 con default Venezuela (no Colombia).
 *  - Deduplica por teléfono; teléfonos extra van a `notes`.
 *
 * Devuelve filas con la forma que ya espera el endpoint `contact.importCSV`:
 *   { name, phone, email?, city?, tags?, notes? }
 *
 * Úsalo en el cliente (al subir el archivo) antes de llamar al endpoint, o
 * en un worker. Es isomórfico (no usa APIs del navegador).
 */

export interface ParsedContact {
  name: string;
  phone: string; // E.164 primario
  email?: string | null;
  city?: string | null;
  country?: string;
  tags?: string[];
  notes?: string | null;
  extraPhones?: string[];
}

export interface ParseResult {
  contacts: ParsedContact[];
  stats: {
    totalRows: number;
    withValidPhone: number;
    duplicatesMerged: number;
    invalid: number;
    extraPhonesFound: number;
  };
}

function clean(s?: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function buildName(row: Record<string, string>): string {
  const parts = [
    row["First Name"],
    row["Middle Name"],
    row["Last Name"],
  ]
    .map(clean)
    .filter(Boolean);
  const joined = parts.join(" ").trim();
  // Fallbacks si el contacto no tiene nombre estructurado
  return (
    joined ||
    clean(row["File As"]) ||
    clean(row["Organization Name"]) ||
    clean(row["Nickname"]) ||
    "Sin nombre"
  );
}

function collectPhoneFields(row: Record<string, string>): string {
  // Google numera: "Phone 1 - Value", "Phone 2 - Value", ...
  const values: string[] = [];
  for (const key of Object.keys(row)) {
    if (/^Phone \d+ - Value$/.test(key) && row[key]) values.push(row[key]);
  }
  return values.join(" ::: ");
}

export function parseGoogleContacts(
  csvText: string,
  opts: { defaultCountry?: CountryCode; tag?: string } = {}
): ParseResult {
  const defaultCountry = opts.defaultCountry ?? "VE";
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const byPhone = new Map<string, ParsedContact>();
  const stats = {
    totalRows: data.length,
    withValidPhone: 0,
    duplicatesMerged: 0,
    invalid: 0,
    extraPhonesFound: 0,
  };

  for (const row of data) {
    const allPhonesRaw = collectPhoneFields(row);
    const phones = splitAndNormalizePhones(allPhonesRaw, defaultCountry);

    if (phones.length === 0) {
      stats.invalid++;
      continue;
    }

    const [primary, ...extras] = phones;
    if (extras.length) stats.extraPhonesFound += extras.length;

    const email =
      clean(row["E-mail 1 - Value"]) || clean(row["E-mail 2 - Value"]) || null;
    const contact: ParsedContact = {
      name: buildName(row),
      phone: primary,
      email: email || null,
      country: countryFromE164(primary),
      tags: opts.tag ? [opts.tag] : [],
      notes: extras.length ? `Otros teléfonos: ${extras.join(", ")}` : null,
      extraPhones: extras,
    };

    if (byPhone.has(primary)) {
      stats.duplicatesMerged++;
      // conserva el nombre más largo / con más info
      const prev = byPhone.get(primary)!;
      if (contact.name.length > prev.name.length) prev.name = contact.name;
      if (!prev.email && contact.email) prev.email = contact.email;
    } else {
      byPhone.set(primary, contact);
      stats.withValidPhone++;
    }
  }

  return { contacts: [...byPhone.values()], stats };
}
