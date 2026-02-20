import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
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
