import { z } from 'zod'

export const couponSearchSchema = z.object({
  cupom: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,32}$/)
    .optional()
    .catch(undefined),
})
