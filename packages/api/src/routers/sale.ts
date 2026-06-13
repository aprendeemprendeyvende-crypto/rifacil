import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { generateReceipt } from "@riffas/shared/receipt";

export const saleRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        raffleId: z.string(),
        contactId: z.string().optional(),
        contactData: z.object({
          name: z.string().min(1),
          phone: z.string().min(8),
          email: z.string().email().optional(),
          city: z.string().optional(),
        }).optional(),
        numbers: z.array(z.string()).min(1),
        vendorId: z.string().optional(),
        paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "NEQUI", "DAVIPLATA", "MERCADOPAGO", "STRIPE", "WOMPI", "PSE"]),
        discountCode: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;

      const raffle = await prisma.raffle.findFirst({
        where: { id: input.raffleId, userId: session.user.id, status: "ACTIVE" },
        include: { numbers: true },
      });

      if (!raffle) throw new TRPCError({ code: "NOT_FOUND", message: "Rifa no encontrada o inactiva" });

      const requestedNumbers = await prisma.raffleNumber.findMany({
        where: {
          raffleId: input.raffleId,
          number: { in: input.numbers },
        },
      });

      const unavailable = requestedNumbers.filter((n) => n.status !== "AVAILABLE");
      if (unavailable.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Números no disponibles: ${unavailable.map((n) => n.number).join(", ")}`,
        });
      }

      let contactId = input.contactId;
      if (!contactId && input.contactData) {
        const existing = await prisma.contact.findFirst({
          where: { userId: session.user.id, phone: input.contactData.phone },
        });

        if (existing) {
          contactId = existing.id;
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name: input.contactData.name,
              email: input.contactData.email || existing.email,
              city: input.contactData.city || existing.city,
              lastContactDate: new Date(),
              lastContactMethod: "sale",
            },
          });
        } else {
          const newContact = await prisma.contact.create({
            data: {
              ...input.contactData,
              userId: session.user.id,
              source: "manual",
              lastContactDate: new Date(),
              lastContactMethod: "sale",
            },
          });
          contactId = newContact.id;
        }
      }

      if (!contactId) throw new TRPCError({ code: "BAD_REQUEST", message: "Contacto requerido" });

      let totalAmount = Number(raffle.pricePerNumber) * input.numbers.length;
      let discountApplied = 0;

      if (raffle.discountPackages) {
        const packages = raffle.discountPackages as Array<{ qty: number; discountPercent: number }>;
        const applicable = packages
          .filter((p) => input.numbers.length >= p.qty)
          .sort((a, b) => b.discountPercent - a.discountPercent)[0];

        if (applicable) {
          discountApplied = totalAmount * (applicable.discountPercent / 100);
        }
      }

      const finalAmount = totalAmount - discountApplied;
      const receiptNumber = `R-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const sale = await prisma.sale.create({
        data: {
          raffleId: input.raffleId,
          contactId,
          vendorId: input.vendorId,
          userId: session.user.id,
          numbers: input.numbers,
          totalNumbers: input.numbers.length,
          totalAmount,
          discountApplied: discountApplied || undefined,
          finalAmount,
          status: input.paymentMethod === "CASH" ? "PAID" : "PENDING",
          paymentMethod: input.paymentMethod,
          receiptNumber,
          source: input.vendorId ? "vendor" : "direct",
        },
        include: {
          contact: true,
          raffle: true,
        },
      });

      await prisma.raffleNumber.updateMany({
        where: {
          raffleId: input.raffleId,
          number: { in: input.numbers },
        },
        data: {
          status: input.paymentMethod === "CASH" ? "PAID" : "SOLD",
          contactId,
          saleId: sale.id,
          vendorId: input.vendorId,
          soldAt: new Date(),
          paidAt: input.paymentMethod === "CASH" ? new Date() : undefined,
          paymentMethod: input.paymentMethod,
          receiptNumber,
        },
      });

      await prisma.contact.update({
        where: { id: contactId },
        data: {
          totalSpent: { increment: finalAmount },
          totalTickets: { increment: input.numbers.length },
          totalRaffles: { increment: 1 },
          lastPurchase: new Date(),
        },
      });

      await prisma.raffle.update({
        where: { id: input.raffleId },
        data: {
          soldCount: { increment: input.numbers.length },
          revenue: { increment: finalAmount },
        },
      });

      const receiptUrl = await generateReceipt({
        sale,
        raffle,
        contact: sale.contact,
        brandName: session.user.brandName || session.user.name,
        brandLogo: session.user.brandLogo,
        brandColor: session.user.brandColor,
      });

      await prisma.sale.update({
        where: { id: sale.id },
        data: { receiptUrl },
      });

      await prisma.raffleNumber.updateMany({
        where: { saleId: sale.id },
        data: { receiptUrl },
      });

      return { sale: { ...sale, receiptUrl } };
    }),

  confirmPayment: protectedProcedure
    .input(z.object({ saleId: z.string(), paymentProof: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const sale = await ctx.prisma.sale.update({
        where: { id: input.saleId, userId: ctx.session.user.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentProof: input.paymentProof,
        },
        include: { contact: true, raffle: true },
      });

      await ctx.prisma.raffleNumber.updateMany({
        where: { saleId: input.saleId },
        data: { status: "PAID", paidAt: new Date() },
      });

      return sale;
    }),

  list: protectedProcedure
    .input(
      z.object({
        raffleId: z.string().optional(),
        contactId: z.string().optional(),
        status: z.enum(["ALL", "PENDING", "RESERVED", "PAID", "CANCELLED", "REFUNDED"]).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { raffleId, contactId, status = "ALL", startDate, endDate, limit = 20, cursor } = input || {};

      const where: any = { userId: session.user.id };
      if (raffleId) where.raffleId = raffleId;
      if (contactId) where.contactId = contactId;
      if (status !== "ALL") where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const sales = await prisma.sale.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          raffle: { select: { id: true, title: true } },
          vendor: { select: { id: true, name: true, code: true } },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (sales.length > limit) {
        const nextItem = sales.pop();
        nextCursor = nextItem!.id;
      }

      return { sales, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sale = await ctx.prisma.sale.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          contact: true,
          raffle: true,
          vendor: true,
          numbers_rel: true,
        },
      });

      if (!sale) throw new TRPCError({ code: "NOT_FOUND" });
      return sale;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const sale = await ctx.prisma.sale.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { status: "CANCELLED" },
      });

      await ctx.prisma.raffleNumber.updateMany({
        where: { saleId: input.id },
        data: {
          status: "AVAILABLE",
          contactId: null,
          saleId: null,
          soldAt: null,
          paidAt: null,
          paymentMethod: null,
          receiptUrl: null,
          receiptNumber: null,
        },
      });

      return sale;
    }),

  resendReceipt: protectedProcedure
    .input(z.object({ saleId: z.string(), channel: z.enum(["WHATSAPP", "EMAIL", "SMS"]) }))
    .mutation(async ({ ctx, input }) => {
      const sale = await ctx.prisma.sale.findFirst({
        where: { id: input.saleId, userId: ctx.session.user.id },
        include: { contact: true, raffle: true },
      });

      if (!sale) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: any = {};
      if (input.channel === "WHATSAPP") {
        updateData.whatsappSent = true;
        updateData.whatsappSentAt = new Date();
      } else if (input.channel === "EMAIL") {
        updateData.emailSent = true;
        updateData.emailSentAt = new Date();
      } else {
        updateData.smsSent = true;
        updateData.smsSentAt = new Date();
      }

      await ctx.prisma.sale.update({
        where: { id: input.saleId },
        data: updateData,
      });

      return { success: true };
    }),
});
