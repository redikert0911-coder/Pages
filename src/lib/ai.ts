import { readFileSync } from "fs";
import { join } from "path";
import type { DiffSegment } from "./differ";

function getApiKey(): string {
  // Try env var first — but only if it looks like a real OpenAI key
  const envKey = process.env.OPENAI_API_KEY ?? "";
  if (envKey.startsWith("sk-")) return envKey;

  // Fall back to local key file (bypasses broken env var)
  try {
    const fileKey = readFileSync(join(import.meta.dir, "../../.openai_key"), "utf-8").trim();
    if (fileKey.startsWith("sk-")) return fileKey;
  } catch { /* no file, ignore */ }

  return "";
}

const OPENAI_API_KEY = getApiKey();
const AI_ENABLED = OPENAI_API_KEY.startsWith("sk-");

interface AIMessage {
  role: "system" | "user";
  content: string;
}

async function callOpenAI(messages: AIMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${body}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

export interface DigestResult {
  summary: string;
  error?: string;
}

export async function generateDigest(
  url: string,
  pageTitle: string,
  diffs: DiffSegment[],
  oldTitle: string,
  newTitle: string,
): Promise<DigestResult> {
  if (!AI_ENABLED) {
    return {
      summary:
        "AI-powered analysis is not configured. Set the OPENAI_API_KEY environment variable to enable AI commentary.",
    };
  }

  // Build a concise diff summary for the AI
  const diffSummary = diffs
    .filter((d) => d.type !== "unchanged")
    .map((d) => {
      const label = d.type === "added" ? "[ADDED]" : "[REMOVED]";
      const snippet = d.text.slice(0, 300);
      return `${label}: ${snippet}`;
    })
    .join("\n");

  const hasTitleChange = oldTitle !== newTitle;

  const systemPrompt = `You are a competitive intelligence analyst for B2B SaaS companies. 
You analyze website changes and explain their strategic significance. 
Be concise and insightful. If the changes are trivial (minor wording, no real substance), say so honestly.
Focus on: new features, pricing changes, positioning shifts, team changes, new product launches, or messaging pivots.`;

  const userPrompt = `Analyze these changes on ${url}:

${hasTitleChange ? `Page title changed from "${oldTitle}" to "${newTitle}".` : `Page title: "${newTitle}"`}

Changes detected:
${diffSummary.slice(0, 3000) || "No significant text changes detected."}

In 2-4 sentences, explain what these changes mean from a competitive standpoint. If there are no meaningful changes, say so.`;

  try {
    const summary = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return { summary: summary.trim() || "Unable to generate analysis." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      summary: "AI analysis unavailable at this time.",
      error: msg,
    };
  }
}
