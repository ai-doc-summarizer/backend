import { zodResponseFormat } from "openai/helpers/zod";
import { delay } from "../utils/utils";
import { SummarySchema } from "../common/schemas";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI();

export async function fetchSummaryWithRetry(chunk: string, length: string, retries: number = 3): Promise<{ summary: string, key_points: string[] }> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const completion = await openai.beta.chat.completions.parse({
                model: "gpt-4o-2024-08-06",
                messages: [
                    { role: "system", content: `Summarize with key points with ${length} length.` },
                    { role: "user", content: chunk },
                ],
                response_format: zodResponseFormat(SummarySchema, "summary_output"),
            });

            return completion.choices[0].message.parsed!!;
        } catch (error: any) {
            if (error.code === "rate_limit_exceeded" && error.headers?.["retry-after-ms"]) {
                const waitTime = parseInt(error.headers["retry-after-ms"], 10) || 2000;
                console.warn(`Rate limit reached. Waiting ${waitTime}ms defore retry...`);
                await delay(waitTime);
            } else {
                console.error("Error while summarizing chunk:", error);
                return { summary: "", key_points: [] };
            }
        }
    }
    return { summary: "", key_points: [] };
}