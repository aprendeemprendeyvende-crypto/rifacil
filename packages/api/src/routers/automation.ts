import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const automationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rules = await ctx.prisma.automationRule.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return rules;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trigger: z.string(),
        triggerConfig: z.record(z.any()).optional(),
        conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional(),
        actions: z.array(z.object({ type: z.string(), config: z.record(z.any()) })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.automationRule.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
      return rule;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          active: z.boolean().optional(),
          trigger: z.string().optional(),
          triggerConfig: z.record(z.any()).optional(),
          conditions: z.array(z.any()).optional(),
          actions: z.array(z.any()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.automationRule.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
      return rule;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.automationRule.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return { success: true };
    }),
});
