import { z } from "zod"
import { objectIdSchema } from "./common"

const columnName = z
  .string()
  .trim()
  .min(1, "Column name is required")
  .max(50, "Column name must be at most 50 characters")

export const createColumnSchema = z.object({
  boardId: objectIdSchema,
  name: columnName,
})

export const renameColumnSchema = z.object({
  id: objectIdSchema,
  name: columnName,
})

export type CreateColumnInput = z.input<typeof createColumnSchema>
export type RenameColumnInput = z.input<typeof renameColumnSchema>
