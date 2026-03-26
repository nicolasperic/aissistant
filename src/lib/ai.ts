import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 8192
): Promise<string> {
  const text = await anthropic.messages
    .stream({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })
    .finalText();

  return text;
}

export async function generateJsonCompletion<T>(
  systemPrompt: string,
  userMessage: string
): Promise<T> {
  const response = await generateCompletion(
    systemPrompt +
      "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanation.",
    userMessage
  );

  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
