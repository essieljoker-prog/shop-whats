import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryConfig } from "./env";
import { StorageError, type CloudinaryDriver } from "./storage";

export function createCloudinaryDriver(config: CloudinaryConfig): CloudinaryDriver {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return {
    upload({ bytes, publicId }) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            overwrite: false,
            unique_filename: false,
            use_filename: false,
          },
          (error, result) => {
            if (error) {
              reject(
                new StorageError("STORAGE_UPSTREAM_ERROR", "Cloudinary upload failed.", true, {
                  cause: error,
                }),
              );
              return;
            }
            if (!result) {
              reject(
                new StorageError(
                  "STORAGE_UPSTREAM_ERROR",
                  "Cloudinary returned no upload result.",
                  true,
                ),
              );
              return;
            }
            resolve({ publicId: result.public_id, format: result.format });
          },
        );
        Readable.from([Buffer.from(bytes)]).pipe(uploadStream);
      });
    },

    async destroy(publicId) {
      let result;
      try {
        result = await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
          type: "upload",
          invalidate: true,
        });
      } catch (error) {
        throw new StorageError(
          "STORAGE_UPSTREAM_ERROR",
          "Cloudinary deletion failed.",
          true,
          { cause: error },
        );
      }

      if (result.result === "ok") return true;
      if (result.result === "not found") return false;
      throw new StorageError(
        "STORAGE_UPSTREAM_ERROR",
        "Cloudinary returned an unexpected deletion result.",
        true,
      );
    },

    getUrl(publicId, format) {
      return cloudinary.url(publicId, {
        secure: true,
        resource_type: "image",
        type: "upload",
        format,
      });
    },
  };
}
