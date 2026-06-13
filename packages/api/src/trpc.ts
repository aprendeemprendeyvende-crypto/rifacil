import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { getSessionFromRequest } from "@riffas/auth";
import { prisma } from "@riffas/db";

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  // App Router: leer la sesión desde el request (JWT), sin depender de `res`.
  const session = await getSessionFromRequest(opts.req);

  return {
    prisma,
    session,
    req: opts.req,
    res: opts.res,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware para verificar límites de suscripción
const enforceSubscriptionLimits = t.middleware(async ({ ctx, next, path }) => {
  const user = ctx.session!.user;
  const sub = await ctx.prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!sub || sub.status === "EXPIRED") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Suscripción requerida" });
  }

  return next({ ctx: { ...ctx, subscription: sub } });
});

export const premiumProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceSubscriptionLimits);
