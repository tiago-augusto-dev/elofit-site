"use client";
import { useState } from "react";
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutlined,
  SaveOutlined,
  ExpandMore,
} from "@mui/icons-material";
import type { components } from "@/lib/api/schema";
import { api, unwrap } from "@/lib/api/client";
type Session = components["schemas"]["SessionRead"];
type Execution = components["schemas"]["ExecutionRead"];
type Props = {
  session: Session;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
};
export function SessionRecorder({ session, busy, run, refresh }: Props) {
  const [saved, setSaved] = useState("");
  const total = session.exercises.reduce(
    (sum, exercise) => sum + exercise.prescribed_sets,
    0,
  );
  const count = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const completed = session.exercises.filter(
    (exercise) => exercise.completed_at,
  ).length;
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                justifyContent: "space-between",
                alignItems: { sm: "center" },
              }}
            >
              <Typography component="h2" variant="h5">
                Registro · {session.workout_name}
              </Typography>
              <Chip
                color={session.completed_at ? "success" : "default"}
                label={
                  session.completed_at ? "Treino concluído" : "Em andamento"
                }
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Iniciado em {new Date(session.started_at).toLocaleString("pt-BR")}
            </Typography>
            {session.completed_at ? (
              <Alert severity="success">
                Concluído em{" "}
                {new Date(session.completed_at).toLocaleString("pt-BR")}. Seus
                registros estão preservados.
              </Alert>
            ) : (
              <Typography color="text.secondary">
                Salve cada série e conclua o exercício antes de finalizar o
                treino.
              </Typography>
            )}
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}
            >
              <Typography variant="body2">
                {count} de {total}{" "}
                {total === 1 ? "série salva" : "séries salvas"}
              </Typography>
              <Typography variant="body2">
                {completed} de {session.exercises.length}{" "}
                {session.exercises.length === 1
                  ? "exercício concluído"
                  : "exercícios concluídos"}
              </Typography>
            </Stack>
            <LinearProgress
              aria-label="Progresso das séries salvas"
              variant="determinate"
              value={total ? (count / total) * 100 : 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Stack>
        </CardContent>
      </Card>
      {saved && !session.completed_at && (
        <Alert severity="success" role="status">
          {saved}
        </Alert>
      )}
      {session.exercises.map((exercise, index) => (
        <ExerciseRecord
          key={exercise.id}
          exercise={exercise}
          index={index}
          finished={!!session.completed_at}
          busy={busy}
          run={run}
          refresh={refresh}
          onSaved={setSaved}
        />
      ))}
      {!session.completed_at && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography component="h3" variant="h6">
                Finalizar sessão
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completed === session.exercises.length
                  ? "Todos os exercícios foram concluídos. Você já pode finalizar."
                  : session.exercises.length - completed === 1
                    ? "Falta 1 exercício para concluir este treino."
                    : `Faltam ${session.exercises.length - completed} exercícios para concluir este treino.`}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                disabled={busy || completed !== session.exercises.length}
                onClick={() =>
                  run(async () => {
                    unwrap(
                      await api.POST("/api/v1/sessions/{session_id}/complete", {
                        params: { path: { session_id: session.id } },
                      }),
                    );
                    await refresh();
                  })
                }
              >
                Concluir treino
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

function ExerciseRecord({
  exercise,
  index,
  finished,
  busy,
  run,
  refresh,
  onSaved,
}: {
  exercise: Execution;
  index: number;
  finished: boolean;
  busy: boolean;
  run: Props["run"];
  refresh: Props["refresh"];
  onSaved: (value: string) => void;
}) {
  const readOnly = finished || !!exercise.completed_at;
  return (
    <Accordion
      component="article"
      defaultExpanded={index === 0}
      disableGutters
      sx={{
        border: "1px solid #DBE7EA",
        borderRadius: "12px !important",
        overflow: "hidden",
        boxShadow: "none",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            aria-hidden="true"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "50%",
              bgcolor: "#E7F0F2",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            {exercise.exercise_name}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              size="small"
              label={`${exercise.prescribed_sets} ${exercise.prescribed_sets === 1 ? "série" : "séries"}`}
            />
            <Chip
              size="small"
              label={`${exercise.prescribed_repetitions} repetições`}
            />
            <Chip
              size="small"
              label={`Descanso: ${exercise.prescribed_rest_seconds} s`}
            />
          </Stack>
          {exercise.prescribed_instructions && (
            <Typography variant="body2" color="text.secondary">
              {exercise.prescribed_instructions}
            </Typography>
          )}
          {readOnly ? (
            <Stack
              spacing={1}
              aria-label={`Séries registradas de ${exercise.exercise_name}`}
            >
              {[...exercise.sets]
                .sort((a, b) => a.set_number - b.set_number)
                .map((set) => (
                  <Box
                    key={set.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F0F6F7",
                    }}
                  >
                    <Typography variant="body2">
                      Série {set.set_number}
                    </Typography>
                    <Typography variant="body2">
                      {set.repetitions} repetições
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {Number(set.load).toLocaleString("pt-BR")} kg
                    </Typography>
                  </Box>
                ))}
            </Stack>
          ) : (
            Array.from({ length: exercise.prescribed_sets }, (_, index) => {
              const number = index + 1;
              const recorded = exercise.sets.find(
                (set) => set.set_number === number,
              );
              return (
                <Box
                  key={`${number}-${recorded?.repetitions ?? ""}-${recorded?.load ?? ""}`}
                  component="form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = new FormData(event.currentTarget);
                    const repetitions = Number(fields.get("repetitions"));
                    const load = Number(fields.get("load"));
                    if (
                      !Number.isInteger(repetitions) ||
                      repetitions < 0 ||
                      !Number.isFinite(load) ||
                      load < 0
                    )
                      return;
                    void run(async () => {
                      unwrap(
                        await api.PUT(
                          "/api/v1/executions/{execution_id}/sets",
                          {
                            params: { path: { execution_id: exercise.id } },
                            body: { set_number: number, repetitions, load },
                          },
                        ),
                      );
                      await refresh();
                      onSaved(
                        `Série ${number} de ${exercise.exercise_name} salva.`,
                      );
                    });
                  }}
                  sx={{
                    p: 2,
                    bgcolor: recorded ? "#F2F8EB" : "#F5F8F9",
                    border: "1px solid",
                    borderColor: recorded ? "#DCEBCB" : "#E1EAED",
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      Série {number}
                    </Typography>
                    <Chip
                      size="small"
                      icon={recorded ? <CheckCircleOutlined /> : undefined}
                      color={recorded ? "success" : "default"}
                      label={recorded ? "Salva" : "Pendente"}
                    />
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "minmax(0, 1fr) minmax(0, 1fr)",
                        sm: "minmax(0, 1fr) minmax(0, 1fr) auto",
                      },
                      gap: 1.5,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      fullWidth
                      name="repetitions"
                      label={`Repetições · série ${number}`}
                      type="number"
                      required
                      disabled={busy}
                      defaultValue={recorded?.repetitions ?? ""}
                      slotProps={{
                        htmlInput: { min: 0, step: 1, inputMode: "numeric" },
                      }}
                    />
                    <TextField
                      fullWidth
                      name="load"
                      label={`Carga (kg) · série ${number}`}
                      type="number"
                      required
                      disabled={busy}
                      defaultValue={
                        recorded?.load ?? exercise.prescribed_load ?? ""
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: "0.01",
                          inputMode: "decimal",
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      startIcon={<SaveOutlined />}
                      variant={recorded ? "outlined" : "contained"}
                      disabled={busy}
                      sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
                    >
                      {recorded ? "Atualizar série" : "Salvar série"}
                    </Button>
                  </Box>
                </Box>
              );
            })
          )}
          <Button
            variant="outlined"
            startIcon={readOnly ? <CheckCircleOutlined /> : undefined}
            disabled={
              busy ||
              readOnly ||
              exercise.sets.length !== exercise.prescribed_sets
            }
            onClick={() =>
              run(async () => {
                unwrap(
                  await api.POST("/api/v1/executions/{execution_id}/complete", {
                    params: { path: { execution_id: exercise.id } },
                  }),
                );
                await refresh();
                onSaved(`${exercise.exercise_name} concluído.`);
              })
            }
          >
            {readOnly ? "Exercício concluído" : "Concluir exercício"}
          </Button>
          {!readOnly && (
            <Typography variant="caption" color="text.secondary">
              {exercise.sets.length} de {exercise.prescribed_sets} séries
              salvas. Alterações só são registradas ao salvar.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
