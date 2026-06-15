import crypto from "crypto";

// Autenticación ligera del VENDEDOR (independiente de NextAuth, que es del rifero).
// El vendedor entra con teléfono + accessCode (route handler) y recibe una cookie
// httpOnly firmada con HMAC; aquí firmamos/verificamos sin dependencias extra.

const SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
export const VENDOR_COOKIE = "rf_vendor";

export function signVendorToken(vendorId: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(vendorId).digest("base64url");
  return `${vendorId}.${sig}`;
}

export function verifyVendorToken(token?: string | null): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const vendorId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(vendorId).digest("base64url");
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return vendorId;
}

// Extrae el vendorId verificado desde la cookie del request (fetch Request o NextApiRequest).
export function getVendorIdFromReq(req: unknown): string | null {
  const r = req as { headers?: { get?: (k: string) => string | null; cookie?: string } };
  const cookieStr =
    (typeof r?.headers?.get === "function" ? r.headers.get("cookie") : r?.headers?.cookie) ?? "";
  if (!cookieStr) return null;
  for (const part of cookieStr.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    if (k === VENDOR_COOKIE) {
      return verifyVendorToken(decodeURIComponent(part.slice(idx + 1).trim()));
    }
  }
  return null;
}

// Código de acceso corto y legible (sin caracteres ambiguos).
export function generateAccessCode(len = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
