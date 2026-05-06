import { promises as fs } from "node:fs";
import path from "node:path";
import { Log } from "logging-middleware";

const CRED_FILE = path.resolve(process.cwd(), ".credentials.json");

export interface StoredCredentials {
  clientID: string;
  clientSecret: string;
  email?: string;
  rollNo?: string;
  accessCode?: string;
  registeredAt: string;
}

export async function readCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await fs.readFile(CRED_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredCredentials;
    if (
      typeof parsed?.clientID === "string" &&
      typeof parsed?.clientSecret === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function writeCredentials(
  c: StoredCredentials
): Promise<void> {
  try {
    await fs.writeFile(CRED_FILE, JSON.stringify(c, null, 2), "utf8");
    await Log(
      "backend",
      "info",
      "auth",
      "persisted upstream client credentials to local cache"
    );
  } catch (err) {
    await Log(
      "backend",
      "error",
      "auth",
      `failed to persist credentials: ${(err as Error).message}`
    );
  }
}
