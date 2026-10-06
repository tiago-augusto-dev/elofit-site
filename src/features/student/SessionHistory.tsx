"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  HistoryOutlined,
  PlayArrow,
  CheckCircleOutlined,
} from "@mui/icons-material";
import type { components } from "@/lib/api/schema";
type Session = components["schemas"]["SessionRead"];
export function SessionHistory({
  sessions,
  busy,
  onOpen,
}: {
  sessions: Session[];
  busy: boolean;
  onOpen: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const sorted = [...sessions].sort(
    (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
  );
  const pending = sorted.filter((item) => !item.completed_at);
  const completed = sorted.filter((item) => item.completed_at);
  const matches = sorted.filter(
    (item) =>
      item.workout_name
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (status === "all" ||
        (status === "completed" ? !!item.completed_at : !item.completed_at)),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(matches.length / 6)),
  );
  const preview = (items: Session[]) =>
    items.map((item) => (
      <Card key={item.id} variant="outlined">
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
              <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
                {item.workout_name}
              </Typography>
              <Chip
                size="small"
                color={item.completed_at ? "success" : "default"}
                label={item.completed_at ? "Concluído" : "Em andamento"}
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {new Date(item.started_at).toLocaleString("pt-BR")}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                variant="outlined"
                label={`${item.exercises.filter((exercise) => exercise.completed_at).length}/${item.exercises.length} exercícios concluídos`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${item.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} séries registradas`}
              />
            </Stack>
            <Button
              startIcon={
                item.completed_at ? <HistoryOutlined /> : <PlayArrow />
              }
              variant={item.completed_at ? "outlined" : "contained"}
              disabled={busy}
              sx={{ alignSelf: { sm: "flex-start" } }}
              onClick={() => onOpen(item.id)}
            >
              {item.completed_at ? "Ver registro" : "Continuar treino"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    ));
  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h2" variant="h5">
          Histórico de treinos
        </Typography>
        <Typography color="text.secondary">
          Retome uma sessão ou consulte as séries que você registrou.
        </Typography>
      </Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip icon={<PlayArrow />} label={`${pending.length} em andamento`} />
        <Chip
          icon={<CheckCircleOutlined />}
          label={`${completed.length} ${completed.length === 1 ? "concluído" : "concluídos"}`}
          color="success"
          variant="outlined"
        />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          fullWidth
          label="Buscar treino no histórico"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <TextField
          select
          label="Status do treino"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pending">Em andamento</MenuItem>
          <MenuItem value="completed">Concluídos</MenuItem>
        </TextField>
      </Stack>
      <Stack spacing={2}>
        {!matches.length && (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Nenhum treino encontrado com esses filtros.
          </Typography>
        )}
        {matches
          .slice((currentPage - 1) * 6, currentPage * 6)
          .some((item) => !item.completed_at) && (
          <>
            <Typography component="h3" variant="h6">
              Em andamento
            </Typography>
            {preview(
              matches
                .slice((currentPage - 1) * 6, currentPage * 6)
                .filter((item) => !item.completed_at),
            )}
          </>
        )}
        {matches
          .slice((currentPage - 1) * 6, currentPage * 6)
          .some((item) => item.completed_at) && (
          <>
            <Typography component="h3" variant="h6">
              Concluídos
            </Typography>
            {preview(
              matches
                .slice((currentPage - 1) * 6, currentPage * 6)
                .filter((item) => item.completed_at),
            )}
          </>
        )}
      </Stack>
      {matches.length > 6 && (
        <Pagination
          aria-label="Páginas do histórico"
          count={Math.ceil(matches.length / 6)}
          page={currentPage}
          onChange={(_, value) => setPage(value)}
          sx={{ alignSelf: "center" }}
        />
      )}
    </Stack>
  );
}
