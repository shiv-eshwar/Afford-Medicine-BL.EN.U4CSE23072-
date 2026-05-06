"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { Log } from "logging-middleware";

import { FilterBar } from "@/component/FilterBar";
import { NotificationCard } from "@/component/NotificationCard";
import {
  EmptyState,
  ErrorBanner,
  LoadingList,
} from "@/component/StatusViews";
import { usePriorityNotifications } from "@/hook/useNotifications";
import { useReadState } from "@/hook/useReadState";
import { PRIORITY_N_OPTIONS, type NotificationType } from "@/config";

const SLIDER_MARKS = PRIORITY_N_OPTIONS.map((v) => ({ value: v, label: String(v) }));
const N_MIN = PRIORITY_N_OPTIONS[0];
const N_MAX = PRIORITY_N_OPTIONS[PRIORITY_N_OPTIONS.length - 1];

export default function PriorityInboxPage() {
  const [n, setN] = useState<number>(10);
  const [type, setType] = useState<NotificationType | "all">("all");
  const { isRead, markAsRead } = useReadState();

  const { state, refresh } = usePriorityNotifications(
    n,
    type === "all" ? undefined : type
  );

  useEffect(() => {
    void Log("frontend", "info", "page", `rendered Priority Inbox (n=${n})`);
  }, [n]);

  const items = state.data?.data ?? [];
  const decorated = items
    .map((n) => ({ ...n, is_read: n.is_read || isRead(n.id) }))
    .filter((n) => !n.is_read);

  const weights = state.data?.meta.weights;

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
          <Stack direction="row" spacing={1} alignItems="center">
            <StarIcon color="warning" />
            <Typography variant="h5">Priority Inbox</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Top {n} unread notifications, ranked by type weight and recency.
          </Typography>
        </Box>
        {weights && (
          <Stack direction="row" spacing={0.5}>
            {(Object.keys(weights) as NotificationType[]).map((k) => (
              <Chip
                key={k}
                size="small"
                variant="outlined"
                label={`${k} ×${weights[k]}`}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography
          id="n-slider-label"
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          How many to show
        </Typography>
        <Slider
          aria-labelledby="n-slider-label"
          value={n}
          step={null}
          marks={SLIDER_MARKS}
          min={N_MIN}
          max={N_MAX}
          onChange={(_, v) => setN(typeof v === "number" ? v : (v[0] ?? 10))}
          valueLabelDisplay="auto"
        />
      </Card>

      <FilterBar type={type} onChange={setType} />

      {state.loading && !state.data && <LoadingList rows={Math.min(n, 5)} />}

      {state.error && (
        <ErrorBanner message={state.error} onRetry={() => refresh()} />
      )}

      {!state.loading && !state.error && decorated.length === 0 && (
        <EmptyState
          title="Inbox at zero"
          hint="No unread notifications match the current filter."
        />
      )}

      {decorated.length > 0 && (
        <Stack spacing={1.25}>
          {decorated.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              type={item.type}
              message={item.message}
              timestamp={item.timestamp}
              isRead={item.is_read}
              priorityScore={item.priority_score}
              onMarkRead={(id) => void markAsRead(id)}
              onView={(id) => void markAsRead(id)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
