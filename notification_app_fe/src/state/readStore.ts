"use client";

import { Log } from "logging-middleware";

const KEY = "notifications.readIds.v1";

export function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return new Set(arr.filter((x): x is string => typeof x === "string"));
    }
  } catch (err) {
    void Log("frontend", "warn", "state", `loadReadIds: ${(err as Error).message}`);
  }
  return new Set();
}

export function saveReadIds(ids: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch (err) {
    void Log("frontend", "warn", "state", `saveReadIds: ${(err as Error).message}`);
  }
}
