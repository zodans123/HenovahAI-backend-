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

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: message
    });

    const text =
      response.text || "I couldn't generate a response.";

    res.json({
      success: true,
      response: text,
      reply: text,
      text: text
    });

  } catch (error) {
    console.error("Gemini request failed:", error);

    res.status(500).json({
      error: "HenovahAI could not generate a response."
    });
  }
});

app.listen(PORT, () => {
  console.log(`HenovahAI backend running on port ${PORT}`);
});
