import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { base64Data, mimeType, todayDate } = req.body || {};
    if (!base64Data || !mimeType) {
      res.status(400).json({ error: "Missing required parameters (base64Data, mimeType)" });
      return;
    }

    const ai = getAIClient();
    const prompt = `You are a financial receipt reader. Analyze this image or PDF document and extract the transaction details. Return a strictly valid JSON object ONLY. 
Required format:
{
  "amount": <number representing total amount, without commas>,
  "date": "YYYY-MM-DD" (if not found in document, use "${todayDate || new Date().toISOString().slice(0, 10)}"),
  "note": "A short and descriptive title in Thai of the store, item, or category of this transaction",
  "kind": "expense" or "income" (almost always "expense" for receipts/slips),
  "ref": "receipt number, slip reference, or transaction id if present, otherwise an empty string"
}
If you cannot find any amount or read the document, return {"amount": 0}.
Do not write any markdown code blocks, just return raw JSON text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error analyzing receipt:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
