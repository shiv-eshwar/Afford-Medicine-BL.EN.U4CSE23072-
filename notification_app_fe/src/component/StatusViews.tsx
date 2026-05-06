"use client";

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={1.5} aria-label="loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Card variant="outlined" key={i} sx={{ p: 2 }}>
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </Card>
      ))}
    </Stack>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button onClick={onRetry} color="inherit" size="small">
            Retry
          </Button>
        ) : undefined
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>Could not load notifications</AlertTitle>
      {message}
    </Alert>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
      <Box>
        <InboxIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography variant="h6" sx={{ mt: 1 }}>
          {title}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Card>
  );
}
