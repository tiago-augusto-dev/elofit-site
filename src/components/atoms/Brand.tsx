import { Box, Typography } from "@mui/material";
export function Brand({ inverse = false }: { inverse?: boolean }) {
  const base = inverse ? "#FFFFFF" : "#08323A";
  const accent = inverse ? "#C9ED86" : "#71952E";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <svg width="56" height="38" viewBox="0 0 64 44" aria-hidden="true">
        <g fill={base}>
          <rect x="1" y="14" width="5" height="16" rx="2.5" />
          <rect x="8" y="8" width="6" height="28" rx="3" />
          <rect x="16" y="3" width="7" height="38" rx="3.5" />
          <rect x="42" y="3" width="7" height="38" rx="3.5" />
          <rect x="51" y="8" width="6" height="28" rx="3" />
          <rect x="59" y="14" width="5" height="16" rx="2.5" />
        </g>
        <path
          d="M23 27c-5-5 0-13 6-12l8 3c7 2 6 10 1 12-4 2-8-1-11-3"
          fill="none"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M22 22h9m7 0h5"
          stroke={base}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <Typography
        component="span"
        sx={{
          fontSize: 29,
          fontWeight: 800,
          letterSpacing: "-.06em",
          color: base,
        }}
      >
        Elo
        <Box component="span" sx={{ color: accent }}>
          Fit
        </Box>
      </Typography>
    </Box>
  );
}
