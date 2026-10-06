import { Alert, Button, Skeleton, Stack, Typography } from "@mui/material";
import { ApiError, messageFor } from "@/lib/api/client";
export function QueryState({
  loading,
  error,
  retry,
  empty,
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  empty?: string;
}) {
  if (loading)
    return (
      <Stack spacing={2} aria-busy="true" aria-label="Carregando dados">
        <Skeleton variant="rounded" height={70} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    );
  if (error)
    return (
      <Alert
        severity="error"
        action={
          retry && (
            <Button color="inherit" onClick={retry}>
              Tentar novamente
            </Button>
          )
        }
      >
        {messageFor(error)}
        {error instanceof ApiError && error.requestId && (
          <Typography variant="caption" component="div">
            Referência: {error.requestId}
          </Typography>
        )}
      </Alert>
    );
  return (
    <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
      {empty}
    </Typography>
  );
}
