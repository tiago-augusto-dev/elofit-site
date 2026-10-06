import { redirect } from "next/navigation";
import { backend, readSession, needsRefresh } from "@/lib/server/backend";
import { RefreshSession } from "@/features/auth/RefreshSession";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";
import { Alert, Box, Button } from "@mui/material";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (needsRefresh(session)) return <RefreshSession />;
  let identity: Response;
  try {
    identity = await backend("/auth/me", {
      headers: { Authorization: `Bearer ${session.access}` },
    });
  } catch {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Não foi possível conectar ao EloFit.</Alert>
        <Button href="/painel">Tentar novamente</Button>
      </Box>
    );
  }
  if (identity.status === 401) redirect("/login?expired=1");
  if (!identity.ok)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Não foi possível validar seu acesso. Tente novamente.
        </Alert>
        <Button href="/painel">Tentar novamente</Button>
      </Box>
    );
  if ((await identity.json()).role !== "personal") redirect("/area-aluno");
  return <DashboardTemplate>{children}</DashboardTemplate>;
}
