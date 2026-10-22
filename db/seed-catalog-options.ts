import { closeDb, getDb } from "../api/queries/connection";
import { assertDedicatedLocalDatabase } from "../api/lib/local-database";
import { brands, categories } from "./schema";
import {
  DEFAULT_BRANDS,
  DEFAULT_CATEGORIES,
  slugifyCatalogName,
} from "./catalog-defaults";

async function seedCatalogOptions() {
  assertDedicatedLocalDatabase();
  const db = getDb();

  for (const category of DEFAULT_CATEGORIES) {
    const slug = slugifyCatalogName(category.name);
    await db
      .insert(categories)
      .values({ ...category, slug })
      .onDuplicateKeyUpdate({
        set: { name: category.name, position: category.position },
      });
  }

  for (const name of DEFAULT_BRANDS) {
    await db
      .insert(brands)
      .values({ name, slug: slugifyCatalogName(name) })
      .onDuplicateKeyUpdate({ set: { name } });
  }

  const [savedCategories, savedBrands] = await Promise.all([
    db.select({ name: categories.name }).from(categories),
    db.select({ name: brands.name }).from(brands),
  ]);
  const missingCategories = DEFAULT_CATEGORIES.filter(
    (category) => !savedCategories.some((saved) => saved.name === category.name),
  );
  const missingBrands = DEFAULT_BRANDS.filter(
    (brand) => !savedBrands.some((saved) => saved.name === brand),
  );
  if (missingCategories.length || missingBrands.length) {
    throw new Error(
      `Catalog options missing after seeding: ${[
        ...missingCategories.map((category) => category.name),
        ...missingBrands,
      ].join(", ")}`,
    );
  }

  console.log(
    `${DEFAULT_CATEGORIES.length} catégories et ${DEFAULT_BRANDS.length} marques de base sont présentes.`,
  );
}

seedCatalogOptions()
  .catch((error: unknown) => {
    console.error("Catalog options seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() =>
    closeDb().catch((error: unknown) => {
      console.error("Local database connection could not be closed:", error);
      process.exitCode = 1;
    }),
  );
