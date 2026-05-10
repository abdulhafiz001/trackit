import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://models.inference.ai.azure.com";
const token = process.env.GITHUB_TOKEN || "";
const modelName = process.env.GITHUB_MODEL_NAME || "gpt-4o-mini";

// Create the client
const client = new ModelClient(endpoint, new AzureKeyCredential(token));

export async function generateLogEntry(
  recentEntries: string[],
  currentDate: string,
  currentDayName: string
): Promise<string> {
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable");
  }

  const entriesList = recentEntries.length > 0 
    ? recentEntries.map((e, i) => `- Entry ${i + 1}: ${e}`).join("\n") 
    : "No recent entries available. This is their first log entry.";

  const systemPrompt = `You are a helpful assistant for a Nigerian university student doing their Industrial Training (IT/SIWES). 
Based on their recent daily log entries, suggest what they likely did today. 
Be specific, professional, and use first-person. Keep it to 2-3 short sentences maximum. Write it as if the student is describing their day. Do not add conversational filler.

Recent entries:
${entriesList}

Today is ${currentDayName}, ${currentDate}. Suggest a realistic and plausible short log entry for today.`;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Suggest my log entry for today." }
      ],
      model: modelName,
      max_tokens: 300,
      temperature: 0.7
    }
  });

  if (response.status !== "200") {
    throw new Error(`Failed to generate entry: ${response.body.error?.message || response.status}`);
  }

  return response.body.choices[0].message.content;
}
