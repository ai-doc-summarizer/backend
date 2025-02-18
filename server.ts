import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pdfParse from "pdf-parse";
import { processInBatches } from "./src/utils/utils";
import { fetchSummaryWithRetry } from "./src/services/openai";
import { slidingWindowChunkingStrategy } from "./src/strategies/slidingWindowChunkingStrategy";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Express = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/text-summarize", async (req: Request, res: Response) => {
    try {
        const { text, length } = req.body;

        if (!text) res.status(400).json({ error: "Text required "});

        const chunks = slidingWindowChunkingStrategy(text);

        const responses = await processInBatches(chunks, 5, length);

        const fullSummary = responses.map(r => r.summary).filter(Boolean).join("\n");
        const summaryOfSummaries = await fetchSummaryWithRetry(fullSummary, length);

        res.status(200).json({
            summary: summaryOfSummaries.summary,
            key_points: summaryOfSummaries.key_points
        });
    } catch (error) {
        res.status(500).json({
            error: (error instanceof Error) ? error.message : "Error while summarazing" 
        });
    }
});

app.post("/doc-summarize", upload.single("file"), async (req: Request, res: Response) => {
    try {
        const length = req.body.length || "medium";
        const file = req.file;
        if (!file){
            res.status(400).json({ error: "There is no file "});
            return;
        } 

        const pdfBuffer = file?.buffer || null;

        if (!pdfBuffer) {
            res.status(400).json({ error: "Buffer not found, check multer storage type" });
            return;
        }

        const data = await pdfParse(pdfBuffer!!);
        const text = data.text;

        const chunks = slidingWindowChunkingStrategy(text);

        const responses = await processInBatches(chunks, 5, length);

        const fullSummary = responses.map(r => r.summary).filter(Boolean).join("\n");

        const summaryOfSummaries = await fetchSummaryWithRetry(fullSummary, length);

        res.status(200).json({
            summary: summaryOfSummaries.summary,
            key_points: summaryOfSummaries.key_points
        });

    } catch (error) {
        res.status(500).json({
            error: (error instanceof Error) ? error.message : "Error while summarizing"
        });
    }
})

app.listen(PORT, () => console.log(`Server ruinning on ${PORT}`));