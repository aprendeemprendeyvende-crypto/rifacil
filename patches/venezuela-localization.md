# Parche de localización Venezuela — Riffas 2.0

> Kimi asumió Colombia. Estos cambios re-localizan el producto para tu base real
> (~80% venezolana). Aplícalos en `packages/db/prisma/schema.prisma` y corre
> `pnpm prisma migrate dev`.

## 1. Métodos de pago — reemplaza el enum `PaymentMethod`

```prisma
enum PaymentMethod {
  // Venezuela (prioridad)
  PAGO_MOVIL        // C2P / Pago Móvil interbancario
  BINANCE           // USDT / Binance Pay
  ZELLE
  EFECTIVO_USD      // efectivo en dólares
  EFECTIVO_VES      // efectivo en bolívares
  TRANSFERENCIA_VES // transferencia bancaria nacional (VES)

  // Colombia / genéricos (se conservan para multi-país)
  NEQUI
  DAVIPLATA
  PSE
  BANK_TRANSFER
  MERCADOPAGO
  STRIPE
  WOMPI
  CASH
}
```

En `UserSettings.acceptedPaymentMethods` cambia el default a algo venezolano:

```prisma
acceptedPaymentMethods PaymentMethod[] @default([PAGO_MOVIL, BINANCE, ZELLE, EFECTIVO_USD])
```

## 2. Tasa de cambio — añade el modelo `ExchangeRate` (tu v1 tenía /tasas; la v2 lo botó)

```prisma
enum RateSource {
  BCV
  BINANCE
  MANUAL
}

model ExchangeRate {
  id        String     @id @default(cuid())
  userId    String     // tasa por rifero (o globaliza si prefieres una sola)
  source    RateSource @default(BCV)
  vesPerUsd Decimal    @db.Decimal(14, 4)  // cuántos VES = 1 USD
  isActive  Boolean    @default(true)
  createdAt DateTime   @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@index([userId, source])
}
```

Y en `Sale`, guarda la tasa usada en el momento del cobro (para auditoría e ingresos en VES):

```prisma
  rateUsed   Decimal? @db.Decimal(14, 4)   // VES por USD al momento de la venta
  amountVes  Decimal? @db.Decimal(14, 2)   // equivalente cobrado en bolívares
```

## 3. Datos de cobro del rifero — añade a `UserSettings`

```prisma
  // Pago Móvil
  pmBankCode   String?
  pmPhone      String?
  pmIdNumber   String?   // cédula/RIF
  // Binance / Zelle
  binanceEmail String?
  zelleEmail   String?
  zelleName    String?
```

## 4. Arreglo menor pero importante

- `Contact.country` tiene `@default("CO")`. Cámbialo a `@default("VE")`.
- El índice `@@index([userId, name])` es btree → la búsqueda sigue siendo `contains`,
  no fuzzy. Para búsqueda tolerante a errores activa `pg_trgm`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX contact_name_trgm ON "Contact" USING gin (name gin_trgm_ops);
CREATE INDEX contact_phone_trgm ON "Contact" USING gin (phone gin_trgm_ops);
```

Y en el router de contactos, ordena por similitud:
`ORDER BY similarity(name, $query) DESC`.

## 5. Flujo de confirmación de pago (Pago Móvil / comprobante)

El `Sale` ya tiene `paymentProof` y `paymentReference`. Úsalos así:
- El comprador sube captura → `Sale.status = PENDING`, `paymentProof = url`.
- El rifero aprueba con un toque → `status = PAID`, dispara `generateReceipt`.
- (Opcional avanzado) Pago Móvil C2P con validación automática vía banco:
  guarda `paymentReference` (referencia bancaria) y valida contra el API del banco
  antes de marcar PAID.
