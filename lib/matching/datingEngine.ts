import type { PersonAgent } from "../agents/PersonAgent";
import { inter } from "../util";
import type { Dims, Match, Turn } from "../types";

const LABEL: Record<keyof Dims, string> = {
  sharedInterests: "Shared interests",
  valuesAlignment: "Values alignment",
  lifestyleCompatibility: "Lifestyle fit",
  conversationQuality: "Conversation quality",
  complementarity: "Complementary strengths",
  relationshipNeeds: "Relationship needs",
  dealbreakers: "No clear dealbreakers",
};

function explain(a: PersonAgent, b: PersonAgent, k: keyof Dims, v: number): string {
  const shInt = inter([...a.profile.interests, ...a.profile.hobbies], [...b.profile.interests, ...b.profile.hobbies]);
  const shVal = inter(a.profile.values, b.profile.values);
  const shLife = inter(a.profile.lifestyle, b.profile.lifestyle);
  const shNeeds = inter(a.profile.relationshipNeeds, b.profile.relationshipNeeds);

  const formatScore = (val: number) => (val >= 99 ? "" : ` (${Math.round(val)}/100)`);

  if (k === "sharedInterests") {
    return shInt.length ? `Shared interests: ${shInt.join(", ")}${formatScore(v)}` : `Broadens interest horizons${formatScore(v)}`;
  }
  if (k === "valuesAlignment") {
    return shVal.length ? `Shared values: ${shVal.join(", ")}${formatScore(v)}` : `Aligned core principles${formatScore(v)}`;
  }
  if (k === "lifestyleCompatibility") {
    return shLife.length ? `Shared lifestyle: ${shLife.join(", ")}${formatScore(v)}` : `Compatible daily routines${formatScore(v)}`;
  }
  if (k === "relationshipNeeds") {
    return shNeeds.length ? `Shared relationship needs: ${shNeeds.join(", ")}${formatScore(v)}` : `Mutual relationship expectations${formatScore(v)}`;
  }
  return `${LABEL[k]}: ${Math.round(v)}/100`;
}

/** Evaluation for rankings. */
export function evaluatePair(a: PersonAgent, b: PersonAgent): Match {
  const { dims, score } = a.scoreCompatibility(b);

  // Sort dimensions prioritize those with concrete tag overlaps for reasons
  const ks = (Object.keys(dims) as (keyof Dims)[]).sort((x, y) => dims[y] - dims[x]);

  const shInt = inter([...a.profile.interests, ...a.profile.hobbies], [...b.profile.interests, ...b.profile.hobbies]);
  const shVal = inter(a.profile.values, b.profile.values);
  const shLife = inter(a.profile.lifestyle, b.profile.lifestyle);

  // Prioritize concrete reasons first for main reason display
  const reasonsRaw = ks.map((k) => ({ key: k, text: explain(a, b, k, dims[k]) }));
  reasonsRaw.sort((x, y) => {
    const xHasTags = x.text.includes(": ") && !x.text.includes("Broadens") && !x.text.includes("Aligned core");
    const yHasTags = y.text.includes(": ") && !y.text.includes("Broadens") && !y.text.includes("Aligned core");
    if (xHasTags && !yHasTags) return -1;
    if (!xHasTags && yHasTags) return 1;
    return dims[y.key] - dims[x.key];
  });

  const low = ks[ks.length - 1];
  return {
    candidateId: b.person.id,
    score,
    dims,
    conversation: [],
    reasons: reasonsRaw.slice(0, 3).map((r) => r.text),
    strengths: ks.slice(0, 2).map((k) => LABEL[k]),
    concerns: [low === "dealbreakers" ? "Possible mismatch in schedule and ambition" : `Weakest area: ${LABEL[low].toLowerCase()} (${Math.round(dims[low])}/100)`],
  };
}

/** Full date: 5 alternating turns between two agents, then evaluation. */
export async function runDate(a: PersonAgent, b: PersonAgent): Promise<Match> {
  const conversation: Turn[] = [await a.startDate(b)];
  for (let i = 1; i < 5; i++) {
    const me = i % 2 ? "B" : "A", agent = i % 2 ? b : a, other = i % 2 ? a : b;
    conversation.push(await agent.respondToAgent(other, conversation, me));
  }
  return { ...evaluatePair(a, b), conversation };
}
