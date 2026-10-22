import "dotenv/config";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing local development/database commands while NODE_ENV is production.");
}

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error("DATABASE_URL is required.");

let databaseUrl;
try {
  databaseUrl = new URL(configuredUrl);
} catch {
  throw new Error("DATABASE_URL must be a valid MySQL URL.");
}

if (databaseUrl.protocol !== "mysql:") {
  throw new Error("DATABASE_URL must use the MySQL protocol.");
}

const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
  databaseUrl.hostname.toLowerCase(),
);
const databaseName = databaseUrl.pathname.replace(/^\/+/, "");
const isApprovedDatabase =
  databaseName.toLowerCase() === "smg_pluq" ||
  /(?:_local|_test)$/i.test(databaseName);
if (!isLoopback || !isApprovedDatabase) {
  throw new Error(
    "Refusing command: target loopback MySQL database smg_pluq or one ending in _local or _test.",
  );
}
