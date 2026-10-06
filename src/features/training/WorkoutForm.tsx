"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DeleteOutlined, Add } from "@mui/icons-material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { QueryState } from "@/components/molecules/QueryState";
import { studentsOptions } from "@/features/students/queries";
import { exercisesOptions } from "./queries";
import { api, messageFor, unwrap } from "@/lib/api/client";
const item = z.object({
  exercise_id: z.string().uuid("Selecione um exercício."),
  sets: z.number().int().min(1, "Mínimo de uma série."),
  repetitions: z.string().trim().min(1, "Informe as repetições.").max(50),
  rest_seconds: z.number().int().min(0),
  target_load: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) < 1000000),
      "Informe uma carga válida, com até duas casas decimais.",
    ),
  instructions: z.string().max(2000),
});
const schema = z.object({
  student_id: z.string().uuid("Selecione um aluno."),
  name: z.string().trim().min(1, "Dê um nome ao treino.").max(150),
  instructions: z.string().max(4000),
  exercises: z.array(item).min(1).max(100),
});
type Values = z.infer<typeof schema>;
const newItem = () => ({
  exercise_id: "",
  sets: 3,
  repetitions: "10",
  rest_seconds: 60,
  target_load: "",
  instructions: "",
});
export function WorkoutForm({ studentId = "" }: { studentId?: string }) {
  const students = useQuery(studentsOptions);
  const exercises = useQuery(exercisesOptions);
  const cache = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: studentId,
      name: "",
      instructions: "",
      exercises: [newItem()],
    },
  });
  const fields = useFieldArray({ control, name: "exercises" });
  if (
    students.isPending ||
    exercises.isPending ||
    students.error ||
    exercises.error
  )
    return (
      <QueryState
        loading={students.isPending || exercises.isPending}
        error={students.error || exercises.error}
        retry={() => {
          void students.refetch();
          void exercises.refetch();
        }}
      />
    );
  if (
    !students.data.some((s) => s.is_active) ||
    !exercises.data.some((e) => e.is_active)
  )
    return (
      <>
        <PageHeader
          title="Montar treino"
          description="Primeiro, cadastre um aluno ativo e um exercício."
        />
        <Alert severity="info">
          Você precisa de pelo menos um aluno ativo e um exercício na
          biblioteca.
        </Alert>
        <Stack direction="row" sx={{ gap: 2, mt: 2 }}>
          <Button component={Link} href="/alunos/novo">
            Cadastrar aluno
          </Button>
          <Button component={Link} href="/treinos">
            Adicionar exercício
          </Button>
        </Stack>
      </>
    );
  return (
    <>
      <PageHeader
        title="Montar treino"
        description="Organize séries, cargas e orientações para seu aluno."
      />
      <Stack
        component="form"
        noValidate
        spacing={3}
        onSubmit={handleSubmit(async (data) => {
          setError("");
          try {
            const body = {
              ...data,
              instructions: data.instructions || null,
              exercises: data.exercises.map((e) => ({
                ...e,
                target_load: e.target_load === "" ? null : e.target_load,
                instructions: e.instructions || null,
              })),
            };
            unwrap(await api.POST("/api/v1/workouts", { body }));
            await cache.invalidateQueries({
              queryKey: ["workouts", data.student_id],
            });
            router.push(`/alunos/${data.student_id}`);
          } catch (cause) {
            setError(messageFor(cause));
          }
        })}
      >
        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              label="Aluno"
              defaultValue={studentId}
              {...register("student_id")}
              error={!!errors.student_id}
              helperText={errors.student_id?.message}
            >
              <MenuItem value="">Selecione</MenuItem>
              {students.data
                .filter((s) => s.is_active)
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Nome do treino"
              placeholder="Treino A · Inferiores"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Orientações gerais (opcional)"
              multiline
              minRows={2}
              {...register("instructions")}
            />
          </Stack>
        </Paper>
        {fields.fields.map((field, index) => (
          <Paper key={field.id} sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h5">Exercício {index + 1}</Typography>
              <IconButton
                aria-label={`Remover exercício ${index + 1}`}
                disabled={fields.fields.length === 1}
                onClick={() => fields.remove(index)}
              >
                <DeleteOutlined />
              </IconButton>
            </Stack>
            <Stack spacing={3}>
              <TextField
                select
                label="Exercício"
                defaultValue=""
                {...register(`exercises.${index}.exercise_id`)}
                error={!!errors.exercises?.[index]?.exercise_id}
                helperText={errors.exercises?.[index]?.exercise_id?.message}
              >
                <MenuItem value="">Selecione</MenuItem>
                {exercises.data
                  .filter((e) => e.is_active)
                  .map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.name}
                    </MenuItem>
                  ))}
              </TextField>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Séries"
                  type="number"
                  {...register(`exercises.${index}.sets`, {
                    valueAsNumber: true,
                  })}
                  error={!!errors.exercises?.[index]?.sets}
                  helperText={errors.exercises?.[index]?.sets?.message}
                />
                <TextField
                  label="Repetições"
                  {...register(`exercises.${index}.repetitions`)}
                  error={!!errors.exercises?.[index]?.repetitions}
                  helperText={errors.exercises?.[index]?.repetitions?.message}
                />
                <TextField
                  label="Carga (kg, opcional)"
                  {...register(`exercises.${index}.target_load`)}
                  error={!!errors.exercises?.[index]?.target_load}
                  helperText={errors.exercises?.[index]?.target_load?.message}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                <TextField
                  label="Descanso (segundos)"
                  type="number"
                  {...register(`exercises.${index}.rest_seconds`, {
                    valueAsNumber: true,
                  })}
                  error={!!errors.exercises?.[index]?.rest_seconds}
                  helperText={errors.exercises?.[index]?.rest_seconds?.message}
                />
              </Box>
              <TextField
                label="Orientações (opcional)"
                {...register(`exercises.${index}.instructions`)}
              />
            </Stack>
          </Paper>
        ))}
        <Button
          startIcon={<Add />}
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
          disabled={fields.fields.length >= 100}
          onClick={() => fields.append(newItem())}
        >
          Adicionar exercício
        </Button>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction="row" sx={{ gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando…" : "Salvar treino"}
          </Button>
          <Button component={Link} href="/treinos">
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
