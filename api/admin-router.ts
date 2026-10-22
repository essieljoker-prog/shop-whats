import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "node:crypto";
import { and, asc, desc, eq, like, or, sql, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  products,
  productImages,
  categories,
  brands,
  settings,
  adminUsers,
  testimonials,
} from "../db/schema";
import {
  hashPassword,
  verifyPassword,
  createToken,
  sessionCookie,
  clearCookie,
} from "./lib/session";
import {
  clearLoginFailures,
  isLoginAllowed,
  recordLoginFailure,
} from "./lib/login-rate-limit";
import { storage } from "./lib/storage";

const DUMMY_PASSWORD_HASH = hashPassword(crypto.randomBytes(32).toString("hex"));

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const db = getDb();
  let slug = base || "produit";
  let i = 2;
  for (;;) {
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i++}`;
  }
}

const productInput = z.object({
  name: z.string().min(2).max(180),
  description: z.string().max(5000).optional().nullable(),
  brandId: z.number().int().positive().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  price: z.number().int().min(0),
  oldPrice: z.number().int().min(0).optional().nullable(),
  currency: z.string().max(8).default("FCFA"),
  availability: z.enum(["disponible", "indisponible", "bientot"]).default("disponible"),
  condition: z.enum(["neuf", "occasion"]).default("neuf"),
  storage: z.string().max(40).optional().nullable(),
  color: z.string().max(60).optional().nullable(),
  batteryHealth: z.number().int().min(0).max(100).optional().nullable(),
  warranty: z.string().max(160).optional().nullable(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).max(40).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const adminRouter = createRouter({
  /* ---------- Authentification ---------- */

  login: publicQuery
    .input(z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(1024) }))
    .mutation(async ({ ctx, input }) => {
      const username = input.username.toLowerCase();
      if (!isLoginAllowed(username)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Identifiant ou mot de passe incorrect.",
        });
      }
      const user = await getDb().query.adminUsers.findFirst({
        where: eq(adminUsers.username, username),
      });
      const isPasswordValid = verifyPassword(
        input.password,
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      );
      if (!user || !isPasswordValid) {
        recordLoginFailure(username);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Identifiant ou mot de passe incorrect.",
        });
      }
      clearLoginFailures(username);
      ctx.resHeaders.append("Set-Cookie", sessionCookie(createToken(user.id)));
      return { id: user.id, username: user.username };
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    ctx.resHeaders.append("Set-Cookie", clearCookie());
    return { ok: true };
  }),

  me: adminQuery.query(({ ctx }) => ({
    id: ctx.admin.id,
    username: ctx.admin.username,
  })),

  changePassword: adminQuery
    .input(z.object({ current: z.string(), next: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      if (!verifyPassword(input.current, ctx.admin.passwordHash)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Mot de passe actuel incorrect." });
      }
      await getDb()
        .update(adminUsers)
        .set({ passwordHash: hashPassword(input.next) })
        .where(eq(adminUsers.id, ctx.admin.id));
      return { ok: true };
    }),

  /* ---------- Dashboard ---------- */

  dashboard: adminQuery.query(async () => {
    const db = getDb();
    const count = async (where?: SQL) => {
      const rows = await db
        .select({ n: sql<number>`count(*)` })
        .from(products)
        .where(where);
      return Number(rows[0]?.n ?? 0);
    };
    const [total, dispo, indispo, catRows, recent, updated] = await Promise.all([
      count(),
      count(eq(products.availability, "disponible")),
      count(eq(products.availability, "indisponible")),
      db.select({ n: sql<number>`count(*)` }).from(categories),
      db.select().from(products).orderBy(desc(products.createdAt)).limit(5),
      db.select().from(products).orderBy(desc(products.updatedAt)).limit(5),
    ]);
    return {
      total,
      disponibles: dispo,
      indisponibles: indispo,
      categories: Number(catRows[0]?.n ?? 0),
      recent,
      updated,
    };
  }),

  /* ---------- Produits ---------- */

  products: adminQuery
    .input(
      z.object({
        q: z.string().trim().max(120).optional(),
        status: z.enum(["all", "disponible", "indisponible", "bientot", "inactive"]).default("all"),
        categoryId: z.number().int().optional(),
      }),
    )
    .query(async ({ input }) => {
      const clauses = [];
      if (input.q) {
        const q = `%${input.q}%`;
        clauses.push(or(like(products.name, q), like(products.storage, q)));
      }
      if (input.status === "inactive") clauses.push(eq(products.active, false));
      else if (input.status !== "all") clauses.push(eq(products.availability, input.status));
      if (input.categoryId) clauses.push(eq(products.categoryId, input.categoryId));
      // Batch-fetch products and their relations to avoid LATERAL/JSON functions not supported by MariaDB 10.4
      const db = getDb();
      // Fetch the product rows without relations.
      const productRows = await db
        .select()
        .from(products)
        .where(clauses.length ? and(...clauses) : undefined)
        .orderBy(desc(products.updatedAt))
        .limit(200);

      // Extract IDs for batch queries
      const productIds = productRows.map((p) => p.id);
      const brandIds = [...new Set(productRows.map((p) => p.brandId).filter(Boolean))] as number[];
      const categoryIds = [...new Set(productRows.map((p) => p.categoryId).filter(Boolean))] as number[];

      // Batch-fetch related tables.
      const [brandRows, categoryRows, imageRows] = await Promise.all([
        brandIds.length ? db.select().from(brands).where(inArray(brands.id, brandIds)) : Promise.resolve([]),
        categoryIds.length ? db.select().from(categories).where(inArray(categories.id, categoryIds)) : Promise.resolve([]),
        productIds.length
          ? db
              .select()
              .from(productImages)
              .where(inArray(productImages.productId, productIds))
              .orderBy(asc(productImages.position))
          : Promise.resolve([]),
      ]);

      // Reassemble the shape expected by the frontend.
      return productRows.map((p) => ({
        ...p,
        brand: brandRows.find((b) => b.id === p.brandId) ?? null,
        category: categoryRows.find((c) => c.id === p.categoryId) ?? null,
        images: imageRows.filter((i) => i.productId === p.id),
      }));
    }),

  product: adminQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      // Fetch a single product and its relations without LATERAL/JSON
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      const p = product[0];
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });

      // Batch‑fetch related data for this one product
      const [brandRow, categoryRow, imageRows] = await Promise.all([
        p.brandId ? db.select().from(brands).where(eq(brands.id, p.brandId as number)).limit(1) : Promise.resolve([]),
        p.categoryId ? db.select().from(categories).where(eq(categories.id, p.categoryId as number)).limit(1) : Promise.resolve([]),
        db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, p.id))
          .orderBy(asc(productImages.position)),
      ]);

      return {
        ...p,
        brand: brandRow[0] ?? null,
        category: categoryRow[0] ?? null,
        images: imageRows,
      };
    }),

  createProduct: adminQuery.input(productInput).mutation(async ({ input }) => {
    const slug = await uniqueSlug(slugify(input.name));
    const [result] = await getDb()
      .insert(products)
      .values({ ...input, specifications: JSON.stringify(input.specifications), slug })
      .$returningId();
    return { id: result.id, slug };
  }),

  updateProduct: adminQuery
    .input(z.object({ id: z.number().int(), data: productInput.partial() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const current = await db.query.products.findFirst({
        where: eq(products.id, input.id),
      });
      if (!current) throw new TRPCError({ code: "NOT_FOUND" });
      const { specifications, ...productData } = input.data;
      const data: Partial<typeof products.$inferInsert> = {
        ...productData,
        ...(specifications !== undefined
          ? { specifications: JSON.stringify(specifications) }
          : {}),
      };
      if (input.data.name && input.data.name !== current.name) {
        data.slug = await uniqueSlug(slugify(input.data.name), input.id);
      }
      await db.update(products).set(data).where(eq(products.id, input.id));
      return { ok: true };
    }),

  deleteProduct: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(productImages).where(eq(productImages.productId, input.id));
      await db.delete(products).where(eq(products.id, input.id));
      return { ok: true };
    }),

  setAvailability: adminQuery
    .input(z.object({ id: z.number().int(), availability: z.enum(["disponible", "indisponible", "bientot"]) }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(products)
        .set({ availability: input.availability })
        .where(eq(products.id, input.id));
      return { ok: true };
    }),

  /* ---------- Images produit ---------- */

  addImages: adminQuery
    .input(z.object({ productId: z.number().int(), keys: z.array(z.string()).min(1).max(12) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.productImages.findMany({
        where: eq(productImages.productId, input.productId),
      });
      let position = existing.reduce((m, i) => Math.max(m, i.position), -1) + 1;
      const hasPrimary = existing.some((i) => i.isPrimary);
      for (const [idx, key] of input.keys.entries()) {
        await db.insert(productImages).values({
          productId: input.productId,
          imageKey: key,
          position: position++,
          isPrimary: !hasPrimary && idx === 0,
        });
      }
      return { ok: true };
    }),

  reorderImages: adminQuery
    .input(z.object({ productId: z.number().int(), orderedIds: z.array(z.number().int()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [pos, id] of input.orderedIds.entries()) {
        await db
          .update(productImages)
          .set({ position: pos })
          .where(and(eq(productImages.id, id), eq(productImages.productId, input.productId)));
      }
      return { ok: true };
    }),

  setPrimaryImage: adminQuery
    .input(z.object({ productId: z.number().int(), imageId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, input.productId));
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(and(eq(productImages.id, input.imageId), eq(productImages.productId, input.productId)));
      return { ok: true };
    }),

  deleteImage: adminQuery
    .input(z.object({ imageId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const img = await db.query.productImages.findFirst({
        where: eq(productImages.id, input.imageId),
      });
      if (!img) return { ok: true };
      await db.delete(productImages).where(eq(productImages.id, input.imageId));
      const otherReferences = await db
        .select({ id: productImages.id })
        .from(productImages)
        .where(eq(productImages.imageKey, img.imageKey))
        .limit(1);
      if (otherReferences.length === 0) {
        await storage.deleteFile({ fileKey: img.imageKey });
      }
      // Si c'était l'image principale, promouvoir la première restante
      if (img.isPrimary) {
        const next = await db.query.productImages.findFirst({
          where: eq(productImages.productId, img.productId),
          orderBy: [asc(productImages.position)],
        });
        if (next) {
          await db.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
        }
      }
      return { ok: true };
    }),

  /* ---------- Catégories ---------- */

  categories: adminQuery.query(async () => {
    const db = getDb();
    const cats = await db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
    const counts = await db
      .select({ categoryId: products.categoryId, n: sql<number>`count(*)` })
      .from(products)
      .groupBy(products.categoryId);
    const map = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));
    return cats.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 }));
  }),

  saveCategory: adminQuery
    .input(
      z.object({
        id: z.number().int().optional(),
        name: z.string().min(2).max(120),
        description: z.string().max(280).optional().nullable(),
        imageKey: z.string().max(512).optional().nullable(),
        active: z.boolean().default(true),
        position: z.number().int().default(0),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const slug = slugify(input.name);
      if (input.id) {
        await db
          .update(categories)
          .set({ name: input.name, slug, description: input.description ?? null, imageKey: input.imageKey ?? null, active: input.active, position: input.position })
          .where(eq(categories.id, input.id));
        return { id: input.id };
      }
      const [result] = await db
        .insert(categories)
        .values({ name: input.name, slug, description: input.description ?? null, imageKey: input.imageKey ?? null, active: input.active, position: input.position })
        .$returningId();
      return { id: result.id };
    }),

  deleteCategory: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const used = await db
        .select({ n: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.categoryId, input.id));
      if (Number(used[0]?.n ?? 0) > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Des produits utilisent cette catégorie. Réaffectez-les d'abord.",
        });
      }
      await db.delete(categories).where(eq(categories.id, input.id));
      return { ok: true };
    }),

  /* ---------- Marques ---------- */

  brands: adminQuery.query(async () => {
    return getDb().select().from(brands).orderBy(asc(brands.name));
  }),

  saveBrand: adminQuery
    .input(
      z.object({
        id: z.number().int().optional(),
        name: z.string().min(1).max(120),
        logoKey: z.string().max(512).optional().nullable(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const slug = slugify(input.name);
      if (input.id) {
        await db.update(brands).set({ name: input.name, slug, logoKey: input.logoKey ?? null, active: input.active }).where(eq(brands.id, input.id));
        return { id: input.id };
      }
      const [result] = await db.insert(brands).values({ name: input.name, slug, logoKey: input.logoKey ?? null, active: input.active }).$returningId();
      return { id: result.id };
    }),

  deleteBrand: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const used = await db
        .select({ n: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.brandId, input.id));
      if (Number(used[0]?.n ?? 0) > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Des produits utilisent cette marque. Réaffectez-les d'abord.",
        });
      }
      await db.delete(brands).where(eq(brands.id, input.id));
      return { ok: true };
    }),

  /* ---------- Témoignages ---------- */

  testimonials: adminQuery.query(async () =>
    getDb().select().from(testimonials).orderBy(desc(testimonials.updatedAt)),
  ),

  saveTestimonial: adminQuery
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        displayName: z.string().trim().min(1).max(80),
        content: z.string().trim().min(10).max(1500),
        source: z.enum(["boutique", "whatsapp"]),
        dateLabel: z.string().trim().max(40).optional().nullable(),
        status: z.enum(["draft", "pending", "published", "archived"]),
        publicationConsent: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.status === "published" && !input.publicationConsent) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Une autorisation explicite est requise avant publication.",
        });
      }

      const db = getDb();
      const values = {
        displayName: input.displayName,
        content: input.content,
        source: input.source,
        dateLabel: input.dateLabel || null,
        status: input.status,
        publicationConsent: input.publicationConsent,
        consentConfirmedAt: input.publicationConsent ? new Date() : null,
      };

      if (input.id) {
        await db.update(testimonials).set(values).where(eq(testimonials.id, input.id));
        return { id: input.id };
      }

      const [result] = await db.insert(testimonials).values(values).$returningId();
      return { id: result.id };
    }),

  /* ---------- Paramètres ---------- */

  settings: adminQuery.query(async () => {
    const rows = await getDb().select().from(settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  }),

  saveSettings: adminQuery
    .input(z.record(z.string(), z.string().max(2000)))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [key, value] of Object.entries(input)) {
        await db
          .insert(settings)
          .values({ key, value })
          .onDuplicateKeyUpdate({ set: { value } });
      }
      return { ok: true };
    }),
});
