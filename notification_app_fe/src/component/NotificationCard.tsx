"use client";

import { useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import GradingIcon from "@mui/icons-material/Grading";
import WorkIcon from "@mui/icons-material/Work";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import type { NotificationType } from "@/config";

export interface NotificationCardProps {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  isRead: boolean;
  priorityScore?: number;
  onMarkRead?: (id: string) => void;
  onView?: (id: string) => void;
}

const TYPE_META: Record<
  NotificationType,
  { color: "primary" | "success" | "info"; icon: React.ReactElement; label: string }
> = {
  Placement: { color: "primary", icon: <WorkIcon fontSize="small" />, label: "Placement" },
  Result: { color: "success", icon: <GradingIcon fontSize="small" />, label: "Result" },
  Event: { color: "info", icon: <EventIcon fontSize="small" />, label: "Event" },
};

function formatRelative(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function NotificationCard({
  id,
  type,
  message,
  timestamp,
  isRead,
  priorityScore,
  onMarkRead,
  onView,
}: NotificationCardProps) {
  const meta = TYPE_META[type];
  const ref = useRef<HTMLDivElement | null>(null);
  const dwell = useRef<number | null>(null);
  const marked = useRef(false);

  // auto-mark-as-read when card sits in view for ~800ms
  useEffect(() => {
    if (isRead || !onView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            if (dwell.current === null) {
              dwell.current = window.setTimeout(() => {
                if (!marked.current) {
                  marked.current = true;
                  onView(id);
                }
              }, 800);
            }
          } else if (dwell.current !== null) {
            window.clearTimeout(dwell.current);
            dwell.current = null;
          }
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (dwell.current !== null) window.clearTimeout(dwell.current);
    };
  }, [id, isRead, onView]);

  return (
    <Card
      ref={ref}
      elevation={0}
      variant="outlined"
      sx={{
        borderLeft: 4,
        borderLeftColor: isRead ? "transparent" : `${meta.color}.main`,
        opacity: isRead ? 0.78 : 1,
        bgcolor: isRead ? "background.default" : "background.paper",
        transition: "all 180ms ease",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardActionArea
        onClick={() => onMarkRead?.(id)}
        disableRipple={isRead}
        component="div"
      >
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Chip
                size="small"
                color={meta.color}
                icon={meta.icon}
                label={meta.label}
                variant={isRead ? "outlined" : "filled"}
              />
              {!isRead && (
                <Chip size="small" color="warning" icon={<FiberNewIcon />} label="New" />
              )}
              {priorityScore !== undefined && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Score ${priorityScore.toFixed(0)}`}
                />
              )}
            </Stack>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: isRead ? 400 : 600, wordBreak: "break-word" }}
              >
                {message}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {formatRelative(timestamp)}
                <Box component="span" sx={{ mx: 1 }}>
                  ·
                </Box>
                <Box component="span" sx={{ fontFamily: "monospace" }}>
                  {id.slice(0, 8)}
                </Box>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
