"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import {
  DashboardOutlined,
  PeopleOutlined,
  FitnessCenter,
  Menu,
  Logout,
} from "@mui/icons-material";
import { Brand } from "@/components/atoms/Brand";
import { authAction, messageFor } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
const items = [
  { href: "/painel", label: "Visão geral", Icon: DashboardOutlined },
  { href: "/alunos", label: "Alunos", Icon: PeopleOutlined },
  { href: "/treinos", label: "Treinos", Icon: FitnessCenter },
];
export function AppNavigation() {
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const content = (
    <Stack
      sx={{ height: "100%", bgcolor: "primary.main", color: "white", p: 3 }}
      spacing={5}
    >
      <Brand inverse />
      <Stack component="nav" aria-label="Navegação principal" spacing={1}>
        {items.map(({ href, label, Icon }) => {
          const selected =
            href === "/painel" ? path === href : path.startsWith(href);
          return (
            <Button
              key={href}
              component={Link}
              href={href}
              startIcon={<Icon />}
              aria-current={selected ? "page" : undefined}
              onClick={() => setOpen(false)}
              sx={{
                justifyContent: "flex-start",
                px: 2,
                py: 1.5,
                color: selected ? "primary.main" : "#E7F0F2",
                bgcolor: selected ? "#EAF5D9" : "transparent",
                "&:hover": { bgcolor: selected ? "#DCEFC0" : "#125864" },
              }}
            >
              {label}
            </Button>
          );
        })}
      </Stack>
      <Box sx={{ flex: 1 }} />
      <Typography variant="body2" sx={{ color: "#D6E6E9" }}>
        Treino, acompanhamento e gestão em um só lugar.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        startIcon={<Logout />}
        disabled={busy}
        sx={{ color: "white", justifyContent: "flex-start" }}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await authAction("logout");
            cache.clear();
            router.replace("/login");
            router.refresh();
          } catch (cause) {
            setError(messageFor(cause));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saindo…" : "Sair da conta"}
      </Button>
    </Stack>
  );
  return (
    <>
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: 248,
          position: "fixed",
          inset: "0 auto 0 0",
        }}
      >
        {content}
      </Box>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          bgcolor: "white",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #DFE9EB",
        }}
      >
        <Brand />
        <IconButton aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu />
        </IconButton>
      </Box>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        {content}
      </Drawer>
    </>
  );
}
