import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createCloudinaryReference,
  HybridStorage,
  LocalStorage,
  parseCloudinaryReference,
  type CloudinaryDriver,
} from "./lib/storage";
import { readCloudinaryConfig } from "./lib/env";
import {
  deleteUnreferencedStorageKey,
  isStorageKeyReferenced,
} from "./lib/storage-references";
import { persistUploadedImage } from "../src/lib/persist-uploaded-image";
import { brands, categories, productImages } from "../db/schema";
import type { getDb } from "./queries/connection";

const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

let testDirectory: string;

beforeAll(async () => {
  testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "manaaf-hybrid-storage-test-"));
});

afterAll(async () => {
  if (testDirectory) await fs.rm(testDirectory, { recursive: true, force: true });
});

function createDriver() {
  const driver: CloudinaryDriver = {
    upload: vi.fn(async ({ publicId }) => ({ publicId, format: "png" })),
    destroy: vi.fn(async () => true),
    getUrl: vi.fn((publicId, format) => `https://res.cloudinary.com/demo/image/upload/${publicId}.${format}`),
  };
  return driver;
}

describe("HybridStorage", () => {
  it("keeps local uploads and resolves historic local keys", async () => {
    const local = new LocalStorage(path.join(testDirectory, "local"));
    const storage = new HybridStorage(local);
    const uploaded = await storage.uploadFile({ fileContent: png, fileName: "old-photo.png" });

    expect(uploaded.key).toMatch(/^old-photo-[a-f0-9]{8}\.png$/);
    await expect(fs.stat(path.join(testDirectory, "local", uploaded.key))).resolves.toBeDefined();
    await expect(storage.getPresignedUrl({ key: uploaded.key })).resolves.toEqual({
      key: uploaded.key,
      url: `/api/files/${encodeURIComponent(uploaded.key)}`,
    });
  });

  it("uploads validated images through the injected Cloudinary driver without a network call", async () => {
    const driver = createDriver();
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), driver);
    const uploaded = await storage.uploadFile({
      fileContent: png,
      fileName: "produits/12/photo.png",
      contentType: "image/png",
    });

    expect(uploaded.key).toMatch(/^cloudinary:v1:png:manaaf\/produits\/12\/photo-[a-f0-9]{8}$/);
    expect(parseCloudinaryReference(uploaded.key)).toEqual({
      format: "png",
      publicId: expect.stringMatching(/^manaaf\/produits\/12\/photo-[a-f0-9]{8}$/),
    });
    expect(driver.upload).toHaveBeenCalledOnce();
  });

  it("resolves local and Cloudinary references through the same batch contract", async () => {
    const driver = createDriver();
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), driver);
    const cloudKey = createCloudinaryReference("png", "manaaf/products/image");
    const { urls } = await storage.getPresignedUrls({ keys: ["products/legacy.png", cloudKey] });

    expect(urls).toEqual([
      { key: "products/legacy.png", url: "/api/files/products%2Flegacy.png" },
      {
        key: cloudKey,
        url: "https://res.cloudinary.com/demo/image/upload/manaaf/products/image.png",
      },
    ]);
  });

  it("rejects malformed Cloudinary references rather than treating them as local keys", async () => {
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), createDriver());
    await expect(
      storage.getPresignedUrl({ key: "cloudinary:v1:png:manaaf/../private" }),
    ).rejects.toThrow(/Malformed Cloudinary reference/);
    await expect(
      storage.getPresignedUrl({ key: "cloudinary:v1:svg:manaaf/image" }),
    ).rejects.toThrow(/Malformed Cloudinary reference/);
    await expect(
      storage.getPresignedUrl({ key: "cloudinary:v2:png:manaaf/image" }),
    ).rejects.toThrow(/Unsupported Cloudinary reference version/);
  });

  it("routes deletion according to the validated reference provider", async () => {
    const local = new LocalStorage(path.join(testDirectory, "delete-provider"));
    const driver = createDriver();
    const storage = new HybridStorage(local, driver);
    const localUpload = await local.uploadFile({ fileContent: png, fileName: "local.png" });
    const cloudKey = createCloudinaryReference("png", "manaaf/products/image");

    expect(await storage.deleteFile({ fileKey: localUpload.key })).toBe(true);
    expect(driver.destroy).not.toHaveBeenCalled();
    expect(await storage.deleteFile({ fileKey: cloudKey })).toBe(true);
    expect(driver.destroy).toHaveBeenCalledWith("manaaf/products/image");
  });

  it("preserves size, MIME, and signature checks before any remote upload", async () => {
    const driver = createDriver();
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), driver);

    await expect(
      storage.uploadFile({
        fileContent: new Uint8Array(8 * 1024 * 1024 + 1),
        fileName: "large.png",
      }),
    ).rejects.toThrow(/8 MiB limit/);
    await expect(
      storage.uploadFile({
        fileContent: new Uint8Array([0x23, 0x21]),
        fileName: "wrong.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow(/content is invalid/);
    expect(driver.upload).not.toHaveBeenCalled();
  });

  it("surfaces Cloudinary upload failures", async () => {
    const driver = createDriver();
    vi.mocked(driver.upload).mockRejectedValueOnce(new Error("upstream failure"));
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), driver);

    await expect(
      storage.uploadFile({ fileContent: png, fileName: "failure.png" }),
    ).rejects.toThrow("upstream failure");
  });

  it("surfaces Cloudinary deletion failures", async () => {
    const driver = createDriver();
    vi.mocked(driver.destroy).mockRejectedValueOnce(new Error("delete unavailable"));
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")), driver);
    const cloudKey = createCloudinaryReference("png", "manaaf/products/image");

    await expect(storage.deleteFile({ fileKey: cloudKey })).rejects.toThrow(
      "delete unavailable",
    );
  });

  it("rejects Cloudinary references when the provider is not configured", async () => {
    const storage = new HybridStorage(new LocalStorage(path.join(testDirectory, "unused")));
    const cloudKey = createCloudinaryReference("png", "manaaf/products/image");
    await expect(storage.getPresignedUrl({ key: cloudKey })).rejects.toThrow(/not configured/);
    await expect(storage.deleteFile({ fileKey: cloudKey })).rejects.toThrow(/not configured/);
  });
});

describe("Cloudinary configuration and cleanup", () => {
  it("uses local storage when no Cloudinary settings are supplied outside production", () => {
    expect(readCloudinaryConfig({})).toBeNull();
  });

  it("rejects partially configured Cloudinary credentials without exposing their values", () => {
    expect(() =>
      readCloudinaryConfig({
        CLOUDINARY_CLOUD_NAME: "test-cloud",
        CLOUDINARY_API_KEY: "test-key",
      }),
    ).toThrow(/CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET/);
  });

  it("blocks removal if any MySQL reference remains", async () => {
    const isReferenced = vi.fn(async () => true);
    const deleteFile = vi.fn(async () => true);

    await expect(
      deleteUnreferencedStorageKey("cloudinary:v1:png:manaaf/image", isReferenced, deleteFile),
    ).rejects.toThrow(/still referenced/);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it.each([productImages, categories, brands])(
    "detects a reference found in a MySQL image column",
    async (referencedTable) => {
      const db = {
        select: () => ({
          from: (table: unknown) => ({
            where: () => ({
              limit: async () =>
                table === referencedTable ? [{ id: 1 }] : [],
            }),
          }),
        }),
      } as unknown as ReturnType<typeof getDb>;

      await expect(isStorageKeyReferenced(db, "cloudinary:v1:png:manaaf/shared")).resolves.toBe(
        true,
      );
    },
  );

  it("permits cleanup only after the reference check reports no references", async () => {
    const isReferenced = vi.fn(async () => false);
    const deleteFile = vi.fn(async () => true);

    await expect(
      deleteUnreferencedStorageKey("local.png", isReferenced, deleteFile),
    ).resolves.toBe(true);
    expect(deleteFile).toHaveBeenCalledWith("local.png");
  });

  it("compensates a failed database save only through the guarded remove operation", async () => {
    const saveError = new Error("database write failed");
    const remove = vi.fn(async () => true);

    await expect(
      persistUploadedImage(
        { key: "cloudinary:v1:png:manaaf/products/orphan" },
        async () => {
          throw saveError;
        },
        remove,
      ),
    ).rejects.toBe(saveError);
    expect(remove).toHaveBeenCalledWith("cloudinary:v1:png:manaaf/products/orphan");
  });

  it("reports when compensation cannot confirm that cleanup is safe", async () => {
    const remove = vi.fn(async () => {
      throw new Error("reference check failed");
    });

    await expect(
      persistUploadedImage(
        { key: "cloudinary:v1:png:manaaf/products/orphan" },
        async () => {
          throw new Error("database write failed");
        },
        remove,
      ),
    ).rejects.toThrow(/safe cleanup could not be confirmed/);
  });
});
