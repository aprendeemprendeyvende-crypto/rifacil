import { createTRPCRouter, publicProcedure } from "../trpc";
import { getVendorIdFromReq } from "../lib/vendorAuth";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Portal del VENDEDOR: lee la cookie de vendedor (no la sesión del rifero) y
// devuelve SOLO lo suyo. Multi-tenant: el vendorId acota todo a un único rifero.
export const vendorPortalRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    const vendorId = getVendorIdFromReq(ctx.req);
    if (!vendorId) return null;

    const vendor = await ctx.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        lastName: true,
        code: true,
        commissionRate: true,
        role: true,
        active: true,
        userId: true,
      },
    });
    if (!vendor || !vendor.active) return null;

    const user = await ctx.prisma.user.findUnique({
      where: { id: vendor.userId },
      select: { name: true, brandName: true, brandColor: true, brandColorSecondary: true, brandLogo: true },
    });
    const raffles = await ctx.prisma.raffle.findMany({
      where: { userId: vendor.userId, status: "ACTIVE", isPublic: true },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        lastName: vendor.lastName,
        code: vendor.code,
        commissionRate: Number(vendor.commissionRate),
        role: vendor.role,
      },
      brand: {
        name: user?.brandName || user?.name || "Rifas",
        color: user?.brandColor || "#3b82f6",
        colorSecondary: user?.brandColorSecondary || "#1e293b",
        logo: user?.brandLogo || null,
      },
      raffles,
    };
  }),

  sales: publicProcedure.query(async ({ ctx }) => {
    const vendorId = getVendorIdFromReq(ctx.req);
    if (!vendorId) return null;

    const vendor = await ctx.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { commissionRate: true, active: true },
    });
    if (!vendor || !vendor.active) return null;
    const rate = Number(vendor.commissionRate);

    const sales = await ctx.prisma.sale.findMany({
      where: { vendorId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        createdAt: true,
        numbers: true,
        totalNumbers: true,
        finalAmount: true,
        amountPaid: true,
        status: true,
        contact: { select: { name: true } },
        raffle: { select: { title: true } },
      },
    });

    let collected = 0;
    let billed = 0;
    const items = sales.map((s) => {
      const ap = Number(s.amountPaid);
      const fa = Number(s.finalAmount);
      collected += ap;
      billed += fa;
      return {
        id: s.id,
        createdAt: s.createdAt,
        numbers: s.numbers,
        totalNumbers: s.totalNumbers,
        finalAmount: fa,
        amountPaid: ap,
        status: s.status,
        contactName: s.contact?.name ?? "—",
        raffleTitle: s.raffle?.title ?? "",
        commission: round2((ap * rate) / 100),
      };
    });

    return {
      rate,
      items,
      totals: {
        count: sales.length,
        collected: round2(collected),
        billed: round2(billed),
        commission: round2((collected * rate) / 100),
      },
    };
  }),
});
