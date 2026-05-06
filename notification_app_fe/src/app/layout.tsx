import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { roboto } from "./fonts";
import { AppLayoutShell } from "@/component/AppLayoutShell";

export const metadata: Metadata = {
  title: "Campus Notifications",
  description:
    "Track Placement, Result, and Event updates with a focused priority inbox.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1565c0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className} style={{ ["--app-font" as string]: roboto.style.fontFamily }}>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppLayoutShell>{children}</AppLayoutShell>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
