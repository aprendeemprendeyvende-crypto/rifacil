import { z } from "zod";
import { PaymentMethod } from "@riffas/db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Valores válidos del enum PaymentMethod de Prisma (Set para filtrado O(1)).
const VALID_PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

// Mapea el string[] de Zod al enum PaymentMethod, descartando inválidos.
// Acepta variantes en minúscula/espacios para tolerar entradas de la UI.
function toPaymentMethods(raw: string[]): PaymentMethod[] {
  const seen = new Set<PaymentMethod>();
  for (const item of raw) {
    const candidate = item.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (VALID_PAYMENT_METHODS.has(candidate)) {
      seen.add(candidate as PaymentMethod);
    }
  }
  return [...seen];
}

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
      // Mapear acceptedPaymentMethods (string[]) al enum PaymentMethod antes de
      // guardar; descartar inválidos para que guardar Ajustes nunca falle.
      const { acceptedPaymentMethods, ...rest } = input;
      const data = {
        ...rest,
        ...(acceptedPaymentMethods !== undefined && {
          acceptedPaymentMethods: toPaymentMethods(acceptedPaymentMethods),
        }),
      };

      const settings = await ctx.prisma.userSettings.upsert({
        where: { userId: ctx.session.user.id },
        update: data,
        create: {
          userId: ctx.session.user.id,
          ...data,
        },
      });
      return settings;
    }),
});
