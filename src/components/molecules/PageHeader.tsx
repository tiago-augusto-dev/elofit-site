import { Stack, Typography, Box } from "@mui/material";
export function PageHeader({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{ gap: 2, justifyContent: "space-between", mb: 4 }}
    >
      <Box>
        <Typography
          component={compact ? "h2" : "h1"}
          variant={compact ? "h5" : "h3"}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </Box>
      {action && <Box sx={{ alignSelf: "flex-start" }}>{action}</Box>}
    </Stack>
  );
}
