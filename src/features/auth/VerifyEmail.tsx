"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { authAction, messageFor } from "@/lib/api/client";
export function VerifyEmail({ token }: { token: string }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Stack spacing={3}>
      <Typography variant="h3" component="h2">
        Confirme seu e-mail
      </Typography>
      <Typography color="text.secondary">
        Conclua a confirmação para manter seu cadastro atualizado.
      </Typography>
      {status ? (
        <Alert severity="success">{status}</Alert>
      ) : (
        <Button
          variant="contained"
          disabled={busy || !token}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await authAction("verify-email", { token });
              setStatus("E-mail confirmado. Você já pode entrar.");
            } catch (cause) {
              setError(messageFor(cause));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Confirmando…" : "Confirmar e-mail"}
        </Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <Button component={Link} href="/login">
        Voltar para entrar
      </Button>
      <Button component={Link} href="/confirmar-email">
        Solicitar novo link
      </Button>
    </Stack>
  );
}
