import { afterEach, describe, expect, it } from "vitest";
import { assertDedicatedLocalDatabase } from "./lib/local-database";

const originalNodeEnv = process.env.NODE_ENV;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("dedicated local database guard", () => {
  it("allows a loopback database explicitly named for local development", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mysql://user:password@127.0.0.1:3306/shop_local";
    expect(() => assertDedicatedLocalDatabase()).not.toThrow();
  });

  it("allows an IPv6 loopback database", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mysql://user:password@[::1]:3306/shop_test";
    expect(() => assertDedicatedLocalDatabase()).not.toThrow();
  });

  it("rejects remote databases", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mysql://user:password@example.invalid:3306/shop_local";
    expect(() => assertDedicatedLocalDatabase()).toThrow(/host is not local/);
  });

  it("allows the configured smg_pluq database on loopback", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mysql://user:password@localhost:3306/smg_pluq";
    expect(() => assertDedicatedLocalDatabase()).not.toThrow();
  });

  it("rejects local database names that are not explicitly dedicated", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "mysql://localhost:3306/shop";
    expect(() => assertDedicatedLocalDatabase()).toThrow(/ends in _local or _test/);
  });

  it("rejects data setup in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "mysql://user:password@localhost:3306/shop_local";
    expect(() => assertDedicatedLocalDatabase()).toThrow(/NODE_ENV is production/);
  });
});
