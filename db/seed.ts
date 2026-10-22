import { closeDb, getDb } from "../api/queries/connection";
import {
  categories,
  brands,
  products,
  settings,
} from "./schema";
import { assertDedicatedLocalDatabase } from "../api/lib/local-database";
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  slugifyCatalogName,
} from "./catalog-defaults";
import type { Product } from "./schema";

type DemoProduct = Pick<Product, "name" | "price" | "condition" | "categoryId" | "brandId"> &
  Partial<
    Pick<
      Product,
      | "oldPrice"
      | "availability"
      | "storage"
      | "color"
      | "batteryHealth"
      | "warranty"
      | "featured"
    >
  >;

/**
 * Données initiales Manaaf.
 * Les produits ci-dessous sont des EXEMPLES de démonstration :
 * le propriétaire les remplace depuis /admin (aucun prix réel garanti).
 */
async function seed() {
  assertDedicatedLocalDatabase();
  const db = getDb();
  console.log("Seeding Manaaf...");

  // --- Réglages publics ---
  const baseSettings: Record<string, string> = {
    shop_name: "Manaaf",
    currency: "FCFA",
    whatsapp: "2290151217271",
    phone: "+229 01 51 21 72 71",
    phone2: "+229 01 96 03 72 15",
    address:
      "Saint-Michel, Cotonou — deuxième von après la von des techniciens",
    hours: "[À CONFIRMER] Lun – Sam : 9h – 19h",
    tiktok: "https://www.tiktok.com/@smg.plug1",
    instagram: "https://www.instagram.com/smg.plug",
    facebook: "https://www.facebook.com/smgpluq",
  };
  for (const [key, value] of Object.entries(baseSettings)) {
    await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  }

  // --- Catégories ---
  for (const c of DEFAULT_CATEGORIES) {
    const slug = slugifyCatalogName(c.name);
    await db.insert(categories).values({ ...c, slug }).onDuplicateKeyUpdate({ set: { name: c.name, position: c.position } });
  }

  // --- Marques ---
  for (const name of DEFAULT_BRANDS) {
    const slug = slugifyCatalogName(name);
    await db.insert(brands).values({ name, slug }).onDuplicateKeyUpdate({ set: { name } });
  }

  // --- Produits de démonstration ---
  const allCats = await db.select().from(categories);
  const allBrands = await db.select().from(brands);
  const cat = (n: string) => allCats.find((c) => c.name === n)?.id ?? null;
  const brand = (n: string) => allBrands.find((b) => b.name === n)?.id ?? null;

  const demoProducts: DemoProduct[] = [
    { name: "iPhone 15 Pro", storage: "256 Go", color: "Titane naturel", price: 475000, condition: "occasion" as const, batteryHealth: 89, categoryId: cat("iPhone"), brandId: brand("Apple"), featured: true, warranty: "Garantie boutique 3 mois" },
    { name: "iPhone 13", storage: "128 Go", color: "Minuit", price: 285000, oldPrice: 310000, condition: "occasion" as const, batteryHealth: 91, categoryId: cat("iPhone"), brandId: brand("Apple"), featured: true, warranty: "Garantie boutique 3 mois" },
    { name: "iPhone 12", storage: "128 Go", color: "Bleu", price: 215000, condition: "occasion" as const, batteryHealth: 86, categoryId: cat("iPhone"), brandId: brand("Apple"), warranty: "Garantie boutique 3 mois" },
    { name: "Samsung Galaxy S23", storage: "256 Go", color: "Noir", price: 340000, condition: "occasion" as const, batteryHealth: 92, categoryId: cat("Samsung"), brandId: brand("Samsung"), featured: true },
    { name: "Samsung Galaxy A15", storage: "128 Go", color: "Bleu nuit", price: 95000, condition: "neuf" as const, categoryId: cat("Samsung"), brandId: brand("Samsung"), featured: true, warranty: "Garantie constructeur 12 mois" },
    { name: "Tecno Spark 20", storage: "128 Go", color: "Noir", price: 78000, condition: "neuf" as const, categoryId: cat("Tecno"), brandId: brand("Tecno"), warranty: "Garantie constructeur 12 mois" },
    { name: "Infinix Hot 40i", storage: "128 Go", color: "Vert", price: 69000, condition: "neuf" as const, categoryId: cat("Infinix"), brandId: brand("Infinix") },
    { name: "Redmi 13C", storage: "128 Go", color: "Bleu", price: 72000, condition: "neuf" as const, categoryId: cat("Xiaomi"), brandId: brand("Xiaomi") },
    { name: "Google Pixel 8", storage: "128 Go", color: "Obsidienne", price: 365000, condition: "occasion" as const, batteryHealth: 94, categoryId: cat("Google Pixel"), brandId: brand("Google"), featured: true },
    { name: "AirPods Pro 2", price: 135000, condition: "neuf" as const, categoryId: cat("Accessoires"), brandId: brand("Apple"), featured: true },
    { name: "Manette PS5 DualSense", price: 45000, condition: "neuf" as const, categoryId: cat("Gaming & Gadgets"), brandId: brand("Sony") },
    { name: "Écouteurs JBL Tune", price: 18000, condition: "neuf" as const, categoryId: cat("Accessoires"), brandId: brand("JBL"), availability: "bientot" as const },
  ];

  for (const p of demoProducts) {
    const slug = p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const existing = await db.query.products.findFirst({ where: (t, { eq }) => eq(t.slug, slug) });
    if (existing) continue;
    await db.insert(products).values({
      slug,
      description: null,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      currency: "FCFA",
      availability: p.availability ?? "disponible",
      condition: p.condition,
      storage: p.storage ?? null,
      color: p.color ?? null,
      batteryHealth: p.batteryHealth ?? null,
      warranty: p.warranty ?? null,
      specifications: "[]",
      featured: p.featured ?? false,
      categoryId: p.categoryId,
      brandId: p.brandId,
      name: p.name,
    });
  }

  console.log("Seed terminé.");
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() =>
    closeDb().catch((error: unknown) => {
      console.error("Local database connection could not be closed:", error);
      process.exitCode = 1;
    }),
  );
