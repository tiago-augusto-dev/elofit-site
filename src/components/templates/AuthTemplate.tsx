"use client";
import { Box, Stack, Typography } from "@mui/material";
import { Brand } from "@/components/atoms/Brand";
export function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(360px, 44%) 1fr" },
      }}
    >
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          p: { xs: 3, md: 7 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <Brand inverse />
        <Stack
          spacing={3}
          sx={{ display: { xs: "none", md: "flex" }, maxWidth: 440 }}
        >
          <Typography
            component="p"
            sx={{
              fontSize: { md: 44, lg: 54 },
              fontWeight: 750,
              lineHeight: 1.08,
              letterSpacing: "-.045em",
            }}
          >
            Mais conexão.
            <br />
            <Box component="span" sx={{ color: "secondary.main" }}>
              Mais evolução.
            </Box>
          </Typography>
          <Typography sx={{ color: "#D6E6E9", fontSize: 18, lineHeight: 1.7 }}>
            Treino, acompanhamento e gestão em um só lugar. Sua rotina
            organizada para cuidar de cada aluno.
          </Typography>
          <Box sx={{ border: "1px solid #376068", borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 700 }}>
              Seu trabalho, com mais clareza.
            </Typography>
            <Typography sx={{ color: "#D6E6E9", mt: 1 }}>
              Organize alunos, prepare treinos e acompanhe o próximo passo.
            </Typography>
          </Box>
        </Stack>
        <Typography
          variant="body2"
          sx={{ color: "#D6E6E9", display: { xs: "none", md: "block" } }}
        >
          EloFit · Gestão para personal trainers
        </Typography>
      </Box>
      <Box
        component="main"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, md: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 430 }}>{children}</Box>
      </Box>
    </Box>
  );
}
