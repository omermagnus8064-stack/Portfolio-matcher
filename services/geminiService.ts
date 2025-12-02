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
    // Updated prompt to be more exhaustive and less focused only on "recent" to catch older investments like IVIC.
    const prompt = `
      Find the comprehensive list of portfolio companies for the Venture Capital fund "${fundName}".
      Use Google Search to find their official portfolio page, Crunchbase listing, or reputable news sources.
      List ALL active portfolio companies you can find, not just the most recent ones.
      Try to capture the full list.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // We do not use JSON schema here because it conflicts with Search Tool sometimes in specific payload combinations.
        // Instead we ask for a structured text or simple JSON in the text and parse it.
        systemInstruction: `You are a research assistant. You must output the list of companies in a valid JSON array format at the end of your response. 
        Example format: [{"name": "Company A", "description": "Short description"}, {"name": "Company B"}]
        Do not use markdown code blocks like \`\`\`json. Just the raw JSON array string.`
      },
    });

    const text = response.text || "";
    
    // Attempt to extract JSON from the response text
    // Regex to find array brackets matches
    const jsonMatch = text.match(/\[.*\]/s);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any) => ({
        name: item.name || "Unknown",
        description: item.description,
        url: item.url
      }));
    }

    // Fallback if JSON parsing fails, try to split by newlines if it looks like a list
    const lines = text.split('\n').filter(line => line.trim().length > 0 && !line.includes('[') && !line.includes(']'));
    return lines.slice(0, 30).map(l => ({ name: l.replace(/^- /, '').trim() })); // increased fallback limit

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};

/**
 * Uses Gemini to fuzzy match a client list against a specific fund's portfolio.
 * Handles Hebrew/English, Inc/Ltd, brand vs legal names, and tricky punctuation (I.v.i.c vs IVIC).
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
    
    Task: Identify which of my Clients are likely the same entity as a Portfolio Company using advanced fuzzy matching.
    
    CRITICAL MATCHING RULES:
    1. **Fuzzy Name Matching**: Detect matches despite misspellings, typos, or character swaps.
       - Example: "Goolge" == "Google", "Sofware" == "Software", "Nvidiaa" == "Nvidia".
    2. **Legal Suffix Handling**: Completely ignore legal entity suffixes (Inc, Ltd, GmbH, L.P., Corp, etc.) when comparing.
       - Example: "Wiz Inc." == "Wiz", "Monday Ltd" == "monday.com", "Apple GmbH" == "Apple".
    3. **Acronyms & Punctuation**: You MUST match variations with and without dots/hyphens/spaces. 
       - Example: "I.v.i.c" == "IVIC", "A.B.C" == "ABC", "T-Mobile" == "TMobile".
    4. **Cross-Language Matching**: Handle Hebrew/English equivalents and transliterations.
       - Example: "וויז" == "Wiz", "רפאל" == "Rafael".
    5. **Brand vs Legal**: Match subsidiary or legal names to the main brand name.
       - Example: "Facebook Israel Ltd" == "Meta", "Google Israel" == "Alphabet".
    
    If there is a strong phonetic similarity or clear corporate relationship, mark it as a match.
    
    Return a JSON array of matches.
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
        temperature: 0.1 // Low temperature for factual matching
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