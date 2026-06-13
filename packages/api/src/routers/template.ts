import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const templateRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        OR: [
          { userId: ctx.session.user.id },
          { isPublic: true },
        ],
      };
      if (input?.type) where.type = input.type;
      if (input?.category) where.category = input.category;

      const templates = await ctx.prisma.template.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { usageCount: "desc" }],
      });
      return templates;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string(),
        category: z.string(),
        content: z.string().min(1),
        variables: z.array(z.string()).optional(),
        imageTemplate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
      return template;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          content: z.string().optional(),
          variables: z.array(z.string()).optional(),
          imageTemplate: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: input.data,
      });
      return template;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.template.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return { success: true };
    }),
});
