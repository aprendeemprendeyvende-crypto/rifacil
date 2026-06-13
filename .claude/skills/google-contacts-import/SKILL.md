---
name: google-contacts-import
description: Usar al construir o tocar la importación de contactos/clientes desde archivos (CSV de Google Contacts, Excel exportado, listas de WhatsApp). Activar ante "importar contactos", "subir CSV", "cargar clientes", "Google contacts", "importar Excel". Maneja teléfonos múltiples (':::'), normalización venezolana y deduplicación.
---

# Importación de contactos

## Usar el parser ya hecho
`parseGoogleContacts(csvText, { tag })` de `@riffas/shared`
(`packages/shared/src/google-contacts.ts`). Hace lo que la primera versión NO hacía:
- Concatena `First + Middle + Last Name` (limpia espacios dobles).
- Lee TODAS las columnas `Phone N - Value` y **separa los múltiples por `:::`** (y `/`, `,`).
- Normaliza a E.164 con **default Venezuela** (detecta +57/+58/+56/+51/+593/+34 por número).
- **Deduplica** por teléfono; los teléfonos extra van a `notes`.
- Devuelve filas `{ name, phone, email?, city?, country, tags?, notes? }` + `stats`.

## UX obligatoria
1. El usuario sube el archivo en `dashboard/contacts`.
2. Llamar `parseGoogleContacts` en el cliente y mostrar **vista previa con stats**
   (cuántos se crean, cuántos se fusionan, cuántos inválidos, teléfonos extra).
3. Enviar `contacts` al endpoint `trpc.contact.importCSV`.
4. Debe aguantar **6.000+ filas** sin congelar la UI (procesar por lotes / worker).

## Reglas
- Nunca hardcodear el país en `normalizePhone`; el default es `"VE"`.
- También aceptar el Excel propio (columnas: Nombre, Apellido, Teléfono, Dirección, Rifa,
  Número, Fecha Apartado, Estado, Abonado, Deuda) para migrar desde la v1.
- Respetar `@@unique([userId, phone])`: no crear duplicados entre clientes del mismo rifero.
