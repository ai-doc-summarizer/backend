import { MAX_TOKENS } from "../common/constants";

export function slidingWindowChunkingStrategy(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    const chunkSize = Math.min(MAX_TOKENS, Math.max(300, Math.floor(text.length / 5)));
    const overlap = Math.floor(chunkSize * 0.25);

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.substring(start, end);
        chunks.push(chunk);
        start += (chunkSize - overlap);
    }

    return chunks;
}
