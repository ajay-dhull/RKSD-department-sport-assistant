/**
 * Groq Multi-Key Auto-Rotation
 *
 * Reads API keys from environment variables in this order:
 *   GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3, ... (unlimited)
 *   GROQ_API_KEY  (fallback for backwards compatibility)
 *
 * When a key fails with 429 (quota exhausted) or auth error, it
 * automatically tries the next key in the sequence.
 *
 * To add more keys: just add GROQ_API_KEY_4, GROQ_API_KEY_5, etc.
 * to environment variables — no code change needed.
 */

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface GroqResult {
  content: string;
  keyIndex: number;
}

function getGroqApiKeys(): string[] {
  const keys: string[] = [];

  // Collect GROQ_API_KEY_1, GROQ_API_KEY_2, ... up to 20
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key && key.trim()) keys.push(key.trim());
  }

  // Also include plain GROQ_API_KEY (backwards compatibility)
  const legacyKey = process.env.GROQ_API_KEY;
  if (legacyKey && legacyKey.trim() && !keys.includes(legacyKey.trim())) {
    keys.push(legacyKey.trim());
  }

  return keys;
}

/**
 * Call Groq with automatic key rotation.
 * Tries each key in sequence; on 429/401/403 moves to next key.
 * Returns the first successful response.
 */
export async function callGroqWithFallback(
  messages: GroqMessage[],
  options: GroqOptions = {},
): Promise<GroqResult> {
  const keys = getGroqApiKeys();

  if (keys.length === 0) {
    throw new Error("No Groq API keys found in environment variables");
  }

  const model = options.model || "llama-3.3-70b-versatile";
  const max_tokens = options.max_tokens || 500;
  const temperature = options.temperature ?? 0.7;

  let lastError: string = "";

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages, model, max_tokens, temperature }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        console.log(
          `✅ Groq key #${i + 1} succeeded (${model})`,
        );
        return { content, keyIndex: i + 1 };
      }

      const status = response.status;
      const body = await response.text();

      if (status === 429 || status === 401 || status === 403) {
        console.warn(
          `⚠️ Groq key #${i + 1} failed (HTTP ${status}) — trying next key...`,
        );
        lastError = `Key #${i + 1}: HTTP ${status} — ${body.substring(0, 100)}`;
        continue;
      }

      // Other errors (5xx, etc.) — also try next
      console.warn(`⚠️ Groq key #${i + 1} HTTP ${status} — trying next key...`);
      lastError = `Key #${i + 1}: HTTP ${status}`;
      continue;
    } catch (err: any) {
      console.warn(`⚠️ Groq key #${i + 1} threw error: ${err.message}`);
      lastError = err.message;
      continue;
    }
  }

  throw new Error(`All ${keys.length} Groq API key(s) failed. Last error: ${lastError}`);
}

/**
 * Returns count of configured Groq API keys (for diagnostics).
 */
export function getGroqKeyCount(): number {
  return getGroqApiKeys().length;
}
