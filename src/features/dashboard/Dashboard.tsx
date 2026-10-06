"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { PeopleOutlined, FitnessCenter } from "@mui/icons-material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { QueryState } from "@/components/molecules/QueryState";
import { studentsOptions } from "@/features/students/queries";
import { StudentsList } from "@/features/students/StudentsList";
export function Dashboard() {
  const result = useQuery(studentsOptions);
  return (
    <>
      <PageHeader
        title="Seu espaço de acompanhamento"
        description="Cada aluno tem um próximo passo. Vamos organizar o de hoje?"
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <PeopleOutlined
              sx={{ bgcolor: "#EAF5D9", p: 1, fontSize: 48, borderRadius: 3 }}
            />
            <Box>
              <Typography color="text.secondary">Alunos ativos</Typography>
              {result.isPending || result.error ? (
                <QueryState
                  loading={result.isPending}
                  error={result.error}
                  retry={() => void result.refetch()}
                />
              ) : (
                <Typography variant="h3" component="p">
                  {result.data.filter((s) => s.is_active).length}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
          <FitnessCenter sx={{ color: "secondary.main", mb: 1 }} />
          <Typography variant="h5">Prepare o próximo treino</Typography>
          <Typography sx={{ color: "#D6E6E9", mt: 1, mb: 2 }}>
            Escolha um aluno e monte uma prescrição para ele.
          </Typography>
          <Button
            component={Link}
            href="/treinos"
            color="secondary"
            variant="contained"
          >
            Organizar treinos
          </Button>
        </Paper>
      </Box>
      <StudentsList compact />
    </>
  );
}
