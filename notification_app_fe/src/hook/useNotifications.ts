"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Log } from "logging-middleware";
import {
  fetchNotifications,
  fetchPriority,
  type ListQuery,
  type ListResult,
  type PriorityResult,
} from "@/api/notifications.client";
import type { NotificationType } from "@/config";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useNotificationsList(query: ListQuery) {
  const [state, setState] = useState<AsyncState<ListResult>>({
    data: null,
    loading: true,
    error: null,
  });
  // ignore stale responses if user changes filters quickly
  const reqId = useRef(0);
  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchNotifications(query);
      if (my !== reqId.current) return;
      setState({ data, loading: false, error: null });
      void Log("frontend", "debug", "hook", `loaded ${data.data.length} notifications`);
    } catch (err) {
      if (my !== reqId.current) return;
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load();
  }, [load]);

  return { state, refresh: () => void load() };
}

export function usePriorityNotifications(n: number, notificationType?: NotificationType) {
  const [state, setState] = useState<AsyncState<PriorityResult>>({
    data: null,
    loading: true,
    error: null,
  });
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchPriority(n, notificationType);
      if (my !== reqId.current) return;
      setState({ data, loading: false, error: null });
      void Log(
        "frontend",
        "debug",
        "hook",
        `loaded ${data.data.length} priority items (n=${n})`
      );
    } catch (err) {
      if (my !== reqId.current) return;
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [n, notificationType]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, refresh: () => void load() };
}
