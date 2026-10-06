"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  ExpandMore,
  FitnessCenter,
  FormatListBulleted,
  InfoOutlined,
  LayersOutlined,
  PlayArrow,
} from "@mui/icons-material";
import type { components } from "@/lib/api/schema";

type Workout = components["schemas"]["WorkoutRead"];
export function WorkoutOverview({
  workout,
  ongoing,
  busy,
  disabled,
  onStart,
  onContinue,
  onHistory,
}: {
  workout: Workout;
  ongoing?: string;
  busy: boolean;
  disabled: boolean;
  onStart: () => void;
  onContinue: (id: string) => void;
  onHistory: () => void;
}) {
  const label = ongoing ? "Continuar treino" : "Iniciar treino";
  const seriesCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  );
  const action = () => (ongoing ? onContinue(ongoing) : onStart());
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "minmax(0, 1fr) 280px",
        },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <Stack spacing={1}>
          <Typography
            component="h2"
            variant="h4"
            sx={{ overflowWrap: "anywhere" }}
          >
            {workout.name}
          </Typography>
          {workout.instructions && (
            <Typography color="text.secondary">
              {workout.instructions}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", rowGap: 1, pt: 1 }}
          >
            <Chip
              icon={<FitnessCenter />}
              label={`${workout.exercises.length} ${workout.exercises.length === 1 ? "exercício" : "exercícios"}`}
              variant="outlined"
            />
            <Chip
              icon={<LayersOutlined />}
              label={`${seriesCount} ${seriesCount === 1 ? "série" : "séries"}`}
              variant="outlined"
            />
          </Stack>
        </Stack>
        {workout.exercises.map((exercise, index) => (
          <Card key={exercise.id} component="article" variant="outlined">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "40px minmax(0, 1fr)",
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "#E7F0F2",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Box>
                  <Typography
                    component="h3"
                    variant="h6"
                    sx={{ overflowWrap: "anywhere", fontWeight: 700 }}
                  >
                    {exercise.exercise_name}
                  </Typography>
                </Box>
                <Box
                  component="dl"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    m: 0,
                  }}
                >
                  {[
                    ["Séries", exercise.sets],
                    ["Repetições", exercise.repetitions],
                    ["Descanso", `${exercise.rest_seconds} s`],
                  ].map(([name, value], metricIndex) => (
                    <Box
                      key={name}
                      sx={{
                        minWidth: 0,
                        px: { xs: 1, sm: 2 },
                        borderLeft: metricIndex ? "1px solid #DBE7EA" : "none",
                      }}
                    >
                      <Typography
                        component="dt"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: 10, sm: 12 },
                          textTransform: "uppercase",
                          mb: 0.5,
                        }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        component="dd"
                        sx={{
                          m: 0,
                          fontSize: { xs: 22, sm: 26 },
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ px: 2, py: 1, bgcolor: "#F0F6F7", borderRadius: 2 }}>
                  <Typography variant="body2">
                    Carga:{" "}
                    {exercise.target_load === null
                      ? "não definida"
                      : `${Number(exercise.target_load).toLocaleString("pt-BR")} kg`}
                  </Typography>
                </Box>
                {exercise.instructions && (
                  <Box
                    component="details"
                    sx={{
                      borderTop: "1px solid #E4EDF0",
                      pt: 1,
                      "&[open] .orientation-chevron": {
                        transform: "rotate(180deg)",
                      },
                    }}
                  >
                    <Box
                      component="summary"
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 1,
                        listStyle: "none",
                        "&::-webkit-details-marker": { display: "none" },
                        "&:focus-visible": {
                          outline: "2px solid #125864",
                          outlineOffset: 3,
                          borderRadius: 1,
                        },
                      }}
                    >
                      <ExpandMore
                        className="orientation-chevron"
                        sx={{ transition: "transform .15s" }}
                      />
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                      >
                        Orientações
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ pt: 1, pb: 0.5 }}
                    >
                      {exercise.instructions}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Card
        component="aside"
        variant="outlined"
        sx={{
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: 24,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography component="h3" variant="h5">
                Seu treino
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {ongoing ? "Treino em andamento" : "Pronto para começar"}
              </Typography>
            </Box>
            <Button
              startIcon={<PlayArrow />}
              variant="contained"
              color="secondary"
              size="large"
              disabled={disabled || busy}
              onClick={action}
            >
              {busy ? "Aguarde…" : label}
            </Button>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "flex-start" }}
            >
              <InfoOutlined fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                Você pode salvar e continuar depois.
              </Typography>
            </Stack>
            <Button
              startIcon={<FormatListBulleted />}
              onClick={onHistory}
              sx={{
                borderTop: "1px solid #E4EDF0",
                pt: 2,
                justifyContent: "flex-start",
              }}
            >
              Ver histórico
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          pb: "max(16px, env(safe-area-inset-bottom))",
          bgcolor: "background.paper",
          borderTop: "1px solid #DBE7EA",
          boxShadow: "0 -4px 16px rgba(8,50,58,.06)",
          zIndex: 10,
        }}
      >
        <Button
          fullWidth
          startIcon={<PlayArrow />}
          variant="contained"
          color="secondary"
          size="large"
          disabled={disabled || busy}
          onClick={action}
        >
          {busy ? "Aguarde…" : label}
        </Button>
      </Box>
    </Box>
  );
}
