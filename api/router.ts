import { createRouter, publicQuery } from "./middleware";
import { catalogRouter } from "./catalog-router";
import { adminRouter } from "./admin-router";
import { storageRouter } from "./storage-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  catalog: catalogRouter,
  admin: adminRouter,
  storage: storageRouter,
});

export type AppRouter = typeof appRouter;
