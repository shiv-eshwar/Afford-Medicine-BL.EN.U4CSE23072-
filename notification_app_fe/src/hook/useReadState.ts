"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Log } from "logging-middleware";
import { markManyRead, markRead } from "@/api/notifications.client";
import { loadReadIds, saveReadIds } from "@/state/readStore";

export function useReadState() {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    setReadIds(loadReadIds());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveReadIds(readIds);
  }, [readIds]);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markAsRead = useCallback(async (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      await markRead(id);
    } catch (err) {
      void Log(
        "frontend",
        "warn",
        "hook",
        `markRead failed, kept local: ${(err as Error).message}`
      );
    }
  }, []);

  const markAllAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    try {
      await markManyRead(ids);
    } catch (err) {
      void Log(
        "frontend",
        "warn",
        "hook",
        `markManyRead failed, kept local: ${(err as Error).message}`
      );
    }
  }, []);

  return { readIds, isRead, markAsRead, markAllAsRead };
}
