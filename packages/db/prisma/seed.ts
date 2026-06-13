import { PrismaClient } from "../src/generated";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clave conocida para entrar a probar: demo@rifacil.com / demo1234
  const passwordHash = await bcrypt.hash("demo1234", 12);

  // 1) Usuario rifero demo. Login por teléfono: 0424-1234567 → +584241234567 / demo1234
  const user = await prisma.user.upsert({
    where: { phone: "+584241234567" },
    update: { passwordHash },
    create: {
      email: "demo@rifacil.com",
      phone: "+584241234567",
      name: "Rifero Demo",
      passwordHash,
      role: "RIFERO",
      brandName: "Rifas El Zuliano",
      brandColor: "#16a34a",
      brandSlug: "el-zuliano",
      onboardingCompleted: true,
      settings: {
        create: {
          currency: "USD",
          timezone: "America/Caracas",
          language: "es",
          acceptedPaymentMethods: ["PAGO_MOVIL", "BINANCE", "ZELLE", "EFECTIVO_USD"],
        },
      },
      subscriptions: {
        create: {
          plan: "PRO",
          status: "ACTIVE",
          maxRaffles: 100,
          maxContacts: 100_000,
          maxVendors: 50,
          maxNumbers: 100_000,
          maxCampaignsPerMonth: 1000,
        },
      },
    },
  });

  // Limpieza de datos demo previos (sin unique natural) para que el seed sea re-ejecutable.
  await prisma.exchangeRate.deleteMany({ where: { userId: user.id } });
  await prisma.raffle.deleteMany({ where: { userId: user.id } }); // cascada a RaffleNumber

  // 2) Tasa de cambio activa (BCV): 1 USD = 140 VES
  await prisma.exchangeRate.create({
    data: {
      userId: user.id,
      source: "BCV",
      vesPerUsd: "140.0000",
      isActive: true,
    },
  });

  // 3) Rifa demo de 3 cifras con 50 números (000–049)
  const raffle = await prisma.raffle.create({
    data: {
      userId: user.id,
      title: "Rifa Demo — iPhone 15",
      description: "Rifa de prueba para validar el flujo completo (venta + recibo).",
      prize: "iPhone 15 128GB",
      prizeValue: "800.00",
      totalNumbers: 50,
      pricePerNumber: "2.00",
      numberFormat: "000",
      startDate: new Date(),
      drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  await prisma.raffleNumber.createMany({
    data: Array.from({ length: 50 }, (_, i) => ({
      raffleId: raffle.id,
      number: String(i).padStart(3, "0"),
    })),
  });

  // 4) Contacto venezolano de prueba (idempotente por userId+phone)
  const contact = await prisma.contact.upsert({
    where: { userId_phone: { userId: user.id, phone: "+584241234567" } },
    update: {},
    create: {
      userId: user.id,
      name: "María Pérez",
      phone: "+584241234567",
      country: "VE",
      city: "Maracaibo",
      source: "seed",
      tags: ["demo"],
    },
  });

  console.log("✅ Seed completo:", {
    user: user.email,
    raffle: raffle.title,
    numeros: 50,
    tasaVES: 140,
    contacto: contact.name,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
