import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { initializeUserBoard } from "../init-user-board"
import { env, isEmailEnabled, isGoogleAuthEnabled } from "../env"
import {
  sendEmailChangeConfirmation,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../email"

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
      // Google proves email ownership, so its claim is enough to link on.
      trustedProviders: ["google"],
      // Stops someone pre-registering on a victim's address and inheriting
      // their Google identity. Only enforceable once sign-ups get verified.
      requireLocalEmailVerified: isEmailEnabled,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: !isEmailEnabled,
      sendChangeEmailConfirmation: isEmailEnabled
        ? async ({ newEmail, url }) => {
            await sendEmailChangeConfirmation(newEmail, url)
          }
        : undefined,
    },
  },
  // Better Auth reads the key's presence, so an unused provider must be
  // absent rather than disabled.
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
    requireEmailVerification: isEmailEnabled,
    sendResetPassword: isEmailEnabled
      ? async ({ user, url }) => {
          await sendPasswordResetEmail(user.email, url)
        }
      : undefined,
  },
  emailVerification: {
    sendVerificationEmail: isEmailEnabled
      ? async ({ user, url }) => {
          await sendVerificationEmail(user.email, url)
        }
      : undefined,
    sendOnSignUp: isEmailEnabled,
    autoSignInAfterVerification: true,
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
