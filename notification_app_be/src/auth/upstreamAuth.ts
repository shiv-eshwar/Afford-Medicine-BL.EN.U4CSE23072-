import { Log } from "logging-middleware";
import { config } from "../config/index.js";
import {
  readCredentials,
  writeCredentials,
  type StoredCredentials,
} from "./credentialsStore.js";

interface RegisterResponse {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let inflight: Promise<string> | null = null;

async function callRegister(): Promise<StoredCredentials> {
  const missing: string[] = [];
  if (!config.email) missing.push("EMAIL");
  if (!config.name) missing.push("NAME");
  if (!config.mobileNo) missing.push("MOBILE_NO");
  if (!config.githubUsername) missing.push("GITHUB_USERNAME");
  if (!config.rollNo) missing.push("ROLL_NO");
  if (missing.length > 0) {
    throw new Error(
      `Cannot register without env vars: ${missing.join(", ")}. ` +
        `Either fill them in .env or set CLIENT_ID/CLIENT_SECRET if you've already registered.`
    );
  }

  await Log(
    "backend",
    "info",
    "auth",
    "no client credentials cached; calling upstream /register"
  );

  const res = await fetch(`${config.evalBaseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: config.email,
      name: config.name,
      mobileNo: config.mobileNo,
      githubUsername: config.githubUsername,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    await Log(
      "backend",
      "fatal",
      "auth",
      `register failed: ${res.status} ${body.slice(0, 200)}`
    );
    throw new Error(`Register failed (${res.status})`);
  }

  const body = (await res.json()) as RegisterResponse;
  const stored: StoredCredentials = {
    clientID: body.clientID,
    clientSecret: body.clientSecret,
    email: body.email,
    rollNo: body.rollNo,
    accessCode: body.accessCode,
    registeredAt: new Date().toISOString(),
  };
  await writeCredentials(stored);
  return stored;
}

async function resolveCredentials(): Promise<StoredCredentials> {
  if (config.clientId && config.clientSecret) {
    return {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      email: config.email,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
      registeredAt: new Date().toISOString(),
    };
  }
  const cached = await readCredentials();
  if (cached) return cached;
  return callRegister();
}

async function fetchAccessToken(): Promise<string> {
  const creds = await resolveCredentials();

  await Log(
    "backend",
    "info",
    "auth",
    "requesting fresh access token from upstream /auth"
  );

  const res = await fetch(`${config.evalBaseUrl}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: creds.email ?? config.email,
      name: config.name,
      rollNo: creds.rollNo ?? config.rollNo,
      accessCode: creds.accessCode ?? config.accessCode,
      clientID: creds.clientID,
      clientSecret: creds.clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    await Log(
      "backend",
      "fatal",
      "auth",
      `auth failed: ${res.status} ${body.slice(0, 200)}`
    );
    throw new Error(`Auth failed (${res.status})`);
  }

  const body = (await res.json()) as AuthResponse;
  const skewMs = 30_000;
  const expiresAt = Date.now() + Math.max(0, body.expires_in * 1000 - skewMs);
  cachedToken = { token: body.access_token, expiresAt };
  await Log(
    "backend",
    "info",
    "auth",
    `obtained access token; valid for ~${Math.round(
      (expiresAt - Date.now()) / 1000
    )}s`
  );
  return body.access_token;
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  if (inflight) return inflight;
  inflight = fetchAccessToken().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function invalidateToken(): void {
  cachedToken = null;
}
