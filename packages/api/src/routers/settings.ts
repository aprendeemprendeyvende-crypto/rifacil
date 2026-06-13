import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.userSettings.findUnique({
      where: { userId: ctx.session.user.id },
    });
    return settings;
  }),

  update: protectedProcedure
    .input(
      z.object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        language: z.string().optional(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        whatsappNotifications: z.boolean().optional(),
        acceptedPaymentMethods: z.array(z.string()).optional(),
        receiptTemplate: z.string().optional(),
        whatsappSaleTemplate: z.string().optional(),
        emailSaleTemplate: z.string().optional(),
        autoConfirmPayments: z.boolean().optional(),
        autoSendReceipt: z.boolean().optional(),
        autoSendWhatsApp: z.boolean().optional(),
        reservationExpiryMinutes: z.number().min(5).max(1440).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
      });
      return settings;
    }),
});
