// ──────────────────────────────────────────────────────────────────────
// init-admin.ts
//   Crée le compte administrateur « admin » seulement si besoin.
//   Utilise les fonctions déjà présentes dans le projet (hashPassword,
//   getDb, adminUsers).  Aucun mot de passe n’est codé en dur ; il est demandé
//   à l’exécution et n’est jamais affiché dans les logs.
// ──────────────────────────────────────────────────────────────────────
import { createInterface } from "readline";
import { hashPassword } from "./api/lib/session";
import { closeDb, getDb } from "./api/queries/connection";
import { adminUsers } from "./db/schema";
import { eq } from "drizzle-orm";
import { assertDedicatedLocalDatabase } from "./api/lib/local-database";

// Helper : lit un texte masqué (hideEchoBack) sur la console.
async function promptSecret(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    // hideEchoBack works on Node ≥ 12 when using readline's question options.
    rl.question(question, { hideEchoBack: true }, (answer) => {
      rl.close();
      // Print a newline after hidden input for a clean prompt.
      console.log();
      resolve(answer);
    });
  });
}

async function main() {
  assertDedicatedLocalDatabase();
  const db = getDb();

  // 1️⃣ Vérifier l’existence du compte admin.
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
  if (!/^[a-z0-9_.-]{3,80}$/.test(username)) {
    throw new Error("ADMIN_USERNAME must be 3-80 letters, numbers, dots, underscores, or hyphens.");
  }
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  if (existing[0]) {
    console.log("✅ Un compte admin (« admin ») existe déjà – aucune action requise.");
    return;
  }

  // 2️⃣ Demander le mot de passe (pas d’affichage).
  const envPwd = process.env.ADMIN_PASSWORD;
  const pwd = envPwd ?? await promptSecret("Entrez le mot de passe initial pour le compte admin : ");

  if (pwd.length < 12) {
    throw new Error("The administrator password must contain at least 12 characters.");
  }

  // 3️⃣ Hashage avec la même fonction que le seed.
  const hashed = hashPassword(pwd);

  // 4️⃣ Insertion du compte.
  await db
    .insert(adminUsers)
    .values({ username, passwordHash: hashed })
    .run(); // Drizzle : .run() exécute la requête.

  console.log(`✅ Compte administrateur créé avec succès (nom : ${username}).`);
}

main().catch((e) => {
  console.error("❌ Erreur lors de la création du compte admin :", e);
  process.exitCode = 1;
}).finally(() =>
  closeDb().catch((error: unknown) => {
    console.error("❌ Erreur lors de la fermeture de la connexion locale :", error);
    process.exitCode = 1;
  }),
);
