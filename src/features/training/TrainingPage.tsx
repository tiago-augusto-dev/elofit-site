"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { QueryState } from "@/components/molecules/QueryState";
import { api, messageFor, unwrap } from "@/lib/api/client";
import { exercisesOptions } from "./queries";
const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(150),
  muscle_group: z.string().max(100),
  instructions: z.string().max(2000),
});
export function TrainingPage() {
  const query = useQuery(exercisesOptions);
  const cache = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", muscle_group: "", instructions: "" },
  });
  return (
    <>
      <PageHeader
        title="Treinos"
        description="Construa sua biblioteca e prepare prescrições para cada aluno."
        action={
          <Button
            component={Link}
            href="/treinos/novo"
            variant="contained"
            color="secondary"
          >
            Montar treino
          </Button>
        }
      />
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Adicionar exercício
          </Typography>
          <Stack
            component="form"
            spacing={2}
            noValidate
            onSubmit={handleSubmit(async (data) => {
              setError("");
              setSuccess(false);
              try {
                unwrap(
                  await api.POST("/api/v1/exercises", {
                    body: {
                      name: data.name,
                      muscle_group: data.muscle_group || null,
                      instructions: data.instructions || null,
                    },
                  }),
                );
                await cache.invalidateQueries({ queryKey: ["exercises"] });
                reset();
                setSuccess(true);
              } catch (cause) {
                setError(messageFor(cause));
              }
            })}
          >
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
              <TextField
                label="Nome do exercício"
                {...register("name")}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              <TextField
                label="Grupo muscular (opcional)"
                {...register("muscle_group")}
                error={!!errors.muscle_group}
                helperText={errors.muscle_group?.message}
              />
            </Stack>
            <TextField
              label="Orientações (opcional)"
              multiline
              minRows={2}
              {...register("instructions")}
            />
            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">
                Exercício adicionado à sua biblioteca.
              </Alert>
            )}
            <Button
              type="submit"
              variant="outlined"
              disabled={isSubmitting}
              sx={{ alignSelf: "flex-start" }}
            >
              {isSubmitting ? "Salvando…" : "Adicionar exercício"}
            </Button>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Sua biblioteca
          </Typography>
          {query.isPending || query.error ? (
            <QueryState
              loading={query.isPending}
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : query.data.length === 0 ? (
            <QueryState empty="Adicione seu primeiro exercício para montar treinos." />
          ) : (
            <Stack spacing={2}>
              {query.data.map((e) => (
                <Paper key={e.id} sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {e.name}
                    {!e.is_active && " · Arquivado"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {e.muscle_group ?? "Grupo muscular não informado"}
                  </Typography>
                  {e.instructions && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {e.instructions}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  );
}
