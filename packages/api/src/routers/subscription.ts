import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PLANS, getPlanContext } from "../lib/plans";

export const subscriptionRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  getPlans: protectedProcedure.query(async () => PLANS),

  // Plan actual + límites + uso en vivo (para "Plan y facturación").
  usage: protectedProcedure.query(async ({ ctx }) => {
    const ctxPlan = await getPlanContext(ctx.prisma, ctx.session.user.id);
    return { ...ctxPlan, plans: PLANS };
  }),

  // El cobro con pasarela llega después. Por ahora registramos el interés.
  requestUpgrade: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.activityLog.create({
      data: {
        userId: ctx.session.user.id,
        action: "UPGRADE_REQUESTED",
        entityType: "Subscription",
        entityId: ctx.session.user.id,
      },
    });
    return { ok: true };
  }),

  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.subscription.updateMany({
      where: { userId: ctx.session.user.id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    });
    return { success: true };
  }),
});
