// Tasa de cambio USD -> VES por rifero.
//
// Fuente BCV: usamos ve.dolarapi.com (JSON simple sobre HTTPS, funciona en
// serverless/Vercel; el sitio oficial del BCV requiere scraping de HTML y tiene
// problemas de SSL). El campo `promedio` es la tasa oficial (BCV). Si el fetch
// falla, el rifero puede fijar la tasa manualmente en Ajustes.

const round4 = (n: number) => Math.round(n * 10000) / 10000;

export async function fetchBcvRate(): Promise<number> {
  const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BCV HTTP ${res.status}`);
  const json: any = await res.json();
  const rate = Number(json?.promedio);
  if (!rate || rate <= 0 || !Number.isFinite(rate)) {
    throw new Error("Respuesta de la fuente BCV inválida");
  }
  return round4(rate);
}

// Tasa activa actual del rifero (la más reciente marcada isActive).
export async function getActiveRate(prisma: any, userId: string) {
  return prisma.exchangeRate.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

// Guarda una nueva tasa activa, desactivando la anterior (historial con timestamp).
export async function saveRate(
  prisma: any,
  userId: string,
  vesPerUsd: number,
  source: "BCV" | "BINANCE" | "MANUAL"
) {
  await prisma.exchangeRate.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  return prisma.exchangeRate.create({
    data: { userId, vesPerUsd: round4(vesPerUsd), source, isActive: true },
  });
}
