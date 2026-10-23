import "dotenv/config";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

const CLOUDINARY_ENV_NAMES = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export function readCloudinaryConfig(
  source: Record<string, string | undefined>,
): CloudinaryConfig | null {
  const values = CLOUDINARY_ENV_NAMES.map((name) => source[name]?.trim() ?? "");
  if (values.every((value) => value.length === 0)) return null;
  if (values.some((value) => value.length === 0)) {
    throw new Error(
      `Cloudinary configuration is incomplete. Set all of: ${CLOUDINARY_ENV_NAMES.join(", ")}.`,
    );
  }
  const [cloudName, apiKey, apiSecret] = values;
  return { cloudName, apiKey, apiSecret };
}

function required(
  name: string,
  source: Record<string, string | undefined>,
  isProduction: boolean,
): string {
  const value = source[name]?.trim();
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export interface AppEnvironment {
  appSecret: string;
  isProduction: boolean;
  databaseUrl: string;
  localStorageDir: string;
  cloudinary: CloudinaryConfig | null;
}

export function readAppEnvironment(
  source: Record<string, string | undefined>,
): AppEnvironment {
  const isProduction = source.NODE_ENV === "production";
  const appSecret = required("APP_SECRET", source, isProduction);
  const databaseUrl = required("DATABASE_URL", source, isProduction);
  const localStorageDir = required("LOCAL_STORAGE_DIR", source, isProduction);

  if (isProduction && Buffer.byteLength(appSecret, "utf8") < 32) {
    throw new Error("APP_SECRET must contain at least 32 bytes in production.");
  }
  if (isProduction) {
    let parsedDatabaseUrl: URL;
    try {
      parsedDatabaseUrl = new URL(databaseUrl);
    } catch {
      throw new Error("DATABASE_URL must be a valid MySQL URL.");
    }
    if (parsedDatabaseUrl.protocol !== "mysql:") {
      throw new Error("DATABASE_URL must use the MySQL protocol.");
    }
  }

  return {
    appSecret,
    isProduction,
    databaseUrl,
    localStorageDir,
    cloudinary: readCloudinaryConfig(source),
  };
}

export const env = readAppEnvironment(process.env);
