import { redirect } from "next/navigation";
import { Alert, Box, Button } from "@mui/material";
import { backend, needsRefresh, readSession } from "@/lib/server/backend";
import { RefreshSession } from "@/features/auth/RefreshSession";
import { StudentArea } from "@/features/student/StudentArea";

export default async function Page() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (needsRefresh(session)) return <RefreshSession />;
  let response: Response;
  try {
    response = await backend("/auth/me", {
      headers: { Authorization: `Bearer ${session.access}` },
    });
  } catch {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Não foi possível conectar ao EloFit.</Alert>
        <Button href="/area-aluno">Tentar novamente</Button>
      </Box>
    );
  }
  if (response.status === 401) redirect("/login?expired=1");
  if (!response.ok)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Não foi possível validar seu acesso.</Alert>
        <Button href="/area-aluno">Tentar novamente</Button>
      </Box>
    );
  const actor = await response.json();
  if (actor.role === "personal") redirect("/painel");
  if (actor.role !== "student" || !actor.student_id) redirect("/login");
  let studentName = "Aluno";
  try {
    const profile = await backend(`/students/${actor.student_id}`, {
      headers: { Authorization: `Bearer ${session.access}` },
    });
    if (profile.ok) {
      const student = await profile.json();
      if (typeof student.name === "string" && student.name.trim())
        studentName = student.name;
    }
  } catch {
    // Keep training available if the optional profile lookup fails.
  }
  return <StudentArea studentId={actor.student_id} studentName={studentName} />;
}
