// Catalog router with batch-fetch implementation compatible with MariaDB 10.4

import { z } from "zod";
import { and, desc, asc, eq, ne, gte, lte, like, or, inArray, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import type { Product, Brand, Category, ProductImage } from "../db/schema";

import { products, categories, brands, settings, productImages, testimonials } from "../db/schema";
import { storage } from "./lib/storage";



/** Helper to enrich product rows with related brand, category, and images. */
async function enrichProducts(
  productRows: Product[],
  db: ReturnType<typeof getDb>,
): Promise<(Product & { brand: Brand | null; category: Category | null; images: ProductImage[] })[]> {
  const productIds = productRows.map((p) => p.id);
  const brandIds = [...new Set(productRows.map((p) => p.brandId).filter(Boolean))] as number[];
  const categoryIds = [...new Set(productRows.map((p) => p.categoryId).filter(Boolean))] as number[];

  const [brandRows, categoryRows, imageRows] = await Promise.all([
    brandIds.length ? db.select().from(brands).where(inArray(brands.id, brandIds)) : Promise.resolve([]),
    categoryIds.length ? db.select().from(categories).where(inArray(categories.id, categoryIds)) : Promise.resolve([]),
    productIds.length
      ? db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position))
      : Promise.resolve([]),
  ]);

  return productRows.map((p) => ({
    ...p,
    brand: (brandRows as Brand[]).find((b) => b.id === p.brandId) ?? null,
    category: (categoryRows as Category[]).find((c) => c.id === p.categoryId) ?? null,
    images: (imageRows as ProductImage[]).filter((i) => i.productId === p.id),
  }));
}


export const catalogRouter = createRouter({
  /** Réglages publics (devise, WhatsApp, adresse, horaires, réseaux). */
  settings: publicQuery.query(async () => {
    const rows = await getDb().select().from(settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  }),

  /** Catégories actives avec nombre de produits. */
  categories: publicQuery
    .input(
      z.object({
        previousImages: z.record(z.string(), z.string().max(512)).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const cats = await db
        .select()
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(asc(categories.position), asc(categories.name));
      const [counts, categoryImages] = await Promise.all([
        db
          .select({ categoryId: products.categoryId, n: sql<number>`count(*)` })
          .from(products)
          .where(eq(products.active, true))
          .groupBy(products.categoryId),
        db
          .select({ categoryId: products.categoryId, imageKey: productImages.imageKey })
          .from(productImages)
          .innerJoin(products, eq(productImages.productId, products.id))
          .where(and(eq(products.active, true), sql`${products.categoryId} IS NOT NULL`)),
      ]);
      const map = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));
      const imagesByCategory = new Map<number, string[]>();
      for (const image of categoryImages) {
        if (image.categoryId === null) continue;
        const imageKeys = imagesByCategory.get(image.categoryId) ?? [];
        imageKeys.push(image.imageKey);
        imagesByCategory.set(image.categoryId, imageKeys);
      }
      return cats.map((category) => {
        const imageKeys = [...new Set(imagesByCategory.get(category.id) ?? [])];
        const previousImage = input?.previousImages?.[String(category.id)];
        const alternatives = imageKeys.filter((imageKey) => imageKey !== previousImage);
        const candidates = alternatives.length > 0 ? alternatives : imageKeys;
        return {
          ...category,
          productCount: map.get(category.id) ?? 0,
          imageKey: candidates.length
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : null,
        };
      });
    }),

  brands: publicQuery.query(async () => {
    return getDb()
      .selectDistinct({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoKey: brands.logoKey,
        active: brands.active,
        createdAt: brands.createdAt,
      })
      .from(brands)
      .where(eq(brands.active, true))
      .orderBy(asc(brands.name));
  }),

  testimonials: publicQuery.query(async () =>
    getDb()
      .select({
        id: testimonials.id,
        displayName: testimonials.displayName,
        content: testimonials.content,
        source: testimonials.source,
        dateLabel: testimonials.dateLabel,
      })
      .from(testimonials)
      .where(and(eq(testimonials.status, "published"), eq(testimonials.publicationConsent, true)))
      .orderBy(desc(testimonials.createdAt))
      .limit(12),
  ),

  /** Produits à la une + dernières occasions pour la homepage. */
  home: publicQuery.query(async () => {
    const db = getDb();
    const featuredRows = await db
      .select()
      .from(products)
      .where(and(eq(products.active, true), eq(products.featured, true)))
      .orderBy(desc(products.updatedAt))
      .limit(8);
    const promotionRows = await db
      .select()
      .from(products)
      .where(and(eq(products.active, true), sql`${products.oldPrice} > ${products.price}`))
      .orderBy(desc(products.updatedAt))
      .limit(12);
    const latestRows = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(8);
    const occasionsRows = await db
      .select()
      .from(products)
      .where(and(eq(products.active, true), eq(products.condition, "occasion")))
      .orderBy(asc(products.price))
      .limit(6);
    const [featured, promotions, latest, occasions] = await Promise.all([
      enrichProducts(featuredRows, db),
      enrichProducts(promotionRows, db),
      enrichProducts(latestRows, db),
      enrichProducts(occasionsRows, db),
    ]);
    return { featured, promotions, latest, occasions };
  }),

  /** Catalogue avec recherche, filtres et tri. */
  products: publicQuery
    .input(
      z.object({
        q: z.string().trim().max(120).optional(),
        categorySlug: z.string().optional(),
        brandId: z.number().int().positive().optional(),
        condition: z.enum(["neuf", "occasion"]).optional(),
        minPrice: z.number().int().min(0).optional(),
        maxPrice: z.number().int().min(0).optional(),
        sort: z.enum(["recent", "price_asc", "price_desc", "name"]).default("recent"),
        limit: z.number().int().min(1).max(60).default(24),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const clauses = [eq(products.active, true)];
      if (input.categorySlug) {
        const cat = await db.query.categories.findFirst({ where: eq(categories.slug, input.categorySlug) });
        if (!cat) return { items: [], total: 0 };
        clauses.push(eq(products.categoryId, cat.id));
      }
      if (input.brandId) clauses.push(eq(products.brandId, input.brandId));
      if (input.condition) clauses.push(eq(products.condition, input.condition));
      if (input.minPrice != null) clauses.push(gte(products.price, input.minPrice));
      if (input.maxPrice != null) clauses.push(lte(products.price, input.maxPrice));
      if (input.q) {
        const q = `%${input.q}%`;
        const matchedBrands = await db.select({ id: brands.id }).from(brands).where(like(brands.name, q));
        const brandIds = matchedBrands.map((b) => b.id);
        clauses.push(
          or(
            like(products.name, q),
            like(products.description, q),
            like(products.storage, q),
            brandIds.length ? inArray(products.brandId, brandIds) : undefined
          )!
        );
      }
      const order =
        input.sort === "price_asc"
          ? [asc(products.price)]
          : input.sort === "price_desc"
          ? [desc(products.price)]
          : input.sort === "name"
          ? [asc(products.name)]
          : [desc(products.createdAt)];
      const where = and(...clauses);
      // Paginated product rows
      const productRows = await db
        .select()
        .from(products)
        .where(where)
        .orderBy(...order)
        .limit(input.limit)
        .offset(input.offset);
      const items = await enrichProducts(productRows, db);
      const totalRows = await db
        .select({ n: sql<number>`count(*)` })
        .from(products)
        .where(where);
      return { items, total: Number(totalRows[0]?.n ?? 0) };
    }),

  /** Fiche produit complète par slug. */
  productBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const productRows = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, input.slug), eq(products.active, true)))
        .limit(1);
      const product = productRows[0];
      if (!product) return null;
      const [productWithRelations] = await enrichProducts([product], db);
      // Related products – same category, different id
      const relatedRows = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.active, true),
            eq(products.categoryId, product.categoryId ?? 0),
            ne(products.id, product.id)
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(4);
      const related = await enrichProducts(relatedRows, db);
      return { product: productWithRelations, related };
    }),

  /** URLs signées temporaires pour afficher des images (clés → URLs). */
  imageUrls: publicQuery
    .input(z.object({ keys: z.array(z.string()).max(60) }))
    .query(async ({ input }) => {
      if (input.keys.length === 0) return {};
      const { urls } = await storage.getPresignedUrls({ keys: input.keys });
      return Object.fromEntries(
        urls
          .filter((u) => u.key && u.url)
          .map((u) => [u.key as string, u.url as string])
      );
    }),
});
