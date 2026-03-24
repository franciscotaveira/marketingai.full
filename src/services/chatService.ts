import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function sendMessageToAgent(
  agentId: string, 
  message: string, 
  model: string,
  systemInstruction?: string,
  tools?: any[]
) {
  // If model is Gemini, use SDK
  if (model.startsWith("gemini")) {
    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction,
        tools,
      },
    });
    return response.text || "Sem resposta.";
  }

  // Otherwise, call backend proxy
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agentId, message, systemInstruction, tools }),
  });

  if (!response.ok) {
    throw new Error(`Chat error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}
