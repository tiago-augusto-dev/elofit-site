"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import { FitnessCenter, EditNoteOutlined, HistoryOutlined, LogoutOutlined } from "@mui/icons-material";
import { Brand } from "@/components/atoms/Brand";
import { QueryState } from "@/components/molecules/QueryState";
import { api, authAction, messageFor, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { workoutsOptions } from "@/features/training/queries";
import { WorkoutOverview } from "./WorkoutOverview";
import { SessionRecorder } from "./SessionRecorder";
import { SessionHistory } from "./SessionHistory";

export function StudentArea({ studentId, studentName }: { studentId: string; studentName: string }) {
  const cache = useQueryClient();
  const [view, setView] = useState("workouts");
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const workouts = useQuery(workoutsOptions(studentId));
  const activeWorkouts =
    workouts.data?.filter((workout) => workout.is_active) ?? [];
  const selectedWorkout =
    activeWorkouts.find((workout) => workout.id === workoutId) ??
    activeWorkouts[0];
  const history = useQuery({
    queryKey: ["student-sessions", studentId],
    queryFn: async () => {
      const all: components["schemas"]["SessionRead"][] = [];
      let offset = 0;
      while (true) {
        const page = unwrap(
          await api.GET("/api/v1/students/{student_id}/sessions", {
            params: {
              path: { student_id: studentId },
              query: { limit: 100, offset },
            },
          }),
        );
        all.push(...page);
        if (page.length < 100) return all;
        offset += 100;
      }
    },
  });
  const session = useQuery({
    queryKey: ["student-session", studentId, sessionId],
    enabled: !!sessionId,
    queryFn: async () =>
      unwrap(
        await api.GET("/api/v1/sessions/{session_id}", {
          params: { path: { session_id: sessionId! } },
        }),
      ),
  });
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  }
  async function refreshExecution() {
    await Promise.all([
      cache.invalidateQueries({
        queryKey: ["student-session", studentId, sessionId],
      }),
      cache.invalidateQueries({ queryKey: ["student-sessions", studentId] }),
    ]);
  }
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <Stack
        component="header"
        direction="row"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          px: 2,
          py: 1.25,
          gap: 1.5,
          bgcolor: "primary.main",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: { xs: 128, sm: 160 }, flexShrink: 0 }}><Brand inverse /></Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
          <Box sx={{ minWidth: 0, maxWidth: { xs: 120, sm: 280 }, textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "#D6E6E9", display: "block", lineHeight: 1.3 }}>Aluno</Typography>
            <Typography title={studentName} noWrap sx={{ color: "white", fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.95rem" } }}>{studentName}</Typography>
          </Box>
        <Button
          startIcon={<LogoutOutlined />}
          disabled={busy}
          sx={{ color: "white", px: { xs: 1, sm: 2 }, flexShrink: 0, border: "1px solid #52737A", "&:hover": { bgcolor: "#125864" } }}
          onClick={() =>
            run(async () => {
              await cache.cancelQueries();
              await authAction("logout");
              // Discard the entire in-memory student cache after ending the session.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/login");
            })
          }
        >
          Sair
        </Button>
        </Stack>
      </Stack>
      <Stack
        component="main"
        id="conteudo"
        spacing={3}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          p: { xs: 2, sm: 4 },
          pb: { xs: 14, md: 4 },
        }}
      >
        <Box>
          <Typography variant="overline">EloFit · Aluno</Typography>
          <Typography variant="h3" component="h1">
            Meus treinos
          </Typography>
          <Typography color="text.secondary">
            Consulte seu plano e registre cada etapa do treino.
          </Typography>
        </Box>
        <Box component="nav" aria-label="Menu do aluno" sx={{
          bgcolor: "background.paper", border: "1px solid #DFE9EB",
          borderRadius: 3, p: 0.5, boxShadow: "0 4px 16px #08323A0D",
        }}>
        <Tabs
          value={view}
          onChange={(_, value) => {
            setView(value);
            setError("");
          }}
          aria-label="Área de treinos"
          variant="fullWidth"
          sx={{
            minHeight: 44,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTabs-list": { gap: 0.75 },
            "& .MuiTab-root": {
              minWidth: 0, minHeight: 44, py: 1, px: { xs: 1, sm: 2 },
              borderRadius: 2, fontWeight: 700, fontSize: { xs: "0.8rem", sm: "0.95rem" },
              color: "text.secondary",
              "&:hover": { bgcolor: "#F0F5F6" },
              "&.Mui-selected": { bgcolor: "secondary.main", color: "primary.main" },
              "&.Mui-focusVisible": { outline: "2px solid #125864", outlineOffset: -3 },
            },
          }}
        >
          <Tab
            icon={<FitnessCenter fontSize="small" />}
            iconPosition="start"
            label="Treinos"
            value="workouts"
            id="tab-workouts"
            aria-controls="panel-workouts"
          />
          <Tab
            icon={<EditNoteOutlined fontSize="small" />}
            iconPosition="start"
            label="Registro"
            value="record"
            id="tab-record"
            aria-controls="panel-record"
            disabled={!sessionId}
            aria-describedby={!sessionId ? "record-menu-help" : undefined}
          />
          <Tab
            icon={<HistoryOutlined fontSize="small" />}
            iconPosition="start"
            label="Histórico"
            value="history"
            id="tab-history"
            aria-controls="panel-history"
          />
        </Tabs>
        {!sessionId && <Typography id="record-menu-help" variant="caption" color="text.secondary" sx={{ display: "block", px: 1, pt: 0.75, pb: 0.25 }}>
          Para liberar o Registro, inicie um treino ou retome uma sessão pelo Histórico.
        </Typography>}
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {view === "workouts" && (
          <Stack
            id="panel-workouts"
            role="tabpanel"
            aria-labelledby="tab-workouts"
            spacing={3}
          >
            {workouts.isPending || workouts.error || !activeWorkouts.length ? (
              <QueryState
                loading={workouts.isPending}
                error={workouts.error}
                retry={() => workouts.refetch()}
                empty="Seu personal ainda não disponibilizou treinos."
              />
            ) : (
              <Stack spacing={3}>
                {activeWorkouts.length > 1 && (
                  <TextField
                    select
                    label="Selecionar treino"
                    value={selectedWorkout.id}
                    onChange={(event) => setWorkoutId(event.target.value)}
                  >
                    {activeWorkouts.map((workout) => (
                      <MenuItem key={workout.id} value={workout.id}>
                        {workout.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <WorkoutOverview
                  workout={selectedWorkout}
                  ongoing={
                    history.data?.find(
                      (item) =>
                        item.workout_id === selectedWorkout.id &&
                        !item.completed_at,
                    )?.id
                  }
                  busy={busy}
                  disabled={history.isPending || !!history.error}
                  onHistory={() => setView("history")}
                  onContinue={(id) => {
                    setView("record");
                    setSessionId(id);
                    setError("");
                    requestAnimationFrame(() =>
                      document
                        .getElementById("registro-treino")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                    );
                  }}
                  onStart={() =>
                    run(async () => {
                      const created = unwrap(
                        await api.POST(
                          "/api/v1/workouts/{workout_id}/sessions",
                          {
                            params: {
                              path: { workout_id: selectedWorkout.id },
                            },
                          },
                        ),
                      );
                      setView("record");
                      setSessionId(created.id);
                      await cache.invalidateQueries({
                        queryKey: ["student-sessions", studentId],
                      });
                      document
                        .getElementById("registro-treino")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    })
                  }
                />
              </Stack>
            )}
          </Stack>
        )}
        {
          <Stack
            id="panel-history"
            role="tabpanel"
            aria-labelledby="tab-history"
            sx={{ display: view === "history" ? "flex" : "none" }}
          >
            {history.isPending || history.error ? (
              <QueryState
                loading={history.isPending}
                error={history.error}
                retry={() => history.refetch()}
              />
            ) : (
              <SessionHistory
                sessions={history.data ?? []}
                busy={busy}
                onOpen={(id) => {
                  setSessionId(id);
                  setView("record");
                  setError("");
                }}
              />
            )}
          </Stack>
        }
        {sessionId && (
          <Stack
            id="panel-record"
            role="tabpanel"
            aria-labelledby="tab-record"
            sx={{ display: view === "record" ? "flex" : "none" }}
            spacing={2}
          >
            <Button
              sx={{ alignSelf: "flex-start" }}
              onClick={() => {
                setView("history");
                setError("");
              }}
            >
              Voltar ao histórico
            </Button>
            {session.isPending || session.error ? (
              <QueryState
                loading={session.isPending}
                error={session.error}
                retry={() => session.refetch()}
              />
            ) : (
              session.data && (
                <SessionRecorder
                  key={session.data.id}
                  session={session.data}
                  busy={busy}
                  run={run}
                  refresh={refreshExecution}
                />
              )
            )}
          </Stack>
        )}
      </Stack>
    </>
  );
}
