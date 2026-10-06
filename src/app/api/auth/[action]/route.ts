import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  backend,
  clearSession,
  failure,
  readSession,
  relay,
  sameOrigin,
  writeSession,
} from "@/lib/server/backend";
const email = z.string().trim().email().max(254);
const password = z.string().min(12).max(128);
const token = z.string().min(32).max(128);
const schemas = {
  login: z.object({ email, password: z.string().min(1).max(128) }),
  register: z.object({
    name: z.string().trim().min(1).max(150),
    email,
    phone: z.string().max(30).nullable().optional(),
    password,
  }),
  "forgot-password": z.object({ email }),
  "reset-password": z.object({ token, password }),
  "request-email-verification": z.object({ email }),
  "verify-email": z.object({ token }),
  activate: z.object({ token, password }),
};
// Coalesce duplicate rotations within this single Next.js process. Multi-instance
// deployment needs a shared session store/lock before enabling replicas.
const rotations = new Map<
  string,
  Promise<
    import("@/lib/api/schema").components["schemas"]["TokenResponse"] | null
  >
>();
async function rotate(refresh: string) {
  const id = createHash("sha256").update(refresh).digest("hex");
  let pending = rotations.get(id);
  if (!pending) {
    pending = (async () => {
      const result = await backend("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!result.ok) {
        if (result.status >= 500 || result.status === 429)
          throw new Error("Temporary refresh failure");
        return null;
      }
      return result.json();
    })();
    rotations.set(id, pending);
    void pending.then(
      () => {
        const timer = setTimeout(() => rotations.delete(id), 3000);
        timer.unref();
      },
      () => rotations.delete(id),
    );
  }
  return pending;
}
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  if (!sameOrigin(request))
    return failure(403, "INVALID_ORIGIN", "Origem da requisição inválida.");
  const { action } = await context.params;
  try {
    if (action === "logout") {
      const session = await readSession();
      if (session) {
        const revoked = await backend("/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh }),
        });
        if (!revoked.ok && revoked.status !== 401) return relay(revoked);
      }
      const result = new NextResponse(null, { status: 204 });
      clearSession(result);
      return result;
    }
    if (action === "refresh") {
      const session = await readSession();
      if (!session)
        return failure(
          401,
          "SESSION_EXPIRED",
          "Entre novamente para continuar.",
        );
      // A second tab may already have refreshed the shared cookie.
      if (session.expires > Date.now() + 15_000)
        return NextResponse.json(
          { ok: true },
          { headers: { "Cache-Control": "no-store" } },
        );
      const tokens = await rotate(session.refresh);
      if (!tokens) {
        const result = failure(
          401,
          "SESSION_EXPIRED",
          "Entre novamente para continuar.",
        );
        clearSession(result);
        return result;
      }
      const result = NextResponse.json(
        { ok: true },
        { headers: { "Cache-Control": "no-store" } },
      );
      writeSession(result, tokens);
      return result;
    }
    if (!Object.hasOwn(schemas, action))
      return failure(404, "NOT_FOUND", "Rota não encontrada.");
    if (Number(request.headers.get("content-length") ?? 0) > 8192)
      return failure(413, "BODY_TOO_LARGE", "Dados muito extensos.");
    const text = await request.text();
    if (Buffer.byteLength(text) > 8192)
      return failure(413, "BODY_TOO_LARGE", "Dados muito extensos.");
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return failure(422, "VALIDATION_ERROR", "Informe um JSON válido.");
    }
    const parsed = schemas[action as keyof typeof schemas].safeParse(input);
    if (!parsed.success)
      return failure(422, "VALIDATION_ERROR", "Confira os dados informados.");
    const data = parsed.data;
    const withRole = [
      "login",
      "forgot-password",
      "request-email-verification",
    ].includes(action)
      ? { ...data, role: "personal" }
      : data;
    const path = action === "register" ? "/auth/personals" : `/auth/${action}`;
    const upstream = await backend(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRole),
    });
    if (!upstream.ok || action !== "login") return relay(upstream);
    const result = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    writeSession(result, await upstream.json());
    return result;
  } catch {
    return failure(
      503,
      "SERVICE_UNAVAILABLE",
      "Não foi possível conectar ao EloFit. Tente novamente.",
    );
  }
}
