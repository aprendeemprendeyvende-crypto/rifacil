import { createTRPCRouter, publicProcedure } from "../trpc";

// TODO Fase 2: campañas WhatsApp (segmentación, envío vía Evolution API / Cloud API).
export const campaignRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
});
