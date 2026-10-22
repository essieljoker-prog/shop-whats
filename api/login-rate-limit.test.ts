import { afterEach, describe, expect, it } from "vitest";
import {
  clearLoginFailures,
  isLoginAllowed,
  recordLoginFailure,
} from "./lib/login-rate-limit";

afterEach(() => {
  clearLoginFailures("admin");
  clearLoginFailures("other");
});

describe("login rate limit", () => {
  it("blocks an identifier after five failures for fifteen minutes", () => {
    const now = 1_000_000;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure("admin", now + attempt);
    }

    expect(isLoginAllowed("ADMIN", now + 5)).toBe(false);
    expect(isLoginAllowed("admin", now + 15 * 60 * 1000 + 5)).toBe(true);
  });

  it("normalizes identifiers and isolates other accounts", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure(" Admin ", 2_000_000 + attempt);
    }

    expect(isLoginAllowed("admin", 2_000_010)).toBe(false);
    expect(isLoginAllowed("other", 2_000_010)).toBe(true);
  });

  it("clears failures after a successful login", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure("admin", 3_000_000 + attempt);
    }

    clearLoginFailures("admin");
    expect(isLoginAllowed("admin", 3_000_010)).toBe(true);
  });
});
