import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>> | undefined;

export function getDb() {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      schema: fullSchema,
      mode: "default",
    });
  }
  return instance;
}

export async function closeDb(): Promise<void> {
  const current = instance;
  if (!current) return;

  await new Promise<void>((resolve, reject) => {
    current.$client.end((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  instance = undefined;
}
