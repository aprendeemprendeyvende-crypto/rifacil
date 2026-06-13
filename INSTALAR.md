# Cómo meter estas piezas en el repo de Kimi (riffas-v2)

Estas 4 piezas rellenan lo que estaba en stub y re-localizan el producto para Venezuela.

## 1. Paquete `@riffas/shared` (estaba VACÍO, sin package.json)
Copia la carpeta `packages/shared/` de aquí encima de la del repo. Trae:
- `phone.ts` → `normalizePhone` consciente del país (default VE), `splitAndNormalizePhones` (separa `:::`).
- `google-contacts.ts` → `parseGoogleContacts(csvText)`: concatena nombre, separa teléfonos múltiples, normaliza VE, deduplica. Devuelve filas con la forma exacta que espera `contact.importCSV`.
- `receipt.ts` → `generateReceipt(...)` server-side (Satori → PNG → Cloudinary firmado). **Mata el bug de iPhone.**

Instala dependencias:
```bash
pnpm --filter @riffas/shared add cloudinary libphonenumber-js papaparse satori @resvg/resvg-js
pnpm --filter @riffas/shared add -D @types/papaparse
```

## 2. Arreglar el import del CSV en `contact.ts`
El endpoint `importCSV` espera filas ya limpias. En la página `dashboard/contacts`,
al subir el archivo de Google, llama primero al parser:
```ts
import { parseGoogleContacts } from "@riffas/shared";
const { contacts, stats } = parseGoogleContacts(fileText, { tag: "Importados" });
// muestra `stats` como vista previa, luego envía `contacts` a trpc.contact.importCSV
```
Y borra el `"CO"` hardcodeado: el parser ya entrega E.164; en el endpoint usa
`normalizePhone(row.phone, "VE")` o confía en el phone ya normalizado.

## 3. `generateReceipt` ya queda conectado
`sale.ts` ya hace `import { generateReceipt } from "@riffas/shared"` y lo llama con
`{ sale, raffle, contact, brandName, brandLogo, brandColor }`. Con el archivo nuevo,
deja de ser stub. Solo asegúrate de que `raffle` traiga `title`, `lottery`, `drawDate`.

## 4. Localización Venezuela
Aplica `patches/venezuela-localization.md` al `schema.prisma` y migra.

## Variables de entorno (añadir a .env)
```
CLOUDINARY_CLOUD_NAME=dfbwjrpdu
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Lo que todavía falta construir (no estaba en el zip)
Routers/JOBS ausentes: `campaign` (WhatsApp Cloud API), `vendor` (comisiones + recaudo
por vendedor), `analytics`, y `apps/workers` (envío de campañas, recordatorios de deuda,
actualización de tasa BCV). Además: storefront público + verificador de boletos, y el
flujo de "números compartidos". Son la Fase 2 — dímelo y te armo el siguiente.
