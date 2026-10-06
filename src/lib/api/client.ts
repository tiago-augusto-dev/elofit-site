import createClient from "openapi-fetch";
import type { paths } from "./schema";
let pendingRefresh: Promise<boolean> | null = null;
async function refresh() {
  const action = async () =>
    (await fetch("/api/auth/refresh", { method: "POST" })).ok;
  if (!pendingRefresh) {
    pendingRefresh = (
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks
            .request("elofit-refresh", action)
            .then((value) => value)
        : action()
    ).finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
}
const sessionFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const retry = request.clone();
  let result = await fetch(request);
  if (result.status === 401 && (await refresh())) result = await fetch(retry);
  if (result.status === 401 && typeof window !== "undefined")
    window.location.assign(
      new URL("/login?expired=1", window.location.origin).toString(),
    );
  return result;
};
export const api = createClient<paths>({
  baseUrl: "/api/backend",
  fetch: sessionFetch,
});
// Strip the shared API prefix: browser requests reach the same-origin BFF.
api.use({
  async onRequest({ request }) {
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(
      "/api/backend/api/v1/",
      "/api/backend/",
    );
    return new Request(url, {
      method: request.method,
      headers: request.headers,
      credentials: "same-origin",
      signal: request.signal,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
    });
  },
});
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId?: string,
  ) {
    super(code);
  }
}
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.error || !result.response.ok) {
    const error = result.error as
      { code?: string; request_id?: string } | undefined;
    throw new ApiError(
      result.response.status,
      error?.code ?? "UNKNOWN",
      error?.request_id,
    );
  }
  return result.data as T;
}
export function messageFor(error: unknown) {
  if (!(error instanceof ApiError))
    return "Não foi possível concluir. Confira a conexão e tente novamente.";
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
    EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
    VALIDATION_ERROR: "Confira os dados informados.",
    CONFLICT: "Já existe um cadastro com esses dados.",
    INVALID_PASSWORD_RESET: "O link expirou ou já foi usado. Solicite um novo.",
    INVALID_EMAIL_VERIFICATION: "O link expirou ou já foi usado.",
    TOO_MANY_AUTH_ATTEMPTS:
      "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    FORBIDDEN: "Você não tem permissão para esta ação.",
    NOT_FOUND: "Este registro não foi encontrado.",
    EMAIL_ALREADY_EXISTS: "Este e-mail já está cadastrado.",
  };
  return (
    messages[error.code] ??
    (error.status === 409
      ? "Já existe um cadastro com esses dados."
      : error.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : error.status === 422
          ? "Confira os dados informados."
          : "Não foi possível concluir. Tente novamente.")
  );
}
export async function authAction(action: string, data: object = {}) {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = response.status === 204 ? undefined : await response.json();
  return unwrap({
    data: body,
    error: response.ok ? undefined : body,
    response,
  });
}
