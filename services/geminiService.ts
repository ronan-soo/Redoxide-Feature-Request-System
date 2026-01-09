import { GoogleGenAI, Type } from "@google/genai";

export const polishFeatureRequest = async (
  title: string,
  description: string
): Promise<{ title: string; description: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a product manager assistant. Rewrite the following feature request to be clear, concise, and professional.
      Maintain the original intent but improve grammar and clarity.
      
      Input Title: ${title}
      Input Description: ${description}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "description"],
        },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    const json = JSON.parse(text);
    
    return {
      title: json.title || title,
      description: json.description || description
    };
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    throw new Error("Failed to polish content.");
  }
};