# Backend for ai-doc-summarizer


## Setup instructions
First of all, the ai-doc-summarizer Frontend needs this Backend to be running. To achieve that, follow this steps:

1. Download and install Node.js:
https://nodejs.org/es/download
1. Clone this repo: 
    ```bash
    git clone https://github.com/ai-doc-summarizer/backend
    ```
2. Install Node Dependencies:
    ```bash
    npm run install
    ```
2. Run server:
    ```bash
    npm run start
    ```
## Documentation
### Endpoints
We have 2 endpoints.
1. /text-summarize: POST Method used for summarizing text. Text and Length ("Short", "Medium" and "Long") in the Body. It will returns summary and key_points
2. /doc-summarize: POST Method used for summarizing PDFs.

Feel free to try them on Postman: https://www.postman.com/

### Technical choices
#### Node.js, Express.js and TypeScript

First of all, I decided going with Node.js due to OpenAI´s official Node.js library. Also, for what I understood in the first interview with Jorge, is part of your tech stack. In addition, I decided to use Express.js for it´s lightweigth nature, which makes API development more efficient.

Lastly, I chose TypeScript to make the code easier for you to understand and to minimize errors on my end, thanks to its strongly typed nature.

#### Multer and Processing Files in the server.
I chose Multer to process document in the Backend, allowing direct access to uploaded files, improving performance by storing them on Memory. Since we only handle one document at a time, cost of Memory would not be such a problem in this case.

I wanted to process files in the Backend instead of the Frontend, so the Server has to deal with all the stress of long documents and is more scalable.

#### Sliding Window Technique + Summary of Summaries.
I used this technique to create overlapping chunks. So I can provide some context between chunks. Once I have the chunks, I summarize all in batches of 5 using gpt-4o. Once I have all the summaries, I make a summary of summaries merging the summaries in order to have a more cohesive summary.

Chunking strategy:
By try an error, I found that the maximun chunk I could handle was 5000. Having this in mind, I devided the text in 5 parts. So that, we can decide chunksize depending of the size of the document.


#### Batching with retry.
Processing chunks secuently was not performant. So I decided to process the chunks in parallel. First time I tried I reached my rate limit (30000 TPM), so I decided to batch in groups of 5 and retry using the time openAI allowed me. The maximum token I could make gpt-4o to handle was 5000 and my rate limit was 30000 TPM, that´s why I process the chunks in batches of 5.

const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
        { 
            role: "system", 
            content: `Provide a clear and concise summary highlighting the key points of the given text. 
                      Ensure the summary is well-structured, preserves the original meaning, and fits within ${length} characters. 
                      Use bullet points if appropriate and avoid unnecessary details.` 
        },
        { role: "user", content: chunk },
    ],
    response_format: zodResponseFormat(SummarySchema, "summary_output"),
});
