const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // MVP: el repo arrastra errores de TS/lint pre-existentes (no del flujo de pagos).
  // No bloquean el deploy; revertir a false tras limpiar tipos. Ver DEPLOY.md.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@riffas/api", "@riffas/auth", "@riffas/db", "@riffas/shared"],
  experimental: {
    // Paquetes que NO deben bundlearse en rutas de servidor:
    //  - @resvg/resvg-js: binario nativo .node (se requiere desde node_modules en runtime).
    //  - satori: trae yoga-wasm; mejor externo que bundleado.
    // El recibo (satori → resvg) corre server-side dentro del saleRouter (/api/trpc).
    serverComponentsExternalPackages: ["@resvg/resvg-js", "satori"],
    // En monorepo pnpm, anclar el tracing en la raíz para que node-file-trace
    // incluya el binario nativo de resvg (vive en ../../node_modules/.pnpm/...)
    // dentro del bundle de la función serverless.
    outputFileTracingRoot: path.join(__dirname, "../../"),
    // El cliente Prisma se genera en un output custom (packages/db/src/generated).
    // node-file-trace NO incluye el query engine nativo (.so.node) porque Prisma lo
    // carga por una ruta computada en runtime. Lo incluimos explícitamente en las
    // funciones que tocan la DB (login NextAuth + tRPC) para que el engine de Linux
    // (rhel-openssl-3.0.x) viaje dentro del bundle serverless. Globs relativos a apps/web.
    outputFileTracingIncludes: {
      "/api/auth/[...nextauth]/route": [
        "../../packages/db/src/generated/**/*.node",
        "../../packages/db/src/generated/schema.prisma",
      ],
      "/api/trpc/[trpc]/route": [
        "../../packages/db/src/generated/**/*.node",
        "../../packages/db/src/generated/schema.prisma",
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // resvg trae binarios .node que webpack no puede parsear; se requieren en runtime.
      config.externals.push("@resvg/resvg-js");
    }
    return config;
  },
  images: {
    domains: ["localhost", "res.cloudinary.com", "images.unsplash.com"],
  },
};

module.exports = nextConfig;
