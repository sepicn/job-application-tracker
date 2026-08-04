import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { initializeUserBoard } from "../init-user-board"
import { env } from "../env"

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
