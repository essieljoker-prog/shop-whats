import { createInterface } from "node:readline";
import { closeDb, getDb } from "./api/queries/connection";
import { assertDedicatedLocalDatabase } from "./api/lib/local-database";
import { hashPassword } from "./api/lib/session";
import { adminUsers } from "./db/schema";
import { eq } from "drizzle-orm";

function promptSecret(question: string): Promise<string> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    readline.question(question, { hideEchoBack: true }, (answer) => {
      readline.close();
      console.log();
      resolve(answer);
    });
  });
}

async function resetAdmin(): Promise<void> {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Pass --confirm to explicitly authorize resetting a local administrator password.");
  }
  assertDedicatedLocalDatabase();

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
  if (!/^[a-z0-9_.-]{3,80}$/.test(username)) {
    throw new Error("ADMIN_USERNAME must be 3-80 letters, numbers, dots, underscores, or hyphens.");
  }

  const password = await promptSecret(`Nouveau mot de passe pour ${username} (12 caractères minimum) : `);
  const confirmation = await promptSecret("Confirmez le nouveau mot de passe : ");
  if (password.length < 12) throw new Error("The administrator password must contain at least 12 characters.");
  if (password !== confirmation) throw new Error("The passwords do not match.");

  const db = getDb();
  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.username, username),
  });
  const passwordHash = hashPassword(password);
  if (existing) {
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, existing.id));
  } else {
    await db.insert(adminUsers).values({ username, passwordHash });
  }
  console.log(`Administrator password updated for ${username}.`);
}

resetAdmin().catch((error: unknown) => {
  console.error(
    "Administrator reset failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
}).finally(() =>
  closeDb().catch((error: unknown) => {
    console.error("Local database connection could not be closed:", error);
    process.exitCode = 1;
  }),
);
