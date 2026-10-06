"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Paper, Stack, TextField } from "@mui/material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { api, messageFor, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(150),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: z.string().max(30),
});
export function StudentForm({
  student,
}: {
  student?: components["schemas"]["StudentRead"];
}) {
  const router = useRouter();
  const cache = useQueryClient();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: student?.name ?? "",
      email: student?.email ?? "",
      phone: student?.phone ?? "",
    },
  });
  return (
    <>
      <PageHeader
        title={student ? "Editar aluno" : "Novo aluno"}
        description="O aluno ficará vinculado à sua conta de personal."
      />
      <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 680 }}>
        <Stack
          component="form"
          noValidate
          spacing={3}
          onSubmit={handleSubmit(async (data) => {
            setError("");
            try {
              const body = { ...data, phone: data.phone.trim() || null };
              const saved = student
                ? unwrap(
                    await api.PUT("/api/v1/students/{student_id}", {
                      params: { path: { student_id: student.id } },
                      body,
                    }),
                  )
                : unwrap(await api.POST("/api/v1/students", { body }));
              await cache.invalidateQueries({ queryKey: ["students"] });
              router.push(`/alunos/${saved.id}`);
            } catch (cause) {
              setError(messageFor(cause));
            }
          })}
        >
          <TextField
            label="Nome completo"
            autoComplete="name"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={!!errors.email}
            helperText={
              errors.email?.message ??
              (student
                ? "Alterar o e-mail exige uma nova confirmação pelo aluno."
                : undefined)
            }
          />
          <TextField
            label="Telefone (opcional)"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" sx={{ gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando…" : "Salvar aluno"}
            </Button>
            <Button
              component={Link}
              href={student ? `/alunos/${student.id}` : "/alunos"}
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
