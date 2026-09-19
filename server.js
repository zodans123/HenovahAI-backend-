import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "HenovahAI",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    const history =
      Array.isArray(req.body?.history)
        ? req.body.history
        : [];

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    /*
      Convert the saved HenovahAI conversation
      into context that Gemini can understand.
    */

    const conversationContext = history
      .slice(-20)
      .map((item: any) => {
        const userMessage =
          typeof item?.message === "string"
            ? item.message.trim()
            : "";

        if (!userMessage) {
          return "";
        }

        return `User: ${userMessage}`;
      })
      .filter(Boolean)
      .join("\n");

    const prompt = `
You are HenovahAI, a helpful, friendly, intelligent AI assistant.

Use the conversation context below to understand what the user has already told you.

Conversation context:
${conversationContext || "No previous conversation context."}

The user's latest message is:
${message}

Answer the latest message naturally and directly.
If the user refers to something they said earlier in this conversation, use the conversation context when appropriate.
Do not mention the technical conversation context or explain how it was provided.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt
    });

    const text =
      response.text ||
      "I couldn't generate a response.";

    res.json({
      success: true,
      response: text,
      reply: text,
      text: text
    });

  } catch (error) {
    console.error(
      "Gemini request failed:",
      error
    );

    res.status(500).json({
      error:
        "HenovahAI could not generate a response."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `HenovahAI backend running on port ${PORT}`
  );
});
