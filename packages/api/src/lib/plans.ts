// Planes del SaaS para riferos. La pasarela de cobro llega después; aquí está la
// estructura de límites. Foco: nº de rifas ACTIVAS y nº de contactos.

export type PlanId = "FREE" | "PRO";

export interface PlanDef {
  id: PlanId;
  name: string;
  priceUSD: number;
  popular?: boolean;
  limits: { maxRaffles: number; maxContacts: number };
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: "FREE",
    name: "Gratis",
    priceUSD: 0,
    limits: { maxRaffles: 1, maxContacts: 100 },
    features: ["1 rifa activa", "Hasta 100 contactos", "Tablero de números y recibos", "Página pública /r"],
  },
  {
    id: "PRO",
    name: "Pro",
    priceUSD: 15,
    popular: true,
    limits: { maxRaffles: 20, maxContacts: 10000 },
    features: [
      "Hasta 20 rifas activas",
      "Hasta 10.000 contactos",
      "Vendedores con su propio panel",
      "Campañas de WhatsApp",
      "Reportes y exportación a Excel",
    ],
  },
];

export const PLAN_BY_ID: Record<string, PlanDef> = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export function limitsForPlan(plan: string) {
  return (PLAN_BY_ID[plan] ?? PLANS[0]).limits;
}

// Resuelve plan + límites efectivos + uso EN VIVO (no los contadores denormalizados,
// que pueden quedar desfasados). Funciona aunque no exista fila Subscription (FREE).
export async function getPlanContext(prisma: any, userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan: string = sub?.plan ?? "FREE";
  const limits =
    sub && typeof sub.maxRaffles === "number"
      ? { maxRaffles: sub.maxRaffles, maxContacts: sub.maxContacts }
      : limitsForPlan(plan);

  const [activeRaffles, contacts] = await Promise.all([
    prisma.raffle.count({ where: { userId, status: "ACTIVE" } }),
    prisma.contact.count({ where: { userId } }),
  ]);

  return { plan, limits, usage: { activeRaffles, contacts } };
}
