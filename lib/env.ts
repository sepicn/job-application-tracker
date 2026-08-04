import { z } from "zod"

// Parsed at import time so a bad deployment fails here, not on the first query.
// A blank variable means unconfigured, so it must reach the schema as undefined.
const blankAsMissing = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema)

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
  // Read by the browser via auth-client, checked here so it fails at startup.
  NEXT_PUBLIC_BETTER_AUTH_URL: z.url(
    "NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL",
  ),
  // Absent means every mail-dependent flow stays off. Any SMTP provider
  // works; Gmail wants an app password, not the account password.
  SMTP_HOST: blankAsMissing(z.string().min(1).optional()),
  SMTP_PORT: blankAsMissing(
    z.coerce.number().int().min(1).max(65535).default(465),
  ),
  SMTP_USER: blankAsMissing(z.string().min(1).optional()),
  SMTP_PASSWORD: blankAsMissing(z.string().min(1).optional()),
  EMAIL_FROM: blankAsMissing(z.string().min(1).optional()),
  GOOGLE_CLIENT_ID: blankAsMissing(z.string().min(1).optional()),
  GOOGLE_CLIENT_SECRET: blankAsMissing(z.string().min(1).optional()),
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

export const isGoogleAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
)

export const isEmailEnabled = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.EMAIL_FROM,
)
