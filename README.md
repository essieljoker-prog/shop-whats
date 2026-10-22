# Manaaf — boutique locale de téléphones

Application React/TypeScript/Vite avec une API Hono/tRPC, une base MySQL/MariaDB (Drizzle) et un stockage local d'images.

## Prérequis Windows

- Node.js 22 (le projet a été vérifié avec Node 22.14) et npm.
- Un serveur MySQL ou MariaDB local ; aucun service distant n'est nécessaire.
- Les dépendances du projet, installées avec `npm ci`.

## Préparer un environnement local isolé

Ne réutilisez pas une base de production, une copie de production ou la base `smg_pluq`. Les commandes de développement, migration et push refusent toute base autre qu'un hôte loopback (`localhost`, `127.0.0.1` ou `::1`) dont le nom se termine par `_local` ou `_test`.

1. Dans MySQL Workbench connecté au serveur local, créez une base dédiée vide :

   ```sql
   CREATE DATABASE smg_pluq_local
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

   Utilisez un compte MySQL local ayant accès à cette seule base, si possible.

2. Depuis ce dossier, copiez le modèle et complétez **uniquement** `.env.local` avec les identifiants de cette base locale :

   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

   Remplacez les valeurs fictives de `DATABASE_URL` et `APP_SECRET`. Pour générer un secret de développement :

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   `.env.local` est ignoré par Git. Ne copiez jamais les identifiants de production dans ce fichier. Le `.env` déjà présent n'est pas remplacé.

3. Dans la même fenêtre PowerShell, sélectionnez cette configuration puis préparez le schéma et les données d'exemple :

   ```powershell
   $env:DOTENV_CONFIG_PATH = ".env.local"
   npm run db:migrate
   npm run db:seed
   ```

   Le script d'exemple crée des produits de démonstration et ne crée **aucun** compte administrateur ni mot de passe par défaut.
   Pour ajouter uniquement les catégories et marques de base à une base existante, sans créer de produits de démonstration, utilisez `npm run db:seed-catalog`.

4. Créez l'administrateur local avec un mot de passe personnel d'au moins 12 caractères :

   ```powershell
   npm run admin:create
   ```

   Pour réinitialiser explicitement le mot de passe de `admin`, exécutez `npm run admin:reset -- --confirm`. Le script demande le nouveau mot de passe deux fois. Ces deux commandes refusent les bases distantes, les environnements `production` et les noms de base sans suffixe `_local`/`_test`.

5. Démarrez l'application dans cette fenêtre PowerShell :

   ```powershell
   npm run dev
   ```

   - Boutique : <http://localhost:3000/>
   - Connexion administrateur : <http://localhost:3000/admin/connexion>

   Arrêtez le serveur avec `Ctrl+C`. Les liens WhatsApp et l'intégration Google Maps restent externes ; ils ne sont pas nécessaires pour tester la navigation et les filtres.

## Vérifications

```powershell
npm run check
npm test
npm run lint
```

Les tests de stockage utilisent un dossier temporaire unique et ne nettoient pas le dossier `uploads/`. Le lint existant signale aussi des problèmes dans d'autres modules ; consultez sa sortie complète.

## Notes de sécurité

- Le cookie administrateur est `HttpOnly`, `SameSite=Lax` et reçoit `Secure` en production. Le secret de production doit être fourni via `APP_SECRET` avec au moins 32 octets.
- Les réponses définissent des en-têtes de base contre le MIME sniffing, le framing, le partage du référent et l'accès aux capteurs. Une CSP de production autorise seulement les ressources nécessaires, dont Google Fonts et la carte Google Maps.
- Les tentatives de connexion sont limitées en mémoire par nom d'utilisateur ; pour plusieurs instances, une limitation partagée à la couche proxy ou via un stockage commun reste nécessaire.
- Les téléversements ne dépassent pas 8 Mio et le serveur compare extension, type MIME et signature d'image.
- Les appels de développement et les commandes `db:migrate` / `db:push` sont refusés si la cible n'est pas une base MySQL locale explicitement dédiée.
- Aucune opération de production n'est effectuée par ces étapes.

## Identité visuelle

- Le logo original de la boutique est servi depuis `public/smg-pluq-logo.jpg`. Gardez le fichier source intact.
- Les couleurs de marque sont centralisées dans `src/index.css` et exposées comme utilitaires `brand-blue` et `brand-green` dans `tailwind.config.js`.
- Le bleu et le vert du logo sont utilisés comme accents ; les variantes plus sombres servent aux textes et boutons qui doivent conserver un contraste lisible.
