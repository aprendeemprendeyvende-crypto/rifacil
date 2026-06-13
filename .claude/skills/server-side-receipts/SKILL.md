---
name: server-side-receipts
description: Usar SIEMPRE que se generen, modifiquen o envíen recibos/comprobantes de venta de una rifa. Activar ante "recibo", "comprobante", "generar imagen del boleto", "compartir por WhatsApp el recibo". Garantiza que el render sea del lado del servidor y NUNCA con html2canvas (que rompe en iPhone).
---

# Recibos del lado del servidor

## Regla de oro
**PROHIBIDO** `html2canvas`, `canvas.toDataURL()` o cualquier render del recibo en el
navegador. Esa fue la causa del bug de la v1: no generaba recibos en iOS Safari.
El recibo se dibuja SIEMPRE en el servidor y el cliente solo recibe una imagen lista.

## Cómo hacerlo
Usar `generateReceipt` de `@riffas/shared` (ya implementado en `packages/shared/src/receipt.ts`):
- Renderiza con **Satori** (árbol → SVG) → **@resvg/resvg-js** (SVG → PNG).
- Sube el PNG a **Cloudinary firmado** (`folder: riffas/receipts`, `public_id: receiptNumber`).
- Devuelve `secure_url`, que se guarda en `Sale.receiptUrl` y en los `RaffleNumber`.

Firma:
```ts
generateReceipt({ sale, raffle, contact, brandName, brandLogo, brandColor }) => Promise<string>
```

## Dónde se invoca
En `packages/api/src/routers/sale.ts`, tras confirmar la venta/pago. Nunca en el cliente.

## Compartir por WhatsApp
El cliente abre `https://wa.me/<telefono>?text=<mensaje + url del recibo>`. El recibo ya
es una imagen en Cloudinary, así que funciona en cualquier teléfono, iPhone incluido.

## Checklist antes de dar por hecho
- [ ] Cero referencias a html2canvas en todo el repo.
- [ ] El recibo se generó en un endpoint server-side / worker.
- [ ] Se probó abriendo la URL del recibo en un iPhone real.
- [ ] Cloudinary configurado con API key/secret (subida firmada, no unsigned preset).
