import { z } from "zod";

export const SummarySchema = z.object({
    summary: z.string(),
    key_points: z.array(z.string()),
});
