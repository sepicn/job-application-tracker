import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { initializeUserBoard } from "../init-user-board"
import { env, isGoogleAuthEnabled } from "../env"

// In dev, Next re-evaluates this module on every hot reload. Without caching,
// each reload opens a new connection pool and never closes the old one, which
// exhausts the Atlas connection limit after a few dozen saves.
declare global {
  var _mongoClient: MongoClient | undefined
}

const client =
  global._mongoClient ?? new MongoClient(env.MONGODB_URI, { maxPoolSize: 10 })

if (process.env.NODE_ENV !== "production") {
  global._mongoClient = client
}

const db = client.db()

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  trustedOrigins: [env.BETTER_AUTH_URL],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Google verifies email ownership, so its claim is proof enough to link
      // a social identity onto an existing row.
      trustedProviders: ["google"],
      // Normally the local row must be emailVerified first. Nothing here
      // verifies emails, so linking would always be refused. The gate exists to
      // stop someone pre-registering an unverified account on a victim's
      // address and inheriting their Google identity; email verification is the
      // real fix, and this stays off until there is a mail provider.
      requireLocalEmailVerified: false,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      // No mail provider is configured, so confirmation cannot be sent. Users
      // are never verified here, which is the case this flag covers.
      updateEmailWithoutVerification: true,
    },
  },
  // Spread rather than an inline false: Better Auth reads the presence of the
  // key, so an unconfigured provider must be absent, not disabled.
  socialProviders: isGoogleAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  emailAndPassword: {
    enabled: true,
    // The form's minLength is advisory; this is the enforced one.
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: {
    // Better Auth enables this in production only by default.
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.id) {
            await initializeUserBoard(user.id)
          }
        },
      },
    },
  },
})

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  })

  return result
}

export async function signOut() {
  const result = await auth.api.signOut({
    headers: await headers(),
  })

  if (result.success) {
    redirect("/sign-in")
  }
}
