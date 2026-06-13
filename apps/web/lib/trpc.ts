import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@riffas/api";

/**
 * Cliente tRPC v10 para React (react-query v4).
 * Los hooks se consumen como `api.contact.list.useQuery(...)`.
 */
export const api = createTRPCReact<AppRouter>();

function getBaseUrl(): string {
  // Navegador: ruta relativa.
  if (typeof window !== "undefined") return "";
  // SSR: URL absoluta.
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Opciones del cliente. El transformer DEBE coincidir con packages/api/src/trpc.ts
 * (que usa superjson). En tRPC v10 el transformer va en la raíz del cliente.
 */
export const trpcClientOptions = {
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
};
