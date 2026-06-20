// Build de Vercel con migración de prod incluida.
//
// Por qué existe: el deploy de Vercel NO aplica migraciones solo (el build es
// `turbo run build`). Antes había que correr `prisma migrate deploy` a mano
// contra prod en cada merge; olvidarlo dejó a prod sin una columna y tumbó la
// landing (ver memoria prod-migrations-manual). Esto lo automatiza, SOLO en
// producción.
//
// Reglas:
//  - Guard: solo migra cuando VERCEL_ENV === "production". En preview/develop
//    se saltea (esos builds no deben tocar el schema de prod, y DIRECT_URL solo
//    está seteada en Production).
//  - Corre desde packages/db (`--filter @riffas/db`); `prisma migrate deploy`
//    usa datasource.directUrl = env("DIRECT_URL") (conexión directa, no-pooler).
//  - Fail-safe: si la migración falla, execSync lanza → el proceso sale !=0 →
//    el build de Vercel falla → el deploy queda BLOQUEADO (no servimos código
//    nuevo contra un schema viejo).

import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV ?? "(unset)";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (env === "production") {
  console.log("[vercel-build] VERCEL_ENV=production → prisma migrate deploy (packages/db, DIRECT_URL)…");
  run("pnpm --filter @riffas/db exec prisma migrate deploy");
} else {
  console.log(`[vercel-build] VERCEL_ENV=${env} → skip migraciones (solo producción).`);
}

console.log("[vercel-build] turbo run build…");
run("turbo run build");
