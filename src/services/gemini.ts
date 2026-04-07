import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";

// Use VITE_ prefix for Vercel/Vite environment variables, fallback to process.env for local/AI Studio
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function getQuizAnalysis(answers: any, lang: string = 'English', difficulty: string = 'Easy') {
  const prompt = `Analyze these career quiz answers for an Indian student and provide a JSON response with:
  1. bestStream: (Science/Commerce/Arts)
  2. matchPercentage: (number)
  3. suggestedCareers: (array of strings)
  4. reasoning: (detailed explanation)
  
  Difficulty Level: ${difficulty}
  
  IMPORTANT: Provide the response in ${lang} language.
  
  Answers: ${JSON.stringify(answers)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}

export async function getFastResponse(prompt: string, lang: string = 'English') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ parts: [{ text: `Respond in ${lang}: ${prompt}` }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Fast Response Error:", error);
    return "Quick error! Try again.";
  }
}

export async function getComplexResponse(prompt: string, lang: string = 'English') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `Respond in ${lang}: ${prompt}` }] }],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Complex Response Error:", error);
    return "Thinking too hard... error.";
  }
}

export async function getTextToSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

export async function* getChatResponseStream(
  message: string, 
  history: any[] = [], 
  systemInstruction?: string, 
  lang: string = 'English',
  complexity: 'fast' | 'general' | 'complex' = 'general'
) {
  const modelMap = {
    fast: "gemini-3.1-flash-lite-preview",
    general: "gemini-3-flash-preview",
    complex: "gemini-3.1-pro-preview"
  };

  const formattedHistory = history.map(m => ({
    role: m.role === 'ai' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text || m.content || "" }]
  }));

  const chat = ai.chats.create({
    model: modelMap[complexity],
    history: formattedHistory,
    config: {
      systemInstruction: systemInstruction || `You are CareerQuest AI, a helpful career counselor for Indian students. 
      IMPORTANT: Always respond in ${lang} language.
      Keep responses concise, encouraging, and gamified.`,
      tools: [{ googleSearch: {} }],
      ...(complexity === 'complex' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {})
    },
  });

  try {
    const response = await chat.sendMessageStream({ message });
    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("AI Chat Error:", error);
    yield "I'm having trouble connecting to my brain right now. Try again later!";
  }
}
