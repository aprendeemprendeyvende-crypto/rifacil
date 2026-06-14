// Generación de los números (boletos) de una rifa. Client-safe (pura, sin deps nativas).
// La usa el raffleRouter al crear una rifa para insertar los RaffleNumber.

export interface GenerateNumbersOptions {
  /** Plantilla de relleno con ceros, ej. "000" → 3 dígitos. Define el ancho mínimo. */
  format?: string;
  /** Cantidad total de números a generar. */
  total: number;
  /** Prefijo opcional, ej. "A-" → "A-000". */
  prefix?: string;
  /** Sufijo opcional, ej. "-VE" → "000-VE". */
  suffix?: string;
}

/**
 * Genera `total` números correlativos desde 0 hasta `total - 1`, rellenados con
 * ceros a la izquierda. El ancho es el mayor entre la longitud de `format` y la
 * cantidad de dígitos que necesita el número más alto (así nunca se trunca).
 *
 * Ej: { format: "000", total: 1000 } → ["000", "001", ..., "999"]
 *     { format: "000", total: 100 }  → ["000", "001", ..., "099"]
 */
export function generateNumbers({
  format = "000",
  total,
  prefix = "",
  suffix = "",
}: GenerateNumbersOptions): string[] {
  const safeTotal = Math.max(0, Math.floor(total));
  if (safeTotal === 0) return [];

  const width = Math.max(format.length, String(safeTotal - 1).length);

  const numbers = new Array<string>(safeTotal);
  for (let i = 0; i < safeTotal; i++) {
    numbers[i] = `${prefix}${String(i).padStart(width, "0")}${suffix}`;
  }
  return numbers;
}
