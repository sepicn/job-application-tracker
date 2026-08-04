import { z } from "zod"
import { objectIdSchema } from "./common"

const objectId = objectIdSchema

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

export type CreateJobApplicationInput = z.input<
  typeof createJobApplicationSchema
>
export type UpdateJobApplicationInput = z.input<
  typeof updateJobApplicationSchema
>

export { formatIssues, objectIdSchema } from "./common"
