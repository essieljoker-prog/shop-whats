import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./context";
import { readToken, verifyToken } from "./lib/session";
import { getDb } from "./queries/connection";
import { adminUsers } from "../db/schema";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

/** Procédure réservée à l'administrateur (session cookie signée). */
export const adminQuery = t.procedure.use(async ({ ctx, next }) => {
  const token = readToken(ctx.req);
  console.log('[Auth-Debug] Admin request. Session cookie present:', !!token);
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    console.log('[Auth-Debug] Admin session rejected: missing or invalid token');
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const user = await getDb().query.adminUsers.findFirst({
    where: eq(adminUsers.id, userId),
  });
  if (!user) {
    console.log('[Auth-Debug] Admin session rejected: user not found');
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  console.log('[Auth-Debug] Admin session accepted');
  return next({ ctx: { ...ctx, admin: user } });
});
