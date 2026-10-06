"use client";
import { Box } from "@mui/material";
import { AppNavigation } from "@/components/organisms/AppNavigation";
export function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <AppNavigation />
      <Box
        component="main"
        id="conteudo"
        sx={{
          ml: { md: "248px" },
          p: { xs: 2.5, sm: 4, lg: 5 },
          maxWidth: 1700,
        }}
      >
        {children}
      </Box>
    </>
  );
}
