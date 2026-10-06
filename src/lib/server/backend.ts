import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { seal, unseal, type Session } from "./session-codec";
import type { components } from "@/lib/api/schema";
type Tokens = components["schemas"]["TokenResponse"];
export const cookieName = "elofit-session";
export function needsRefresh(session: Session) {
  return session.expires <= Date.now() + 5000;
}
export function secret() {
  if (!process.env.SESSION_SECRET)
    throw new Error("Configure SESSION_SECRET before starting EloFit.");
  return process.env.SESSION_SECRET;
}
export async function readSession() {
  const value = (await cookies()).get(cookieName)?.value;
  return value ? unseal(value, secret()) : null;
}
export function writeSession(response: NextResponse, tokens: Tokens) {
  const session: Session = {
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expires: Date.now() + tokens.expires_in * 1000,
    refreshExpires: Date.now() + tokens.refresh_expires_in * 1000,
  };
  response.cookies.set(cookieName, seal(session, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokens.refresh_expires_in,
  });
}
export function clearSession(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export function sameOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN ?? new URL(request.url).origin;
  return request.headers.get("origin") === expected;
}
export async function backend(path: string, init: RequestInit = {}) {
  const url = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
  return fetch(`${url}/api/v1${path}`, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
}
export function failure(status: number, code: string, message: string) {
  return NextResponse.json(
    { code, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export async function relay(response: Response) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  for (const key of ["x-request-id", "retry-after"]) {
    const value = response.headers.get(key);
    if (value) headers.set(key, value);
  }
  return new NextResponse(
    response.status === 204 ? null : await response.text(),
    { status: response.status, headers },
  );
}
