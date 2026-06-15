import { type NextRequest } from "next/server";
import { prisma } from "@riffas/db";
import { normalizePhone } from "@riffas/shared";
import { signVendorToken, VENDOR_COOKIE } from "@riffas/api/src/lib/vendorAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Login del vendedor: teléfono + código de acceso. Setea cookie httpOnly firmada.
export async function POST(req: NextRequest) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Petición inválida" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "", "VE");
  const code = (body.code ?? "").trim().toUpperCase();
  if (!phone || !code) {
    return Response.json({ error: "Ingresa teléfono y código" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findFirst({
    where: { phone, accessCode: code, active: true },
    select: { id: true },
  });
  if (!vendor) {
    return Response.json({ error: "Teléfono o código incorrectos" }, { status: 401 });
  }

  const token = signVendorToken(vendor.id);
  const maxAge = 60 * 60 * 24 * 30; // 30 días
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${VENDOR_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
    },
  });
}
