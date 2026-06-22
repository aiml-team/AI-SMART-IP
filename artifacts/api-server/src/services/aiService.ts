import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger.js";

export interface InsightsResult {
  businessProblems: string[];
  keywords: string[];
  sapModules: string[];
  industry: string;
}

export interface IpItem {
  id: string;
  name: string;
  description: string;
  businessProblems: string[];
  industries: string[];
  sapModules: string[];
  keywords: string[];
  triggerSignals: string[];
  valueProposition: string;
  pitch: string;
  differentiators: string;
  implementationEffort: string;
  maturityLevel: string;
}

export interface ScoredIp {
  ip: IpItem;
  rawScore: number;
  breakdown: {
    keywordScore: number;
    problemScore: number;
    moduleScore: number;
    industryScore: number;
  };
}

export interface IpRecommendation {
  ipId: string;
  ipName: string;
  score: number;
  reason: string;
  pitch: string;
  implementationEffort: string;
  maturityLevel: string;
}

export async function extractInsights(transcript: string): Promise<InsightsResult> {
  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Analyze the following customer meeting transcript and extract:
1. Key business problems (specific pain points mentioned)
2. SAP modules or technologies mentioned
3. Business keywords relevant to SAP solutions
4. Industry (if identifiable)

Return ONLY valid JSON with these exact keys: businessProblems (array of strings), keywords (array of strings), sapModules (array of strings), industry (string, empty string if not identifiable).

Transcript:
${transcript}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  try {
    const parsed = JSON.parse(content) as InsightsResult;
    return {
      businessProblems: Array.isArray(parsed.businessProblems) ? parsed.businessProblems : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      sapModules: Array.isArray(parsed.sapModules) ? parsed.sapModules : [],
      industry: typeof parsed.industry === "string" ? parsed.industry : "",
    };
  } catch {
    logger.error({ content }, "Failed to parse AI insights response");
    throw new Error("Failed to parse AI response as JSON");
  }
}

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

function overlapScore(setA: string[], setB: string[]): number {
  if (setA.length === 0 || setB.length === 0) return 0;
  const normalizedA = setA.map(normalize);
  const normalizedB = setB.map(normalize);

  let matches = 0;
  for (const a of normalizedA) {
    for (const b of normalizedB) {
      if (a.includes(b) || b.includes(a)) {
        matches++;
        break;
      }
    }
  }
  return Math.min(1, matches / Math.max(normalizedA.length, 1));
}

export function scoreIpCatalog(insights: InsightsResult, catalog: IpItem[]): ScoredIp[] {
  return catalog.map((ip) => {
    const keywordScore = overlapScore(
      [...insights.keywords, ...insights.businessProblems],
      [...ip.keywords, ...ip.triggerSignals]
    );
    const problemScore = overlapScore(insights.businessProblems, ip.businessProblems);
    const moduleScore = overlapScore(insights.sapModules, ip.sapModules);

    const industryMatch =
      insights.industry === "" ||
      ip.industries.some(
        (ind) =>
          normalize(ind).includes(normalize(insights.industry)) ||
          normalize(insights.industry).includes(normalize(ind)) ||
          normalize(ind) === "all industries"
      );
    const industryScore = industryMatch ? 1 : 0;

    const rawScore =
      keywordScore * 0.4 +
      problemScore * 0.3 +
      moduleScore * 0.2 +
      industryScore * 0.1;

    return {
      ip,
      rawScore,
      breakdown: { keywordScore, problemScore, moduleScore, industryScore },
    };
  });
}

export function getTopIps(scoredIps: ScoredIp[], count = 3): ScoredIp[] {
  return [...scoredIps].sort((a, b) => b.rawScore - a.rawScore).slice(0, count);
}

export async function generateRecommendationReasons(
  insights: InsightsResult,
  topIps: ScoredIp[]
): Promise<IpRecommendation[]> {
  const ipSummaries = topIps
    .map(
      (item, idx) => `IP ${idx + 1}: ${item.ip.name}
Description: ${item.ip.description}
Value Proposition: ${item.ip.valueProposition}
Business Problems Solved: ${item.ip.businessProblems.join(", ")}
SAP Modules: ${item.ip.sapModules.join(", ")}`
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are an SAP sales expert. A customer meeting revealed these insights:
Business Problems: ${insights.businessProblems.join(", ")}
Keywords: ${insights.keywords.join(", ")}
SAP Modules Mentioned: ${insights.sapModules.join(", ")}
Industry: ${insights.industry || "Unknown"}

Given these top IP candidates, write a compelling explanation of why each IP is relevant to this customer, and a customer-ready sales pitch.

${ipSummaries}

Return ONLY valid JSON as an array of ${topIps.length} objects, each with:
- "reason": A 2-3 sentence explanation of why this IP is relevant to the customer's specific situation
- "pitch": A 2-3 sentence customer-ready sales message they can use in the next meeting

Return as: { "recommendations": [...] }`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model for recommendations");
  }

  let parsed: { recommendations: Array<{ reason: string; pitch: string }> };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    logger.error({ content }, "Failed to parse recommendation response");
    throw new Error("Failed to parse recommendation response as JSON");
  }

  return topIps.map((item, idx) => ({
    ipId: item.ip.id,
    ipName: item.ip.name,
    score: Math.round(item.rawScore * 100),
    reason: parsed.recommendations[idx]?.reason ?? item.ip.valueProposition,
    pitch: parsed.recommendations[idx]?.pitch ?? item.ip.pitch,
    implementationEffort: item.ip.implementationEffort,
    maturityLevel: item.ip.maturityLevel,
  }));
}

export async function generateEmailPitch(
  ipName: string,
  customerContext: string,
  reason: string
): Promise<{ subject: string; body: string }> {
  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are an SAP sales executive writing a follow-up email after a customer meeting.

IP Solution: ${ipName}
Customer Context: ${customerContext}
Why It's Relevant: ${reason}

Write a professional, concise follow-up email pitching this SAP IP solution.

Return ONLY valid JSON with:
- "subject": Email subject line (concise, compelling)
- "body": Email body (professional, 3-4 paragraphs, no generic filler, specific to the customer context)`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model for email pitch");
  }

  try {
    const parsed = JSON.parse(content) as { subject: string; body: string };
    return {
      subject: parsed.subject ?? `Following Up: ${ipName} for Your Business`,
      body: parsed.body ?? "",
    };
  } catch {
    throw new Error("Failed to parse email pitch response");
  }
}
