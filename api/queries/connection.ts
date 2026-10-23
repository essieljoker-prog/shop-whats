
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;

export function getDb() {
  if (!instance) {
    const databaseUrl = new URL(env.databaseUrl);

    const pool = createPool({
      host: databaseUrl.hostname,
      port: databaseUrl.port
        ? Number(databaseUrl.port)
        : 3306,
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.replace(/^\//, ""),
      ...(env.isProduction
        ? {
            ssl: {
              ca: env.aivenCaCert,
              rejectUnauthorized: true,
            },
          }
        : {}),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    instance = drizzle(pool, {
      schema: fullSchema,
      mode: "default",
    });
  }

  return instance;
}

export async function closeDb(): Promise<void> {
  const current = instance;

  if (!current) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    current.$client.end((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  instance = undefined;
}
