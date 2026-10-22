import { clearCookie, createToken, verifyToken, sessionCookie } from "./lib/session";
import { describe, it, expect } from "vitest";

describe('Session handling', () => {
  it('rejects an expired token', () => {
    const userId = 123;
    const token = createToken(userId);
    // Original Date.now reference
    const originalNow = Date.now;
    const ttlMs = 4 * 60 * 60 * 1000; // 4 hours in ms
    try {
      // Simulate time after token expiration (+1 second)
      global.Date.now = () => originalNow() + ttlMs + 1000;
      const result = verifyToken(token);
      // Should be null because token is expired
      expect(result).toBeNull();
    } finally {
      // Restore original Date.now
      global.Date.now = originalNow;
    }
  });

  it('sets cookie max‑age to 4 hours (14400 seconds)', () => {
    const dummyToken = 'dummy.token.signature';
    const cookie = sessionCookie(dummyToken);
    expect(cookie).toContain('Max-Age=14400');
  });

  it("adds Secure to session cookies in production and clears the same cookie", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(sessionCookie("token")).toContain("; Secure");
      expect(clearCookie()).toContain("Max-Age=0");
      expect(clearCookie()).toContain("; Secure");
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
