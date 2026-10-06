"use client";
import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: {
    primary: { main: "#08323A", light: "#125864" },
    secondary: { main: "#C9ED86", contrastText: "#08323A" },
    background: { default: "#F4F8F9", paper: "#FFFFFF" },
    text: { primary: "#08323A", secondary: "#52686E" },
    success: { main: "#456B20" },
  },
  typography: {
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    h3: { fontSize: "2rem", fontWeight: 750, letterSpacing: "-.04em" },
    h4: { fontSize: "1.65rem", fontWeight: 750, letterSpacing: "-.03em" },
    h5: { fontSize: "1.2rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, borderRadius: 10 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: "1px solid #DFE9EB" } },
    },
    MuiTextField: { defaultProps: { fullWidth: true, size: "small" } },
    MuiTableCell: {
      styleOverrides: {
        head: { background: "#F4F8F9", color: "#52686E", fontWeight: 700 },
        root: { borderColor: "#E8EFF0", paddingTop: 16, paddingBottom: 16 },
      },
    },
  },
});
