/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@riffas/api", "@riffas/auth", "@riffas/db", "@riffas/shared"],
  // Paquetes nativos (binarios .node) que NO deben bundlearse en rutas de servidor:
  // el recibo (satori → resvg) se usa server-side dentro del saleRouter.
  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js", "satori"],
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
