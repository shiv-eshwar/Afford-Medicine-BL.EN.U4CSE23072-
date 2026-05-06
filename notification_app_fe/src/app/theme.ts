"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#7b1fa2" },
    success: { main: "#2e7d32" },
    info: { main: "#0277bd" },
    warning: { main: "#ef6c00" },
    background: { default: "#f5f7fb", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      'var(--app-font), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, transition: "box-shadow 200ms ease" },
      },
    },
  },
});

export default theme;
