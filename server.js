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

    const contents = history
      .slice(-20)
      .map((item: any) => {
        const text =
          typeof item?.message === "string"
            ? item.message.trim()
            : "";

        if (!text) {
          return null;
        }

        const role =
          item?.role === "assistant"
            ? "model"
            : "user";

        return {
          role: role,
          parts: [
            {
              text: text
            }
          ]
        };
      })
      .filter(Boolean);

    if (!contents.length) {
      contents.push({
        role: "user",
        parts: [
          {
            text: message
          }
        ]
      });
    }

    const response =
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",

        config: {
          systemInstruction:
            "You are HenovahAI, a helpful AI assistant. " +
            "Use the conversation history to understand the current conversation. " +
            "When the user has already stated a fact or personal preference in the conversation, " +
            "treat that statement as information provided by the user and use it directly when answering follow-up questions. " +
            "Do not describe a fact from the conversation as a guess. " +
            "For example, if the user says their favorite color is blue and later asks what their favorite color is, " +
            "answer that their favorite color is blue. " +
            "Answer naturally and directly."
        },

        contents: contents as any
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
