import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage = vi.hoisted(() => ({
  getPresignedUrls: vi.fn(),
}));

vi.mock("./lib/storage", () => ({ storage: mockStorage }));

import { catalogRouter } from "./catalog-router";

describe("catalog.imageUrls", () => {
  beforeEach(() => {
    mockStorage.getPresignedUrls.mockReset();
  });

  it("returns local and Cloudinary URLs keyed by their unchanged database references", async () => {
    const localKey = "products/legacy.png";
    const cloudinaryKey = "cloudinary:v1:png:manaaf/products/photo";
    mockStorage.getPresignedUrls.mockResolvedValue({
      urls: [
        { key: localKey, url: "/api/files/products%2Flegacy.png" },
        {
          key: cloudinaryKey,
          url: "https://res.cloudinary.com/demo/image/upload/manaaf/products/photo.png",
        },
      ],
      failures: [],
    });
    const caller = catalogRouter.createCaller({
      req: new Request("http://localhost"),
      resHeaders: new Headers(),
    });

    await expect(caller.imageUrls({ keys: [localKey, cloudinaryKey] })).resolves.toEqual({
      [localKey]: "/api/files/products%2Flegacy.png",
      [cloudinaryKey]:
        "https://res.cloudinary.com/demo/image/upload/manaaf/products/photo.png",
    });
    expect(mockStorage.getPresignedUrls).toHaveBeenCalledWith({
      keys: [localKey, cloudinaryKey],
    });
  });
});
