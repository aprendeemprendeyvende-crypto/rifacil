import { createTRPCRouter, publicProcedure } from "../trpc";

// TODO Fase 2: analytics (leads por día/fuente, funnel QR→venta, top mesas/vendedores).
export const analyticsRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
});
