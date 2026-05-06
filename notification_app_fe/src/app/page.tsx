"use client";

import { useEffect, useState } from "react";
import { Box, Button, Pagination, Stack, Typography } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Log } from "logging-middleware";

import { FilterBar } from "@/component/FilterBar";
import { NotificationCard } from "@/component/NotificationCard";
import { EmptyState, ErrorBanner, LoadingList } from "@/component/StatusViews";
import { useNotificationsList } from "@/hook/useNotifications";
import { useReadState } from "@/hook/useReadState";
import type { NotificationType } from "@/config";

const PAGE_SIZE = 20;

export default function AllNotificationsPage() {
  const [type, setType] = useState<NotificationType | "all">("all");
  const [page, setPage] = useState(1);
  const { isRead, markAsRead, markAllAsRead } = useReadState();

  const { state, refresh } = useNotificationsList({
    limit: PAGE_SIZE,
    page,
    notificationType: type === "all" ? undefined : type,
  });

  useEffect(() => {
    void Log("frontend", "info", "page", "rendered All Notifications page");
  }, []);

  const items = state.data?.data ?? [];
  const decorated = items.map((n) => ({ ...n, is_read: n.is_read || isRead(n.id) }));
  const unreadCount = decorated.filter((n) => !n.is_read).length;

  async function handleMarkAll() {
    const ids = decorated.filter((n) => !n.is_read).map((n) => n.id);
    await markAllAsRead(ids);
    void Log("frontend", "info", "page", `marked ${ids.length} read from All page`);
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">All Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} new · {decorated.length} on this page
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </Stack>

      <FilterBar
        type={type}
        onChange={(next) => {
          setType(next);
          setPage(1);
        }}
      />

      {state.loading && !state.data && <LoadingList rows={6} />}

      {state.error && <ErrorBanner message={state.error} onRetry={() => refresh()} />}

      {!state.loading && !state.error && decorated.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          hint="When new notifications arrive, they will show up on this page."
        />
      )}

      {decorated.length > 0 && (
        <Stack spacing={1.25}>
          {decorated.map((n) => (
            <NotificationCard
              key={n.id}
              id={n.id}
              type={n.type}
              message={n.message}
              timestamp={n.timestamp}
              isRead={n.is_read}
              onMarkRead={(id) => void markAsRead(id)}
              onView={(id) => void markAsRead(id)}
            />
          ))}
        </Stack>
      )}

      {decorated.length > 0 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            color="primary"
            page={page}
            onChange={(_, p) => setPage(p)}
            count={Math.max(page, items.length === PAGE_SIZE ? page + 1 : page)}
            siblingCount={0}
            boundaryCount={1}
          />
        </Stack>
      )}
    </Box>
  );
}
