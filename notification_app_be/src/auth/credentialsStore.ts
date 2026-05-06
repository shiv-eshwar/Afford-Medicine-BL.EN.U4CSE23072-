import { promises as fs } from "node:fs";
import path from "node:path";
import { Log } from "logging-middleware";

const FILE = path.resolve(process.cwd(), ".credentials.json");

export interface StoredCreds {
  clientID: string;
  clientSecret: string;
  email?: string;
  rollNo?: string;
  accessCode?: string;
  registeredAt: string;
}

export async function readCreds(): Promise<StoredCreds | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredCreds;
    if (parsed?.clientID && parsed?.clientSecret) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function writeCreds(c: StoredCreds): Promise<void> {
  try {
    await fs.writeFile(FILE, JSON.stringify(c, null, 2), "utf8");
    await Log("backend", "info", "auth", "saved client credentials to local file");
  } catch (err) {
    await Log(
      "backend",
      "error",
      "auth",
      `could not save credentials: ${(err as Error).message}`
    );
  }
}
