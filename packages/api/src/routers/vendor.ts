import { createTRPCRouter, publicProcedure } from "../trpc";

// TODO Fase 2: vendedores (comisiones + recaudo por vendedor, jerarquía, links/QR).
export const vendorRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
});
