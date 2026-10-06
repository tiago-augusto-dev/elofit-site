import {
  backend,
  failure,
  readSession,
  relay,
  sameOrigin,
} from "@/lib/server/backend";
import { permitted } from "@/lib/server/proxy-policy";
async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request))
    return failure(403, "INVALID_ORIGIN", "Origem inválida.");
  const path = (await context.params).path.join("/");
  if (
    !permitted(path, request.method) &&
    !permitted(path, request.method, "student", path.split("/")[1])
  )
    return failure(404, "NOT_FOUND", "Rota não encontrada.");
  try {
    const session = await readSession();
    if (!session || session.expires <= Date.now())
      return failure(401, "SESSION_EXPIRED", "Entre novamente para continuar.");
    const headers = {
      Authorization: `Bearer ${session.access}`,
      "Content-Type": "application/json",
    };
    const identity = await backend("/auth/me", { headers });
    if (!identity.ok) return relay(identity);
    const actor = await identity.json();
    if (!permitted(path, request.method, actor.role, actor.student_id))
      return failure(404, "NOT_FOUND", "Rota não encontrada.");
    const query = new URL(request.url).search;
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && Buffer.byteLength(body) > 64_000)
      return failure(413, "BODY_TOO_LARGE", "Dados muito extensos.");
    return relay(
      await backend(`/${path}${query}`, {
        method: request.method,
        headers,
        body,
      }),
    );
  } catch {
    return failure(
      503,
      "SERVICE_UNAVAILABLE",
      "Não foi possível conectar ao EloFit. Tente novamente.",
    );
  }
}
export { handle as GET, handle as POST, handle as PUT };
