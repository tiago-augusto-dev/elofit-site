"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ArrowForward } from "@mui/icons-material";
import { PageHeader } from "@/components/molecules/PageHeader";
import { QueryState } from "@/components/molecules/QueryState";
import { studentsOptions } from "./queries";
export function StudentsList({ compact = false }: { compact?: boolean }) {
  const result = useQuery(studentsOptions);
  const [search, setSearch] = useState("");
  const students = (result.data ?? []).filter((s) =>
    `${s.name} ${s.email}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const rows = compact ? students.slice(0, 5) : students;
  return (
    <>
      <PageHeader
        compact={compact}
        title={compact ? "Seus alunos" : "Alunos"}
        description={
          compact
            ? "Acesse o acompanhamento de cada aluno."
            : "Organize seus alunos e acompanhe o próximo passo."
        }
        action={
          <Button
            component={Link}
            href="/alunos/novo"
            color="secondary"
            variant="contained"
            startIcon={<Add />}
          >
            Novo aluno
          </Button>
        }
      />
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        {!compact && (
          <TextField
            label="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 420, mb: 3 }}
          />
        )}
        {result.isPending || result.error ? (
          <QueryState
            loading={result.isPending}
            error={result.error}
            retry={() => void result.refetch()}
          />
        ) : rows.length === 0 ? (
          <QueryState
            empty={
              search
                ? "Nenhum aluno corresponde à busca."
                : "Seu primeiro aluno começa aqui. Cadastre um aluno para preparar o acompanhamento."
            }
          />
        ) : (
          <>
            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <Stack spacing={2}>
                {rows.map((s) => (
                  <Paper key={s.id} sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700 }}>{s.name}</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {s.email}
                    </Typography>
                    <Button
                      component={Link}
                      href={`/alunos/${s.id}`}
                      endIcon={<ArrowForward />}
                    >
                      Ver perfil
                    </Button>
                  </Paper>
                ))}
              </Stack>
            </Box>
            <TableContainer sx={{ display: { xs: "none", sm: "block" } }}>
              <Table aria-label="Alunos cadastrados">
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mensalidade configurada</TableCell>
                    <TableCell>Acompanhamento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: "center" }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "#EAF5D9",
                              color: "primary.main",
                              width: 38,
                              height: 38,
                            }}
                          >
                            {s.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              {s.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {s.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={s.is_active ? "Ativo" : "Arquivado"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {s.monthly_fee
                          ? Number(s.monthly_fee).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "Não configurada"}
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          href={`/alunos/${s.id}`}
                          aria-label={`Ver perfil de ${s.name}`}
                          endIcon={<ArrowForward />}
                        >
                          Ver perfil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {compact && (
          <Button component={Link} href="/alunos" sx={{ mt: 2 }}>
            Ver todos os alunos
          </Button>
        )}
      </Paper>
    </>
  );
}
