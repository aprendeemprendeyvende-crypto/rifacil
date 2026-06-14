import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Fase 1: CRUD de campañas + cálculo de destinatarios.
// El ENVÍO real por WhatsApp (Evolution API / Cloud API) llega en Fase 2.
export const campaignRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),

  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "CANCELLED"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.session.user.id };
      if (input?.status) where.status = input.status;

      const campaigns = await ctx.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return { campaigns };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.campaign.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  // Cuántos contactos recibirían la campaña según el segmento elegido.
  previewAudience: protectedProcedure
    .input(
      z.object({
        targetAll: z.boolean().default(false),
        targetTags: z.array(z.string()).default([]),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.session.user.id };
      if (!input.targetAll && input.targetTags.length > 0) {
        where.tags = { hasSome: input.targetTags };
      }
      const count = await ctx.prisma.contact.count({ where });
      return { count };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nombre muy corto"),
        type: z
          .enum(["WHATSAPP", "SMS", "EMAIL", "SOCIAL_POST", "REMARKETING", "REFERRAL"])
          .default("WHATSAPP"),
        message: z.string().min(1, "El mensaje no puede estar vacío"),
        targetAll: z.boolean().default(false),
        targetTags: z.array(z.string()).default([]),
        raffleId: z.string().optional(),
        scheduledAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;

      // Estimar destinatarios al momento de crear.
      const where: any = { userId: session.user.id };
      if (!input.targetAll && input.targetTags.length > 0) {
        where.tags = { hasSome: input.targetTags };
      }
      const totalRecipients = await prisma.contact.count({ where });

      const campaign = await prisma.campaign.create({
        data: {
          userId: session.user.id,
          name: input.name,
          type: input.type,
          message: input.message,
          targetAll: input.targetAll,
          targetTags: input.targetTags,
          raffleId: input.raffleId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
          totalRecipients,
        },
      });

      return campaign;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const owned = await ctx.prisma.campaign.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!owned) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.campaign.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
