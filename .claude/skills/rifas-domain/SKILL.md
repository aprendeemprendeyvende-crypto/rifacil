---
name: rifas-domain
description: Usar al diseñar o construir rifas, números/boletos, ventas, vendedores, campañas o el storefront público. Activar ante "rifa", "número", "boleto", "vendedor", "comisión", "sorteo", "premio", "apartado", "campaña". Define el modelo de negocio y las funciones de la v1 que NO se deben perder.
---

# Dominio de negocio — Rifas

## Conceptos
- **Rifa:** números de 2 a 5 cifras (00–99 … 0000–9999), atada a una **lotería real**
  (ej. "Lotería Táchira", "Triple A/B 10:10pm") que decide el ganador. Precio por boleto en USD.
- **Número/boleto:** estados `disponible | apartado | por_confirmar | vendido`.
  Color: gris / naranja / amarillo / verde.
- **Apartado con abono:** se puede vender completo o apartar con abono parcial
  (Valor total / Abonado / Deuda).

## Features de la v1 que NO se pueden perder (estaban en su API real)
- **Vendedores** con asignación y **recaudo por vendedor** (`recaudoByVendedor`) + comisiones.
- **Números compartidos**: aceptar/rechazar un número compartido entre clientes.
- **Avisos por WhatsApp** por número/cliente (`whatsapp-aviso`), incluido recordatorio de deuda.
- **Gastos por rifa** (expenses) para calcular utilidad.
- **Ofertas/promos** (ej. "2x100$").
- **Tasas** USD/VES (ver skill venezuela-payments).
- **Exportar a Excel** (clientes y números).

## Funciones nuevas (lo que nos hace superiores)
- **Storefront público white-label** por rifero (subdominio/dominio propio): el comprador
  ve la rifa, elige números, paga o sube comprobante y recibe su recibo, sin crear cuenta.
- **Verificador de boletos** por teléfono/número (genera confianza).
- **Campañas de WhatsApp integradas** (no en panel aparte): segmentar el CRM, plantilla,
  imagen, métricas (enviados/leídos/respondidos/costo) y costo estimado ANTES de enviar.

## UX
Mobile-first, PWA instalable probada en iOS, español, moneda dual USD/VES, operable con el pulgar.
Cada query filtra por `userId` (aislamiento multi-tenant).
