import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Client, PortfolioCompany, MatchResult } from "../types";

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini with Google Search Grounding to find portfolio companies for a given VC fund.
 */
export const fetchPortfolioForFund = async (fundName: string): Promise<PortfolioCompany[]> => {
  try {
    const model = "gemini-2.5-flash";
    
    // We ask Gemini to search and then structure the data.
    const prompt = `
      Find the comprehensive list of portfolio companies for the Venture Capital fund "${fundName}".
      Use Google Search to find their official portfolio page, Crunchbase listing, or reputable news sources.
      List ALL active portfolio companies you can find.
      Try to capture the full list.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a research assistant. You must output the list of companies in a valid JSON array format at the end of your response. 
        Example format: [{"name": "Company A", "description": "Short description"}, {"name": "Company B"}]
        Do not use markdown code blocks like \`\`\`json. Just the raw JSON array string.`
      },
    });

    const text = response.text || "";
    
    // Attempt to extract JSON from the response text
    const jsonMatch = text.match(/\[.*\]/s);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any) => ({
        name: item.name || "Unknown",
        description: item.description,
        url: item.url
      }));
    }

    // Fallback if JSON parsing fails
    const lines = text.split('\n').filter(line => line.trim().length > 0 && !line.includes('[') && !line.includes(']'));
    return lines.slice(0, 30).map(l => ({ name: l.replace(/^- /, '').trim() }));

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};

/**
 * Uses Gemini to match client list against a specific fund's portfolio.
 * Reverted to a balanced prompt to avoid over-matching.
 */
export const findMatches = async (
  fundName: string,
  clients: Client[],
  portfolio: PortfolioCompany[]
): Promise<MatchResult[]> => {
  if (clients.length === 0 || portfolio.length === 0) return [];

  const clientNames = clients.map(c => c.name).join(", ");
  const portfolioNames = portfolio.map(p => p.name).join(", ");

  const prompt = `
    I have a list of my Clients and a list of Portfolio Companies for the fund "${fundName}".
    
    My Clients: [${clientNames}]
    
    Portfolio Companies: [${portfolioNames}]
    
    Task: Identify which of my Clients are the same entity as a Portfolio Company.
    
    Instructions:
    1. Check for exact matches and obvious variations (e.g., "Monday" vs "monday.com", "Wiz" vs "Wiz Inc").
    2. Handle Hebrew/English translations (e.g., "רפאל" vs "Rafael").
    3. Do NOT force a match if the names are significantly different. Accuracy is more important than quantity.
    
    Return a JSON array of matches only.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING },
        portfolioCompany: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        reasoning: { type: Type.STRING }
      },
      required: ["clientName", "portfolioCompany", "confidence", "reasoning"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const matches = JSON.parse(response.text || "[]") as any[];
    
    // Add the fund name to the result
    return matches.map(m => ({
      ...m,
      fundName
    }));

  } catch (error) {
    console.error("Error matching lists:", error);
    return [];
  }
};