import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { normalizePhone, parseGoogleContacts, countryFromE164 } from "@riffas/shared";

export const contactRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        minSpent: z.number().optional(),
        maxSpent: z.number().optional(),
        hasPurchased: z.boolean().optional(),
        lastPurchaseDays: z.number().optional(),
        source: z.string().optional(),
        city: z.string().optional(),
        sortBy: z.enum(["name", "totalSpent", "lastPurchase", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const {
        search,
        tags,
        minSpent,
        maxSpent,
        hasPurchased,
        lastPurchaseDays,
        source,
        city,
        sortBy = "createdAt",
        sortOrder = "desc",
        limit = 20,
        cursor,
      } = input || {};

      const where: any = { userId: session.user.id };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ];
      }

      if (tags && tags.length > 0) where.tags = { hasSome: tags };
      if (minSpent !== undefined) where.totalSpent = { ...where.totalSpent, gte: minSpent };
      if (maxSpent !== undefined) where.totalSpent = { ...where.totalSpent, lte: maxSpent };
      if (hasPurchased !== undefined) {
        if (hasPurchased) where.totalSpent = { gt: 0 };
        else where.totalSpent = { equals: 0 };
      }
      if (lastPurchaseDays !== undefined) {
        if (lastPurchaseDays > 0) {
          where.lastPurchase = { gte: new Date(Date.now() - lastPurchaseDays * 86400000) };
        } else {
          where.lastPurchase = { lte: new Date(Date.now() - Math.abs(lastPurchaseDays) * 86400000) };
        }
      }
      if (source) where.source = source;
      if (city) where.city = { contains: city, mode: "insensitive" };

      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const contacts = await prisma.contact.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy,
        include: {
          _count: { select: { sales: true, numbers: true } },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (contacts.length > limit) {
        const nextItem = contacts.pop();
        nextCursor = nextItem!.id;
      }

      return { contacts, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          sales: {
            orderBy: { createdAt: "desc" },
            include: { raffle: { select: { id: true, title: true, prize: true } } },
          },
          numbers: {
            include: { raffle: { select: { id: true, title: true } } },
          },
        },
      });

      if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
      return contact;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        city: z.string().optional(),
        country: z.string().default("VE"),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        birthday: z.string().datetime().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;

      const phone = normalizePhone(input.phone, "VE");
      if (!phone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Número de teléfono inválido",
        });
      }
      const country = countryFromE164(phone);

      const existing = await prisma.contact.findFirst({
        where: { userId: session.user.id, phone },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un contacto con este número de teléfono",
        });
      }

      const contact = await prisma.contact.create({
        data: {
          ...input,
          phone,
          country,
          userId: session.user.id,
          birthday: input.birthday ? new Date(input.birthday) : undefined,
        },
      });

      return contact;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(1).optional(),
          phone: z.string().min(8).optional(),
          email: z.string().email().optional().nullable(),
          city: z.string().optional().nullable(),
          country: z.string().optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional().nullable(),
          birthday: z.string().datetime().optional().nullable(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: any = {
        ...input.data,
        birthday: input.data.birthday ? new Date(input.data.birthday) : input.data.birthday,
      };

      if (input.data.phone) {
        const phone = normalizePhone(input.data.phone, "VE");
        if (!phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Número de teléfono inválido",
          });
        }
        data.phone = phone;
        data.country = countryFromE164(phone);
      }

      const contact = await ctx.prisma.contact.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data,
      });
      return contact;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.contact.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return { success: true };
    }),

  importCSV: protectedProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            name: z.string().min(1),
            phone: z.string().min(8),
            email: z.string().email().optional().nullable(),
            city: z.string().optional().nullable(),
            tags: z.array(z.string()).optional(),
            notes: z.string().optional().nullable(),
          })
        ),
        format: z.enum(["google_contacts", "excel_simple", "whatsapp_export", "custom"]).default("custom"),
        skipDuplicates: z.boolean().default(true),
        updateExisting: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { data, skipDuplicates, updateExisting } = input;

      const results = {
        total: data.length,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [] as Array<{ row: number; error: string }>,
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const normalizedPhone = normalizePhone(row.phone, "VE");
          if (!normalizedPhone) {
            results.errors.push({ row: i + 1, error: "Teléfono inválido" });
            continue;
          }
          const country = countryFromE164(normalizedPhone);

          const existing = await prisma.contact.findFirst({
            where: { userId: session.user.id, phone: normalizedPhone },
          });

          if (existing) {
            if (updateExisting) {
              await prisma.contact.update({
                where: { id: existing.id },
                data: {
                  name: row.name || existing.name,
                  email: row.email || existing.email,
                  city: row.city || existing.city,
                  tags: row.tags ? [...new Set([...existing.tags, ...row.tags])] : undefined,
                  importedFrom: input.format,
                  importedAt: new Date(),
                },
              });
              results.updated++;
            } else if (skipDuplicates) {
              results.skipped++;
            }
          } else {
            await prisma.contact.create({
              data: {
                name: row.name,
                phone: normalizedPhone,
                country,
                email: row.email,
                city: row.city,
                tags: row.tags || [],
                notes: row.notes,
                userId: session.user.id,
                source: input.format,
                importedFrom: input.format,
                importedAt: new Date(),
              },
            });
            results.imported++;
          }
        } catch (error: any) {
          results.errors.push({ row: i + 1, error: error.message });
        }
      }

      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { contactsUsed: { increment: results.imported } },
      });

      return results;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, session } = ctx;

    const [total, withPurchases, newThisMonth, topSpenders] = await Promise.all([
      prisma.contact.count({ where: { userId: session.user.id } }),
      prisma.contact.count({ where: { userId: session.user.id, totalSpent: { gt: 0 } } }),
      prisma.contact.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.contact.findMany({
        where: { userId: session.user.id },
        orderBy: { totalSpent: "desc" },
        take: 5,
        select: { id: true, name: true, phone: true, totalSpent: true, totalTickets: true },
      }),
    ]);

    return { total, withPurchases, newThisMonth, topSpenders };
  }),
});
