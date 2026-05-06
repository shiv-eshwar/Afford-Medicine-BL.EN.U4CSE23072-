"use client";

import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { NOTIFICATION_TYPES, type NotificationType } from "@/config";

interface Props {
  type: NotificationType | "all";
  onChange: (next: NotificationType | "all") => void;
  rightSlot?: React.ReactNode;
}

export function FilterBar({ type, onChange, rightSlot }: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5 }}
        >
          Filter by type
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type}
          onChange={(_, v: NotificationType | "all" | null) => {
            if (v !== null) onChange(v);
          }}
          aria-label="notification type filter"
          fullWidth={isXs}
        >
          <ToggleButton value="all">All</ToggleButton>
          {NOTIFICATION_TYPES.map((t) => (
            <ToggleButton key={t} value={t}>
              {t}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {rightSlot}
    </Stack>
  );
}
