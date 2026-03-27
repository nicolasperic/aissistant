import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isOverloaded = err instanceof Anthropic.APIError && err.status === 529;
      if (isOverloaded && attempt < MAX_RETRIES - 1) {
        await new Promise((res) => setTimeout(res, 2000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  // Unreachable but satisfies TypeScript
  throw new Error("Unreachable");
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 8192
): Promise<string> {
  return withRetry(() =>
    anthropic.messages
      .stream({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
      .finalText()
  );
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
