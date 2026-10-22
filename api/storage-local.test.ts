import { LocalStorage } from "./lib/storage";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let testDirectory: string;
let storage: LocalStorage;

const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

beforeAll(async () => {
  testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "smg-pluq-storage-test-"));
  storage = new LocalStorage(testDirectory);
});

afterAll(async () => {
  if (testDirectory) await fs.rm(testDirectory, { recursive: true, force: true });
});

describe("LocalStorage", () => {
  it("uploads a supported image whose extension, MIME type, and signature match", async () => {
    const result = await storage.uploadFile({ fileContent: png, fileName: "test-image.png" });
    expect(result.key).toMatch(/^test-image-[a-f0-9]{8}\.png$/);
    const stat = await fs.stat(path.join(testDirectory, result.key));
    expect(stat.isFile()).toBe(true);
  });

  it("rejects an unsupported MIME type", async () => {
    await expect(
      storage.uploadFile({
        fileContent: new Uint8Array([0x23, 0x21]),
        fileName: "evil.sh",
      }),
    ).rejects.toThrow();
  });

  it("rejects a mismatched MIME type and image signature", async () => {
    await expect(
      storage.uploadFile({
        fileContent: new Uint8Array([0x23, 0x21, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05]),
        fileName: "fake.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow(/content is invalid/);
  });

  it("rejects an oversized image", async () => {
    await expect(
      storage.uploadFile({
        fileContent: new Uint8Array(8 * 1024 * 1024 + 1),
        fileName: "large.png",
      }),
    ).rejects.toThrow(/8 MiB limit/);
  });

  it("deletes a stored file", async () => {
    const { key } = await storage.uploadFile({ fileContent: png, fileName: "delete.png" });
    expect(await storage.deleteFile({ fileKey: key })).toBe(true);
    await expect(fs.stat(path.join(testDirectory, key))).rejects.toThrow();
  });

  it("generates a public URL", async () => {
    const { url, key } = await storage.getPresignedUrl({ key: "sample.png" });
    expect(url).toBe(`/api/files/${encodeURIComponent(key)}`);
  });
});
