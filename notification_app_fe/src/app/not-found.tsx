"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        404
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The page you were looking for does not exist.
      </Typography>
      <Button component={Link} href="/" variant="contained">
        Back to inbox
      </Button>
    </Box>
  );
}
