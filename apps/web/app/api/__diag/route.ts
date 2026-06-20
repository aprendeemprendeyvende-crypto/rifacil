// TEMP: diag endpoint para verificar a qué base pega este deployment.
// Removerlo antes de mergear a main.
import { NextResponse } from "next/server";
import { prisma } from "@riffas/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const hostMatch = dbUrl.match(/@([^/:?]+)/);
  const host = hostMatch ? hostMatch[1] : "<missing DATABASE_URL>";
  const base =
    host.includes("ep-icy-cloud-atvrnhuf") ? "DEV_BRANCH" :
    host.includes("ep-billowing-bread-at8n3cdj") ? "PROD" :
    "UNKNOWN";
  const hasPgbouncer = /[?&]pgbouncer=true/.test(dbUrl);
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? null;

  const raffleId = "cmqh43bxj0001xm2teh6gdnel"; // El Dubai

  try {
    // Réplica EXACTA del filtro de public.getRaffle
    const matched = await prisma.raffle.findFirst({
      where: { id: raffleId, isPublic: true, status: { not: "CANCELLED" } },
      select: { id: true, title: true, isPublic: true, status: true, userId: true },
    });
    const raw = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { id: true, title: true, isPublic: true, status: true },
    });

    return NextResponse.json({
      ok: true,
      runtime_host: host,
      base,
      database_url_has_pgbouncer: hasPgbouncer,
      nextauth_url_present: hasNextAuthUrl,
      nextauth_url: nextAuthUrl,
      raffle_id_tested: raffleId,
      raffle_found_with_storefront_filter: !!matched,
      raffle_data: matched,
      raffle_exists_raw: !!raw,
      raw_isPublic: raw?.isPublic ?? null,
      raw_status: raw?.status ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      runtime_host: host,
      base,
      database_url_has_pgbouncer: hasPgbouncer,
      error_name: e?.name ?? null,
      error_message: e?.message ?? String(e),
      error_code: e?.code ?? null,
      stack_first_lines: typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 6) : null,
    }, { status: 500 });
  }
}
