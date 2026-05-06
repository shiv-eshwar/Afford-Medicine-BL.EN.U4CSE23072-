"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTheme } from "@mui/material/styles";

const TABS = [
  { label: "All Notifications", href: "/", icon: <InboxIcon /> },
  { label: "Priority Inbox", href: "/priority", icon: <StarIcon /> },
];

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.href === pathname)
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar
          sx={{
            gap: 2,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <InboxIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, flexShrink: 0 }} component="div">
            Campus Notifications
          </Typography>

          {!isMobile && (
            <Tabs
              value={activeIndex}
              onChange={(_, i) => {
                const t = TABS[i];
                if (t) router.push(t.href);
              }}
              sx={{ ml: 3, flex: 1 }}
            >
              {TABS.map((t) => (
                <Tab
                  key={t.href}
                  icon={t.icon}
                  iconPosition="start"
                  label={t.label}
                  sx={{ minHeight: 48 }}
                />
              ))}
            </Tabs>
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Reload">
            <IconButton aria-label="reload" onClick={() => router.refresh()} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="md"
        sx={{ flex: 1, py: { xs: 2, sm: 3 }, pb: { xs: 9, sm: 3 } }}
      >
        {children}
      </Container>

      {isMobile && (
        <BottomNavigation
          showLabels
          value={activeIndex}
          onChange={(_, i) => {
            const t = TABS[i];
            if (t) router.push(t.href);
          }}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: "divider",
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          {TABS.map((t) => (
            <BottomNavigationAction key={t.href} label={t.label} icon={t.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
