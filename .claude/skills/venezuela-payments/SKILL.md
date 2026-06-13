---
name: venezuela-payments
description: Usar al implementar cobros, métodos de pago, confirmación de comprobantes, o conversión de moneda (USD/VES). Activar ante "pago móvil", "binance", "zelle", "tasa", "bolívares", "BCV", "confirmar pago", "subir comprobante", "precio en bolívares". La base de usuarios es ~80% venezolana: los pagos venezolanos son prioridad, no un extra.
---

# Pagos y multimoneda para Venezuela

## Contexto
Precios en **USD**, pero muchos pagos entran en **bolívares (VES)**. Métodos prioritarios:
**Pago Móvil, Binance/USDT, Zelle, efectivo USD/VES**. Los métodos colombianos
(Nequi, Daviplata, PSE, Wompi) se conservan pero NO son el default.

## Schema (ya parcheado en patches/venezuela-localization.md)
- `enum PaymentMethod` incluye `PAGO_MOVIL, BINANCE, ZELLE, EFECTIVO_USD, EFECTIVO_VES, TRANSFERENCIA_VES`.
- `model ExchangeRate` (vesPerUsd, source BCV/BINANCE/MANUAL, isActive) — tasa por rifero.
- `Sale.rateUsed` y `Sale.amountVes` guardan la tasa y el monto en VES al momento de cobrar.
- Datos de cobro del rifero en `UserSettings` (pmPhone, pmIdNumber, binanceEmail, zelleEmail...).

## Flujo de confirmación por comprobante
1. Comprador elige método y **sube captura** → `Sale.status = PENDING`, `paymentProof = url`.
2. Rifero ve el comprobante y **aprueba con un toque** → `status = PAID` → dispara `generateReceipt`.
3. Guardar `paymentReference` (referencia bancaria) para auditoría.

## Tasa de cambio
- Un worker actualiza `ExchangeRate` (BCV y/o Binance) periódicamente.
- En el checkout, mostrar SIEMPRE **precio dual**: USD y su equivalente en VES con la tasa activa.
- Avanzado: Pago Móvil C2P con validación automática contra el API del banco (referencia + cédula + teléfono).

## Reglas
- Default de métodos aceptados: `[PAGO_MOVIL, BINANCE, ZELLE, EFECTIVO_USD]`.
- Nunca asumir Colombia. Si falta un método venezolano, es un bug.
