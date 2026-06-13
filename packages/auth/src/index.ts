import type { NextAuthOptions } from "next-auth";
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@riffas/db";
import { normalizePhone } from "@riffas/shared";
import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Config de NextAuth v4 que el repo ya espera:
 *  - packages/api/src/trpc.ts          → import { getServerSession } from "@riffas/auth"
 *  - apps/web/app/api/auth/[...]/route → import { authOptions } from "@riffas/auth"
 *
 * Estrategia: email+contraseña (Credentials + bcrypt) sobre el campo User.passwordHash.
 * Sesión JWT (obligatoria con Credentials). Google opcional. PrismaAdapter(@riffas/db).
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        telefono: { label: "Teléfono", type: "tel" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.telefono || !credentials?.password) return null;

        // El rifero escribe "0424…"; lo normalizamos a E.164 ("+58424…") para buscar.
        const phone = normalizePhone(credentials.telefono, "VE");
        if (!phone) return null;

        const user = await prisma.user.findUnique({
          where: { phone },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? user.avatar,
        };
      },
    }),
    // Opcional: login con Google (requiere GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Con estrategia JWT el id del usuario viaja en el token y se expone en session.user.id
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Helper para el App Router (handler `fetch`): lee la sesión SIN `res`.
 * `getServerSession(req,res)` falla en route handlers porque `res` es undefined
 * (intenta `res.getHeader`). `getToken` decodifica el JWT desde la cookie del request.
 */
export async function getSessionFromRequest(req: unknown) {
  const r = req as { headers?: { get?: (k: string) => string | null; cookie?: string } };
  const cookieStr =
    (typeof r?.headers?.get === "function" ? r.headers.get("cookie") : r?.headers?.cookie) ?? "";

  // next-auth v4 getToken() lee req.cookies COMO OBJETO ya parseado (no parsea el header).
  const cookies: Record<string, string> = {};
  for (const part of cookieStr.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    if (k) cookies[k] = decodeURIComponent(part.slice(i + 1).trim());
  }

  const token = await getToken({
    req: { cookies, headers: { cookie: cookieStr } } as unknown as NextApiRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id) return null;

  return {
    user: {
      id: token.id as string,
      name: (token.name as string | null) ?? null,
      email: (token.email as string | null) ?? null,
      image: (token.picture as string | null) ?? null,
    },
    expires: "",
  };
}

/**
 * Variante pages-API (req, res). Conservada por compatibilidad.
 */
export function getServerSession(req: NextApiRequest, res: NextApiResponse) {
  return nextAuthGetServerSession(req, res, authOptions);
}

// Augmentación de tipos: session.user.id (lo usa trpc.ts → ctx.session.user.id)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
