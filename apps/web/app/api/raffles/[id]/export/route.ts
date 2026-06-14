import { type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@riffas/db";
import { getSessionFromRequest } from "@riffas/auth";

// exceljs corre en Node (no edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_ES: Record<string, string> = {
  RESERVED: "Apartado",
  SOLD: "Por confirmar",
  PAID: "Pagado",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function splitName(full: string): { nombre: string; apellido: string } {
  const parts = (full || "").trim().split(/\s+/);
  if (parts.length <= 1) return { nombre: full || "", apellido: "" };
  return { nombre: parts[0], apellido: parts.slice(1).join(" ") };
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session?.user?.id) {
    return new Response("No autorizado", { status: 401 });
  }

  // Multi-tenant: la rifa debe ser del usuario en sesión.
  const raffle = await prisma.raffle.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, title: true },
  });
  if (!raffle) {
    return new Response("Rifa no encontrada", { status: 404 });
  }

  // Un row por número apartado/vendido/pagado.
  const numbers = await prisma.raffleNumber.findMany({
    where: { raffleId: raffle.id, status: { in: ["RESERVED", "SOLD", "PAID"] } },
    orderBy: { number: "asc" },
    include: {
      contact: { select: { name: true, phone: true, city: true } },
      sale: { select: { amountPaid: true, finalAmount: true, totalNumbers: true, createdAt: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");

  // Columnas idénticas al original.
  ws.columns = [
    { header: "Nombre", key: "nombre", width: 20 },
    { header: "Apellido", key: "apellido", width: 20 },
    { header: "Teléfono", key: "telefono", width: 18 },
    { header: "Dirección", key: "direccion", width: 24 },
    { header: "Rifa", key: "rifa", width: 24 },
    { header: "Número", key: "numero", width: 12 },
    { header: "Fecha Apartado", key: "fecha", width: 18 },
    { header: "Estado", key: "estado", width: 14 },
    { header: "Abonado", key: "abonado", width: 12 },
    { header: "Deuda", key: "deuda", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const n of numbers) {
    const { nombre, apellido } = splitName(n.contact?.name ?? "");
    // Abonado/Deuda prorrateados por número para que las sumas cuadren con los
    // totales reales de la venta (una venta puede cubrir varios números).
    const count = n.sale?.totalNumbers && n.sale.totalNumbers > 0 ? n.sale.totalNumbers : 1;
    const salePaid = n.sale ? Number(n.sale.amountPaid) : 0;
    const saleFinal = n.sale ? Number(n.sale.finalAmount) : 0;
    const abonado = round2(salePaid / count);
    const deuda = Math.max(0, round2((saleFinal - salePaid) / count));

    ws.addRow({
      nombre,
      apellido,
      telefono: n.contact?.phone ?? "",
      direccion: n.contact?.city ?? "",
      rifa: raffle.title,
      numero: n.number,
      fecha: fmtDate(n.soldAt ?? n.sale?.createdAt ?? n.createdAt),
      estado: STATUS_ES[n.status] ?? n.status,
      abonado,
      deuda,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const safeTitle = (raffle.title || "rifa").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 40);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-${safeTitle}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
