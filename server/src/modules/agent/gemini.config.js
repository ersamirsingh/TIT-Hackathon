import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const embeddingModelName = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables. Agent features will fail.");
}

export const model = new ChatGoogleGenerativeAI({
  apiKey: apiKey || "DUMMY_KEY",
  model: modelName,
  temperature: 0.2,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: apiKey || "DUMMY_KEY",
  model: embeddingModelName,
});
