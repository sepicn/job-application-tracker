import { z } from "zod"

//  Mongoose casts any 24-character hex string, but throws a CastError on
//  anything else. Validating up front turns that crash into a clean message.
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id")

//  Collapses zod's issue list into one message suitable for the `{ error }`
//  return shape the server actions use.
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) =>
      issue.path.length
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join(", ")
}
