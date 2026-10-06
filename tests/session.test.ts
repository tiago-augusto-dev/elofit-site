import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { seal, unseal } from "../src/lib/server/session-codec";
import { permitted } from "../src/lib/server/proxy-policy";
describe("sealed session", () => {
  const secret = randomBytes(32).toString("base64");
  const session = {
    access: "private-access",
    refresh: "private-refresh",
    expires: Date.now() + 1000,
    refreshExpires: Date.now() + 60000,
  };
  it("encrypts tokens and detects tampering", () => {
    const value = seal(session, secret);
    expect(value).not.toContain(session.access);
    expect(unseal(value, secret)).toEqual(session);
    const bytes = Buffer.from(value, "base64url");
    bytes[30] ^= 1;
    expect(unseal(bytes.toString("base64url"), secret)).toBeNull();
  });
  it("rejects wrong keys and expired sessions", () => {
    expect(
      unseal(seal(session, secret), randomBytes(32).toString("base64")),
    ).toBeNull();
    expect(
      unseal(
        seal({ ...session, refreshExpires: Date.now() - 1 }, secret),
        secret,
      ),
    ).toBeNull();
  });
  it("rejects invalid configuration", () => {
    expect(() => seal(session, "short")).toThrow();
  });
});
describe("proxy boundary", () => {
  it("only permits implemented personal workflows", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(permitted("students", "GET")).toBe(true);
    expect(permitted(`students/${id}/invitation`, "POST")).toBe(true);
    expect(permitted("auth/login", "POST")).toBe(false);
    expect(permitted("students/../../auth/login", "GET")).toBe(false);
    expect(permitted("students", "DELETE")).toBe(false);
    expect(permitted("students/http://evil.test", "GET")).toBe(false);
  });
  it("isolates student routes and blocks professional operations", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const other = "00000000-0000-4000-8000-000000000002";
    expect(permitted(`students/${id}/workouts`, "GET", "student", id)).toBe(
      true,
    );
    expect(permitted(`students/${other}/workouts`, "GET", "student", id)).toBe(
      false,
    );
    expect(permitted("students", "GET", "student", id)).toBe(false);
    expect(permitted(`students/${id}/invitation`, "POST", "student", id)).toBe(
      false,
    );
    expect(permitted(`workouts/${id}/sessions`, "POST", "student", id)).toBe(
      true,
    );
    expect(permitted(`executions/${id}/sets`, "PUT", "student", id)).toBe(true);
    expect(permitted(`executions/${id}/sets`, "PUT", "personal")).toBe(false);
    expect(permitted(`sessions/${id}`, "GET", "nutritionist")).toBe(false);
  });
});
