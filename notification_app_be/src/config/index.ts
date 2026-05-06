import "dotenv/config";

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  evalBaseUrl: required(
    "EVAL_BASE_URL",
    process.env.EVAL_BASE_URL ?? "http://20.207.122.201/evaluation-service"
  ),
  accessCode: required("ACCESS_CODE", process.env.ACCESS_CODE),
  email: optional(process.env.EMAIL),
  name: optional(process.env.NAME),
  mobileNo: optional(process.env.MOBILE_NO),
  githubUsername: optional(process.env.GITHUB_USERNAME),
  rollNo: optional(process.env.ROLL_NO),
  clientId: optional(process.env.CLIENT_ID),
  clientSecret: optional(process.env.CLIENT_SECRET),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
