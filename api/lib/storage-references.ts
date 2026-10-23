import { eq } from "drizzle-orm";
import type { getDb } from "../queries/connection";
import { brands, categories, productImages } from "../../db/schema";
import { StorageError } from "./storage";

type Database = ReturnType<typeof getDb>;

export async function isStorageKeyReferenced(
  db: Database,
  key: string,
): Promise<boolean> {
  const [productReference, categoryReference, brandReference] = await Promise.all([
    db.select({ id: productImages.id }).from(productImages).where(eq(productImages.imageKey, key)).limit(1),
    db.select({ id: categories.id }).from(categories).where(eq(categories.imageKey, key)).limit(1),
    db.select({ id: brands.id }).from(brands).where(eq(brands.logoKey, key)).limit(1),
  ]);

  return productReference.length > 0 || categoryReference.length > 0 || brandReference.length > 0;
}

export async function deleteUnreferencedStorageKey(
  key: string,
  isReferenced: (key: string) => Promise<boolean>,
  deleteFile: (key: string) => Promise<boolean>,
): Promise<boolean> {
  if (await isReferenced(key)) {
    throw new StorageError(
      "STORAGE_FORBIDDEN",
      "This image is still referenced and cannot be deleted.",
      false,
    );
  }
  return deleteFile(key);
}
