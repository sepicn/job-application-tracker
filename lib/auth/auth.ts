import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

// In dev, Next re-evaluates this module on every hot reload. Without caching,
// each reload opens a new connection pool and never closes the old one, which
// exhausts the Atlas connection limit after a few dozen saves.
declare global {
  var _mongoClient: MongoClient | undefined
}

const client =
  global._mongoClient ??
  new MongoClient(process.env.MONGODB_URI!, { maxPoolSize: 10 })

if (process.env.NODE_ENV !== "production") {
  global._mongoClient = client
}

const db = client.db()

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  emailAndPassword: {
    enabled: true,
  },
})

export async function getSession(){
  const result = await auth.api.getSession({
    headers: await headers()
  })

  return result
}

export async function signOut(){
  const result = await auth.api.signOut({
    headers: await headers()
  })


  if(result.success){
    redirect("/sign-in")
  } 
}