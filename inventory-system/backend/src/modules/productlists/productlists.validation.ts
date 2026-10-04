import { z } from "zod";

export const listItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(120)
    .transform((v) => v.toUpperCase()),
});
