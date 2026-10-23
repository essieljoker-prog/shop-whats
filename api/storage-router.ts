import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { storage, StorageError } from "./lib/storage";
import {
  deleteUnreferencedStorageKey,
  isStorageKeyReferenced,
} from "./lib/storage-references";

/**
 * Uploads/suppressions réservés à l'admin.
 * Les URLs de lecture publiques passent par catalog.imageUrls.
 */
export const storageRouter = createRouter({
  upload: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(400),
        contentBase64: z
          .string()
          .min(4)
          .max(11_184_812)
          .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      const saved = await storage.uploadFile({
        fileContent: bytes,
        fileName: input.name,
        contentType: input.contentType,
      });
      return { key: saved.key, size: saved.size };
    }),

  url: adminQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => ({
      url: (await storage.getPresignedUrl({ key: input.key })).url,
    })),

  remove: adminQuery
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return {
          ok: await deleteUnreferencedStorageKey(
            input.key,
            (key) => isStorageKeyReferenced(getDb(), key),
            async (key) => storage.deleteFile({ fileKey: key }),
          ),
        };
      } catch (error) {
        if (error instanceof StorageError && error.code === "STORAGE_FORBIDDEN") {
          throw new TRPCError({ code: "CONFLICT", message: error.message, cause: error });
        }
        throw error;
      }
    }),
});
