import { Log, setAuthToken } from "logging-middleware";
import { config } from "../config/index.js";
import { readCreds, writeCreds, type StoredCreds } from "./credentialsStore.js";

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

let cachedToken: string | null = null;
let expiresAt = 0;
let inflight: Promise<string> | null = null;

async function register(): Promise<StoredCreds> {
  const missing: string[] = [];
  if (!config.email) missing.push("EMAIL");
  if (!config.name) missing.push("NAME");
  if (!config.mobileNo) missing.push("MOBILE_NO");
  if (!config.githubUsername) missing.push("GITHUB_USERNAME");
  if (!config.rollNo) missing.push("ROLL_NO");
  if (missing.length > 0) {
    throw new Error(
      `cannot register without: ${missing.join(", ")}. ` +
        `set them in .env or set CLIENT_ID/CLIENT_SECRET if already registered.`
    );
  }

  await Log("backend", "info", "auth", "no creds cached, calling /register");

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
    await Log("backend", "fatal", "auth", `register ${res.status}: ${body.slice(0, 200)}`);
    throw new Error(`register failed (${res.status})`);
  }

  const body = (await res.json()) as RegisterResponse;
  const stored: StoredCreds = {
    clientID: body.clientID,
    clientSecret: body.clientSecret,
    email: body.email,
    rollNo: body.rollNo,
    accessCode: body.accessCode,
    registeredAt: new Date().toISOString(),
  };
  await writeCreds(stored);
  return stored;
}

async function getCreds(): Promise<StoredCreds> {
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
  const cached = await readCreds();
  if (cached) return cached;
  return register();
}

async function fetchToken(): Promise<string> {
  const creds = await getCreds();
  await Log("backend", "info", "auth", "requesting access token from /auth");

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
    await Log("backend", "fatal", "auth", `auth ${res.status}: ${body.slice(0, 200)}`);
    throw new Error(`auth failed (${res.status})`);
  }

  const body = (await res.json()) as AuthResponse;
  cachedToken = body.access_token;
  expiresAt = Date.now() + Math.max(0, body.expires_in * 1000 - 30_000); // 30s skew
  setAuthToken(cachedToken);
  await Log("backend", "info", "auth", "got new access token");
  return cachedToken;
}

export async function getAccessToken(force = false): Promise<string> {
  if (!force && cachedToken && Date.now() < expiresAt) return cachedToken;
  if (inflight) return inflight;
  inflight = fetchToken().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function invalidateToken(): void {
  cachedToken = null;
  expiresAt = 0;
}
