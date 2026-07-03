import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const clerkAuthFile = path.join(__dirname, "../playwright/.clerk/user.json");

const requiredEnvVars = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "E2E_CLERK_USER_USERNAME",
  "E2E_CLERK_USER_PASSWORD",
] as const;

export function getMissingClerkAuthEnvVars(): string[] {
  return requiredEnvVars.filter((name) => !process.env[name]);
}

export function assertClerkAuthEnv(): void {
  const missing = getMissingClerkAuthEnvVars();
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    [
      "Authenticated E2E tests require GitHub Actions repository secrets:",
      ...missing.map((name) => `  - ${name}`),
      "",
      "Add them at: Settings → Secrets and variables → Actions → Repository secrets",
      "(CLERK_* values must match the Clerk app on the deployment under test.)",
    ].join("\n"),
  );
}
