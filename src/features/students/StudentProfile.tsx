"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { QueryState } from "@/components/molecules/QueryState";
import { api, messageFor, unwrap } from "@/lib/api/client";
import { studentOptions } from "./queries";
import { StudentForm } from "./StudentForm";
import { workoutsOptions } from "@/features/training/queries";
export function StudentProfile({
  id,
  edit = false,
}: {
  id: string;
  edit?: boolean;
}) {
  const student = useQuery(studentOptions(id));
  const workouts = useQuery({ ...workoutsOptions(id), enabled: !edit });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState("");
  if (student.isPending || student.error)
    return (
      <QueryState
        loading={student.isPending}
        error={student.error}
        retry={() => void student.refetch()}
      />
    );
  if (edit) return <StudentForm student={student.data} />;
  const data = student.data;
  return (
    <>
      <PageHeader
        title={data.name}
        description="Perfil e treinos do aluno."
        action={
          <Button
            component={Link}
            href={`/alunos/${id}/editar`}
            variant="outlined"
          >
            Editar perfil
          </Button>
        }
      />
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Chip
              sx={{ alignSelf: "flex-start" }}
              label={data.is_active ? "Aluno ativo" : "Aluno arquivado"}
              variant="outlined"
            />
            <Typography sx={{ overflowWrap: "anywhere" }}>
              {data.email}
            </Typography>
            <Typography color="text.secondary">
              {data.phone ?? "Telefone não informado"}
            </Typography>
            <Typography color="text.secondary">
              Mensalidade:{" "}
              {data.monthly_fee
                ? Number(data.monthly_fee).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "não configurada"}
            </Typography>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5">Acesso do aluno</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Gere um convite e compartilhe o link diretamente com seu aluno. Um
            novo convite substitui o anterior.
          </Typography>
          <Button
            variant="outlined"
            disabled={busy || !data.is_active}
            onClick={async () => {
              setBusy(true);
              setError("");
              setInvitation("");
              try {
                const result = unwrap(
                  await api.POST("/api/v1/students/{student_id}/invitation", {
                    params: { path: { student_id: id } },
                  }),
                );
                setInvitation(
                  `${window.location.origin}/activate?token=${encodeURIComponent(result.token)}`,
                );
              } catch (cause) {
                setError(messageFor(cause));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Gerando…" : "Gerar convite"}
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {invitation && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                {invitation}
              </Typography>
              <Button
                sx={{ alignSelf: "flex-start" }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invitation);
                  } catch {
                    setError("Copie o link exibido acima.");
                  }
                }}
              >
                Copiar link
              </Button>
            </Stack>
          )}
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ gap: 2, justifyContent: "space-between", mb: 2 }}
          >
            <Typography variant="h5">Treinos prescritos</Typography>
            <Button
              component={Link}
              href={`/treinos/novo?aluno=${id}`}
              color="secondary"
              variant="contained"
              disabled={!data.is_active}
            >
              Novo treino
            </Button>
          </Stack>
          {workouts.isPending || workouts.error ? (
            <QueryState
              loading={workouts.isPending}
              error={workouts.error}
              retry={() => void workouts.refetch()}
            />
          ) : workouts.data.length === 0 ? (
            <QueryState empty="Nenhum treino prescrito. Monte o primeiro treino deste aluno." />
          ) : (
            <Stack spacing={2}>
              {workouts.data.map((w) => (
                <Paper key={w.id} sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{w.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {w.exercises.length} exercícios ·{" "}
                    {w.is_active ? "Ativo" : "Arquivado"}
                  </Typography>
                  {w.exercises.map((e) => (
                    <Typography key={e.id} variant="body2" sx={{ mt: 1 }}>
                      {e.exercise_name} · {e.sets} séries × {e.repetitions} ·{" "}
                      {e.rest_seconds}s de descanso
                    </Typography>
                  ))}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}
