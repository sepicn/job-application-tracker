import { z } from "zod"

//  Mongoose casts any 24-character hex string, but throws a CastError on
//  anything else. Validating up front turns that crash into a clean message.
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id")

//  Only http(s) may reach an href. Without this, a stored `javascript:` or
//  `data:` URL becomes script execution for whoever clicks the card link.
const safeUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long")
  .refine((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === "http:" || protocol === "https:"
    } catch {
      return false
    }
  }, "Job URL must be a valid http(s) URL")

//  Empty strings arrive from untouched form inputs; treat them as absent
//  rather than validating them as URLs.
const optionalSafeUrl = z
  .union([z.literal(""), safeUrl])
  .optional()
  .transform((value) => (value === "" ? undefined : value))

const optionalText = (max: number) => z.string().trim().max(max).optional()

const tags = z
  .array(z.string().trim().min(1).max(30))
  .max(20, "At most 20 tags")
  .optional()

export const createJobApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  position: z.string().trim().min(1, "Position is required").max(200),
  location: optionalText(200),
  notes: optionalText(10_000),
  salary: optionalText(100),
  jobUrl: optionalSafeUrl,
  columnId: objectId,
  boardId: objectId,
  tags,
  description: optionalText(5_000),
})

export const updateJobApplicationSchema = z.object({
  company: z.string().trim().min(1).max(200).optional(),
  position: z.string().trim().min(1).max(200).optional(),
  location: optionalText(200),
  notes: optionalText(10_000),
  salary: optionalText(100),
  jobUrl: optionalSafeUrl,
  columnId: objectId.optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  tags,
  description: optionalText(5_000),
})

export const objectIdSchema = objectId

export type CreateJobApplicationInput = z.input<
  typeof createJobApplicationSchema
>
export type UpdateJobApplicationInput = z.input<
  typeof updateJobApplicationSchema
>

//  Collapses zod's issue list into one message suitable for the existing
//  `{ error }` return shape the actions already use.
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) =>
      issue.path.length
        ? `${issue.path.join(".")}: ${issue.message}`
        : issue.message,
    )
    .join(", ")
}
