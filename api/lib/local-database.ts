export function assertDedicatedLocalDatabase(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing data setup while NODE_ENV is production.");
  }

  const configuredUrl = process.env.DATABASE_URL;
  if (!configuredUrl) throw new Error("DATABASE_URL is required.");

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(configuredUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid MySQL URL.");
  }

  if (databaseUrl.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the MySQL protocol.");
  }

  const host = databaseUrl.hostname.toLowerCase();
  const database = databaseUrl.pathname.replace(/^\/+/, "");
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    throw new Error("Refusing data setup: the database host is not local.");
  }
  if (
    database.toLowerCase() !== "smg_pluq" &&
    !/(?:_local|_test)$/i.test(database)
  ) {
    throw new Error(
      "Refusing data setup: use loopback database smg_pluq or a database whose name ends in _local or _test.",
    );
  }
}
