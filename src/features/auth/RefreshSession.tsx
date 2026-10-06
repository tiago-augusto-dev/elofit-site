"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { authAction, messageFor } from "@/lib/api/client";
export function RefreshSession() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    const work = async () => {
      try {
        await authAction("refresh");
        router.refresh();
      } catch (cause) {
        setError(messageFor(cause));
      }
    };
    if (navigator.locks) void navigator.locks.request("elofit-refresh", work);
    else void work();
  }, [router]);
  return (
    <Stack spacing={2} sx={{ maxWidth: 450, m: "15vh auto", p: 3 }}>
      <Typography>Renovando seu acesso…</Typography>
      {error && (
        <>
          <Alert severity="warning">{error}</Alert>
          <Button href="/login">Entrar novamente</Button>
        </>
      )}
    </Stack>
  );
}
