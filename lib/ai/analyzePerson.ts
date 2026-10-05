import { z } from "zod";
import { llmJson } from "./provider";
import { clamp } from "../util";
import type { Profile, Source } from "../types";

const L = z.array(z.string()).default([]);
export const ProfileSchema = z.object({
  name: z.string(),
  profession: z.string().default("unknown"),
  summary: z.string().default(""),
  interests: L,
  hobbies: L,
  lifestyle: L,
  personalityTraits: L,
  relationshipNeeds: L,
  conversationTopics: L,
  values: L,
  compatibilitySignals: L,
  dealbreakers: L,
  confidence: z.number().min(0).max(1).default(0.5),
});

const SYSTEM = `You analyze ONE person. You may ONLY use information contained in the supplied LinkedIn and Instagram source text. Do not infer sensitive attributes (race, religion, sexual orientation, health, political affiliation, financial status). Do not fabricate facts. Mark uncertain information as "unknown". Return JSON with keys: name, profession, summary, interests, hobbies, lifestyle, personalityTraits, relationshipNeeds, conversationTopics, values, compatibilitySignals, dealbreakers (string arrays except name/profession/summary) and confidence (0-1).`;

const rules = (m: Record<string, RegExp>, t: string) => Object.keys(m).filter((k) => m[k].test(t));

const INTERESTS: Record<string, RegExp> = {
  AI: /\b(ai|ml|llm|agents?|machine learning|deepmind|neural)\b/i,
  Startups: /startup|founder|entrepreneur|venture|angel|invest/i,
  Backend: /backend|\bapis?\b|node\.?js|database|systems|rust|c\+\+|cloud|kubernetes|devops/i,
  "Web development": /react|frontend|web dev|next\.?js|typescript|mobile|swift|graphql/i,
  "Data science": /\bdata\b|analytics|quant|genomic|statistics/i,
  Design: /design|\bux\b|figma|architect|pottery|brand/i,
  "Open source": /open.?source|github|hackathon|community|devrel/i,
  Fintech: /finance|fintech|invest|quant|trader|arbitrage/i,
  Education: /teach|mentor|education|student|edtech|tutoring/i,
  Biotech: /bioinformatics|genomic|neuroscience|medicine|healthtech|biology/i,
  Robotics: /robotics|drone|hardware|embedded|autonomous/i,
  "Media & Film": /podcast|film|documentary|director|growth|marketing|music|audio|dj/i,
};

const HOBBIES: Record<string, RegExp> = {
  Travel: /travel|trip|road trip|scuba|camping/i,
  Photography: /photograph|analog|film/i,
  Running: /\brun|trail|marathon/i,
  Hiking: /hik|mountain|nature|walk/i,
  Gaming: /gaming|gamer|board game|puzzle/i,
  Cooking: /cook|baking|sourdough|bbq|food/i,
  Reading: /reading|books?\b|sci-fi|literature/i,
  Sports: /cricket|football|soccer|tennis|badminton|bouldering|climbing|martial arts/i,
  Music: /music|guitar|concert|vinyl|sound|dj|piano|salsa|acoustic/i,
  Fitness: /\bgym\b|fitness|workout|yoga|mindfulness/i,
  Art: /\bart\b|paint|sketch|pottery|museum|design/i,
  Coffee: /coffee|espresso|brew/i,
  Chess: /chess|strategy/i,
};

const TRAITS: Record<string, RegExp> = {
  Curious: /curious|learn|explor|research|published/i,
  Ambitious: /ambitio|founder|hiring|scal|launch|lead|director|head/i,
  Creative: /creativ|design|\bart\b|music|film|pottery|architect/i,
  Social: /community|friends|events|together|team|podcast|social|meetup/i,
  Builder: /\bbuilt|\bbuild|shipp|launch|engineer|developer/i,
  Mentor: /mentor|teach|speaker|advisor/i,
};

const VALUES: Record<string, string> = {
  Curious: "Continuous Learning",
  Ambitious: "Growth & Excellence",
  Creative: "Creativity & Originality",
  Social: "Community & Connection",
  Builder: "Craftsmanship & Impact",
  Mentor: "Generosity & Mentorship",
};

const NEEDS: Record<string, string> = {
  Ambitious: "A partner who respects a demanding, build-focused schedule",
  Social: "A vibrant shared social life and community",
  Creative: "Shared curiosity about creative and intellectual pursuits",
  Curious: "Someone to explore new ideas and keep learning alongside",
  Builder: "Mutual support for ambitious projects and hands-on creation",
  Mentor: "Empathy, open communication, and guiding each other",
};

export function heuristicProfile(name: string, sources: Source[]): Profile {
  const li = sources.find((s) => s.sourceType === "linkedin")?.rawText ?? "";
  const ig = sources.find((s) => s.sourceType === "instagram")?.rawText ?? "";
  const t = `${li}\n${ig}`;
  const interests = rules(INTERESTS, t);
  const hobbies = rules(HOBBIES, t);
  const traits = rules(TRAITS, t);
  const lifestyle = [
    ...(/run|hik|gym|fitness|yoga|climbing|bouldering|marathon/i.test(t) ? ["Active & Healthy routine"] : []),
    ...(/travel|trip|scuba|road trip/i.test(t) ? ["Frequent traveller"] : []),
    ...(/startup|founder|building|hiring|lead|engineer/i.test(t) ? ["Always building something"] : []),
    ...(/community|friends|events|meetup|podcast/i.test(t) ? ["Community & Social-oriented"] : []),
  ];
  const headline = (li.split(/[.\n]/)[0] || "").split(/ [-–|] /).slice(1).join(" - ").trim() || (li.slice(0, 60) || "unknown");
  const needs = traits.map((k: string) => NEEDS[k]).filter(Boolean);
  const topics = [...interests, ...hobbies].slice(0, 4);
  const signals = traits.length + interests.length + hobbies.length;
  const mappedValues = traits.map((k: string) => VALUES[k]).filter(Boolean);
  return {
    name,
    profession: headline,
    summary: headline === "unknown" ? "Not enough public information." : `${headline}. Public signals point to ${[...interests, ...hobbies].slice(0, 3).join(", ") || "various interests"}.`,
    interests: interests.length ? interests : ["General Tech & Innovation"],
    hobbies: hobbies.length ? hobbies : ["Exploring & Reading"],
    lifestyle: lifestyle.length ? lifestyle : ["Balanced lifestyle"],
    personalityTraits: traits.length ? traits : ["Curious", "Social"],
    relationshipNeeds: needs.length ? needs : ["Open communication and mutual support"],
    conversationTopics: topics.length ? topics : ["Career goals", "Favorite weekend activities"],
    values: mappedValues.length ? mappedValues : ["Learning", "Growth"],
    compatibilitySignals: topics.map((x) => `Likely to connect over ${x}`),
    dealbreakers: ["Lack of mutual respect and communication"],
    confidence: Math.round(clamp(0.4 + 0.05 * signals, 0.35, 0.95) * 100) / 100,
  };
}

/** The analyzer receives ONLY the two source records. */
export async function analyzePerson(name: string, sources: Source[]): Promise<Profile> {
  const body = sources.map((s) => `### ${s.sourceType.toUpperCase()} (${s.url})\n${s.rawText}`).join("\n\n");
  const out = await llmJson(SYSTEM, `Person name: ${name}\n\n${body}`);
  if (out) {
    const p = ProfileSchema.safeParse({ ...out, name });
    if (p.success) return p.data;
  }
  return heuristicProfile(name, sources);
}
