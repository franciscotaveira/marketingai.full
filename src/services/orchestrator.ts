import { MARKETING_SKILLS } from "../constants";
import { sendMessageToAgent } from "./chatService";
import { googleSearch } from "./mcp/googleSearch";
import { getAnalyticsData } from "./mcp/googleAnalytics";
import { getMetaAdsPerformance } from "./mcp/metaAds";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface OrchestrationResult {
  agentId: string;
  response: string;
}

export async function orchestrateRequest(
  userMessage: string,
  selectedAgentId: string | null,
  isSwarmMode: boolean,
  model: string,
  systemInstruction: string,
  useGrounding: boolean,
  onAgentStatus: (id: string, status: 'idle' | 'thinking' | 'using_tool', tool?: string) => void
): Promise<OrchestrationResult> {
  
  let targetAgentId = selectedAgentId || "orchestrator";
  
  // 1. Modo Swarm: Decomposição e Delegação
  if (isSwarmMode) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise a mensagem e identifique quais agentes de marketing devem colaborar.
      Agentes disponíveis: ${MARKETING_SKILLS.map(s => `${s.id}: ${s.description}`).join(", ")}.
      Retorne APENAS uma lista de IDs dos agentes separados por vírgula.
      Mensagem: ${userMessage}`,
    });
    
    const agentIds = response.text?.trim().split(",").map(id => id.trim()) || [];
    
    // Chamar agentes em paralelo
    const agentResponses = await Promise.all(
      agentIds.map(async (id) => {
        const skill = MARKETING_SKILLS.find(s => s.id === id);
        if (!skill) return null;
        onAgentStatus(id, 'thinking');
        const resp = await sendMessageToAgent(id, userMessage, skill.model || model, systemInstruction);
        onAgentStatus(id, 'idle');
        return { id, resp };
      })
    );

    // Sintetizar respostas
    const synthesis = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sintetize as respostas dos agentes abaixo em uma resposta final coesa para o usuário.
      ${agentResponses.filter(Boolean).map(r => `Agente ${r?.id}: ${r?.resp}`).join("\n\n")}`,
    });

    return {
      agentId: "swarm_orchestrator",
      response: synthesis.text || "Erro na síntese do swarm."
    };
  }

  // 2. Modo Individual
  const skill = MARKETING_SKILLS.find(s => s.id === targetAgentId) || MARKETING_SKILLS[0];
  
  let finalResponse = "";

  if (useGrounding) {
    const searchResult = await googleSearch(userMessage);
    finalResponse = `Pesquisa realizada:\n${searchResult.text}\n\nFontes: ${searchResult.sources.join(", ")}`;
  } else {
    finalResponse = await sendMessageToAgent(
      targetAgentId,
      userMessage,
      skill?.model || model,
      systemInstruction
    );
  }

  return {
    agentId: targetAgentId,
    response: finalResponse
  };
}
