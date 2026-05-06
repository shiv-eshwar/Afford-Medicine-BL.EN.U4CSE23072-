import "dotenv/config";

function need(name: string, val: string | undefined): string {
  if (!val || val.trim() === "") {
    throw new Error(`missing env: ${name}`);
  }
  return val;
}

function opt(val: string | undefined): string | undefined {
  if (!val || val.trim() === "") return undefined;
  return val;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  evalBaseUrl: need(
    "EVAL_BASE_URL",
    process.env.EVAL_BASE_URL ?? "http://20.207.122.201/evaluation-service"
  ),
  accessCode: need("ACCESS_CODE", process.env.ACCESS_CODE),
  email: opt(process.env.EMAIL),
  name: opt(process.env.NAME),
  mobileNo: opt(process.env.MOBILE_NO),
  githubUsername: opt(process.env.GITHUB_USERNAME),
  rollNo: opt(process.env.ROLL_NO),
  clientId: opt(process.env.CLIENT_ID),
  clientSecret: opt(process.env.CLIENT_SECRET),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
