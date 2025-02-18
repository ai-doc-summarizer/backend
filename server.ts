import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pdfParse from "pdf-parse";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app: Express = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI();
const upload = multer({ storage: multer.memoryStorage() });

const SummarySchema = z.object({
    summary: z.string(),
    key_points: z.array(z.string()),
});

app.post("/text-summarize", async (req: Request, res: Response) => {
    try {
        const { text, length } = req.body;

        if (!text) res.status(400).json({ error: "Text required "});

        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: `Summarize with key points with ${length} length.` },
                { role: "user", content: text },
            ],
            response_format: zodResponseFormat(SummarySchema, "summary_output"),
        });

        const summary = completion.choices[0].message.parsed;
        
        res.status(200).json(summary);
    } catch ( error ) {
        res.status(500).json({
            error: (error instanceof Error) ? error.message : "Error while summarazing" 
        });
    }
});

app.post("/doc-summarize", upload.single("file"), async (req: Request, res: Response) => {
    try {
        const { length } = req.body.length || "medium";
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

        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: `Summarize with key points with ${length} length.` },
                { role: "user", content: text },
            ],
            response_format: zodResponseFormat(SummarySchema, "summary_output"),
        });

        const summary = completion.choices[0].message.parsed;
        
        res.status(200).json(summary);

    } catch (error) {
        res.status(500).json({
            error: (error instanceof Error) ? error.message : "Error while summarizing"
        });
    }
})

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));



