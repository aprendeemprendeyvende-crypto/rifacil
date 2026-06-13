# CLAUDE.md — Proyecto Riffas 2.0 (nombre comercial: por definir)

> Este archivo lo lee Claude Code en CADA sesión. Es la fuente de verdad del proyecto.
> Mantenlo corto y actualizado.

## Qué es
SaaS multi-tenant para **riferos** (personas que venden rifas/sorteos). El rifero,
**desde su celular**, crea rifas, vende/aparta números, gestiona clientes, cobra,
genera recibos y lanza campañas de WhatsApp — todo en un solo lugar.

## Para quién (no perder de vista)
- Base real ~80% **Venezuela** (prefijos 0424/0414/+58), fuerte **Colombia** (+57),
  minorías CL/PE/EC/ES.
- Precios en **USD**, muchos pagos en **bolívares (VES)** → conversión por tasa.
- Se opera **con el pulgar**: mobile-first y PWA instalable, probada en **iOS Safari**.

## Stack
Turborepo + pnpm · Next.js 14 (App Router) · tRPC · Prisma + PostgreSQL ·
NextAuth · TailwindCSS · workers para jobs · Cloudinary (imágenes/recibos).

## Reglas de oro (NO NEGOCIABLES)
1. **Recibos SIEMPRE del lado del servidor.** Prohibido `html2canvas`/`canvas.toDataURL`
   (rompe en iPhone). Usar `generateReceipt` de `@riffas/shared` (Satori → PNG → Cloudinary).
2. **Pagos venezolanos primero:** Pago Móvil, Binance/USDT, Zelle, efectivo USD/VES.
   Mantener modelo `ExchangeRate` (tasa BCV/Binance) y mostrar precio dual USD/VES.
3. **Teléfonos:** normalizar con `normalizePhone(raw, "VE")` (default Venezuela, detecta
   país por prefijo). Nunca hardcodear "CO".
4. **Importación de contactos:** usar `parseGoogleContacts` (separa `:::`, concatena
   nombre, deduplica). Debe aguantar archivos de 6.000+ filas sin congelar la UI.
5. **Búsqueda de clientes** tolerante a errores (pg_trgm), no solo `contains`.
6. **Multi-tenant:** TODA query filtra por `userId` del rifero. Nunca filtrar datos entre tenants.

## Arquitectura de referencia (la v1 que mejoramos)
La v1 era PERN (Express en Railway). Su API ya tenía features que NO debemos perder:
vendedores con **recaudo por vendedor**, **números compartidos** (aceptar/rechazar),
**avisos por WhatsApp** por número, **gastos por rifa**, **ofertas/promos**, **tasas**.

## Dónde está el "power-pack" ya hecho
`packages/shared/` (phone.ts, google-contacts.ts, receipt.ts) ya implementa las curas
clave. Sigue `INSTALAR.md` para conectarlo. Aplica `patches/venezuela-localization.md`
al `schema.prisma` y corre `pnpm prisma migrate dev`.

## Orden de construcción
- **Fase 1 (cerrar el MVP):** integrar power-pack → recibos server-side, import CSV,
  localización Venezuela (pagos + tasa), búsqueda fuzzy. **Probar recibo en iPhone real.**
- **Fase 2:** routers faltantes `campaign` (WhatsApp Cloud API), `vendor` (comisiones +
  recaudo), `analytics`; `apps/workers` (envío de campañas, recordatorios de deuda, job
  tasa BCV); storefront público + verificador de boletos; números compartidos.
- **Fase 3:** suscripciones/planes (cobro del SaaS), dominio propio por rifero, multipaís.

## Comandos
```bash
pnpm install
pnpm dev                 # levanta web + api
pnpm --filter @riffas/db prisma migrate dev
pnpm --filter @riffas/db prisma studio
```

## Estilo
TypeScript estricto, Zod en inputs, componentes pequeños, estados de carga/vacío en cada
vista, español en toda la UI, moneda dual USD/VES donde aplique.
