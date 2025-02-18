import { fetchSummaryWithRetry } from "../services/openai";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processInBatches = async (chunks: string[], batchSize: number, length: string) => {
    let results: { summary: string, key_points: string[] }[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
        const batch = chunks.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(chunk => fetchSummaryWithRetry(chunk, length))
        );

        results = results.concat(batchResults);
    }

    return results;
};