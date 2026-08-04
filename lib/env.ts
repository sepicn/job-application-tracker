import { z } from "zod"

//  Parsed once at import time so a misconfigured deployment fails immediately
//  with a readable message, instead of throwing an obscure driver error on the
//  first database query.
const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) =>
        value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL must be a valid URL"),
  //  Read by the browser through lib/auth/auth-client.ts. Validated here so a
  //  missing value fails at startup rather than on the first sign-in attempt.
  NEXT_PUBLIC_BETTER_AUTH_URL: z.url(
    "NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL",
  ),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")

  throw new Error(`Invalid environment variables:\n${issues}`)
}

export const env = parsed.data
