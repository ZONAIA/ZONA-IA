
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MODELS, SYSTEM_PROMPT } from "../constants";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY no configurada en el entorno.");
  return new GoogleGenAI({ apiKey });
};

export const chatWithGemini = async (message: string, history: any[] = []) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: MODELS.PRO,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }]
    }
  });

  const result = await chat.sendMessage({ message });
  return result;
};

export const generateTechnicalImage = async (prompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: {
      parts: [
        { text: `Genera una imagen industrial profesional de: ${prompt}. Estilo fotorealista, limpio, calidad 1K.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });
  
  let imageUrl = null;
  let textResponse = "";

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    } else if (part.text) {
      textResponse += part.text;
    }
  }

  return { imageUrl, text: textResponse };
};

export const complexReasoning = async (prompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      thinkingConfig: { thinkingBudget: 16384 }
    }
  });
  return response;
};

export const analyzeIndustrialImage = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analiza este componente industrial. Formato: Identificación, Descripción, Fallos, Recomendaciones. Usa muchos emojis." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT
    }
  });
  return response;
};

export const findNearbyDistributors = async (query: string, location: { lat: number; lng: number }) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODELS.MAPS,
    contents: `${query} cerca de mi ubicación`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      }
    }
  });
  return response;
};

export const generateTechnicalSpeech = async (text: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODELS.TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
