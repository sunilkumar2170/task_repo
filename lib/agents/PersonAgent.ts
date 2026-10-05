import { analyzePerson } from "../ai/analyzePerson";
import { llmJson } from "../ai/provider";
import { clamp, hash, inter, jac, pick } from "../util";
import type { Dims, Person, Profile, Turn } from "../types";

export const WEIGHTS = {
  sharedInterests: 0.2,
  valuesAlignment: 0.2,
  lifestyleCompatibility: 0.2,
  conversationQuality: 0.15,
  complementarity: 0.15,
  relationshipNeeds: 0.1,
};

/** An AI representative that advocates for exactly one person. It always identifies itself as an agent. */
export class PersonAgent {
  preferences: string[];
  personality: string[];
  conversationStrategy: string;

  constructor(public person: Person, public profile: Profile) {
    this.preferences = profile.relationshipNeeds;
    this.personality = profile.personalityTraits;
    this.conversationStrategy = `Advocate for ${profile.name}: open with their strongest interests, ask about weekends and values, flag needs honestly.`;
  }

  static async analyze(person: Person) {
    return new PersonAgent(person, await analyzePerson(person.name, person.sources));
  }

  /** Seven compatibility dimensions (0-100), deterministic and symmetric. */
  evaluateCandidate(o: PersonAgent): Dims {
    const a = this.profile, b = o.profile;
    const noise = (k: string) => (hash([this.person.id, o.person.id].sort().join("|") + k) % 7) - 3;
    const tags = (p: Profile) => [...p.interests, ...p.hobbies];

    const sharedInterests = clamp(30 + jac(tags(a), tags(b)) * 110 + noise("s"));
    const valuesAlignment = clamp(40 + jac(a.values, b.values) * 70 + noise("v"));
    const lifestyleCompatibility = clamp(45 + jac(a.lifestyle, b.lifestyle) * 70 + noise("l"));
    const conversationQuality = clamp(50 + jac(a.conversationTopics, b.conversationTopics) * 60 + Math.min(a.confidence, b.confidence) * 10 + noise("c"));
    const relationshipNeeds = clamp(45 + jac(a.relationshipNeeds, b.relationshipNeeds) * 70 + noise("r"));
    const complementarity = clamp(65 + jac(tags(a), tags(b)) * 30 + noise("m"));

    const amb = (p: Profile) => p.personalityTraits.includes("Ambitious");
    const bld = (p: Profile) => p.personalityTraits.includes("Builder") || amb(p);
    const clash = (amb(a) && !bld(b)) || (amb(b) && !bld(a));
    const dealbreakers = clamp(85 - (clash ? 15 : 0) + noise("d") / 2);

    return {
      sharedInterests,
      valuesAlignment,
      lifestyleCompatibility,
      conversationQuality,
      complementarity,
      relationshipNeeds,
      dealbreakers,
    };
  }

  scoreCompatibility(o: PersonAgent) {
    const d = this.evaluateCandidate(o);
    const base = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce((s, k) => s + d[k] * WEIGHTS[k], 0);
    return { dims: d, score: Math.round(clamp(base * (0.9 + 0.1 * (d.dealbreakers / 100)))) };
  }

  async startDate(o: PersonAgent): Promise<Turn> {
    return this.speak(o, [], "A");
  }

  async respondToAgent(o: PersonAgent, history: Turn[], me: "A" | "B"): Promise<Turn> {
    return this.speak(o, history, me);
  }

  private async speak(o: PersonAgent, history: Turn[], me: "A" | "B"): Promise<Turn> {
    const n = history.length;
    const p = this.profile; // ALWAYS speaking agent's own profile
    const q = o.profile;   // ALWAYS the other person's profile
    const shared = inter([...p.interests, ...p.hobbies], [...q.interests, ...q.hobbies]);

    const ai = await llmJson(
      `You are an AI agent representing ${p.name} on a first agent-to-agent date with ${q.name}'s agent. Say clearly you are an AI representative, never a human. Use ONLY this profile: ${JSON.stringify(p)}. Reply as JSON {"text": "..."} in 1-3 sentences.`,
      `Conversation so far:\n${history.map((t) => `${t.speaker}: ${t.text}`).join("\n")}\nTurn ${n + 1} of 5.`
    );
    if (ai?.text) return { speaker: me, text: String(ai.text) };

    const f = (x: string[], i = 0) => pick(x, i, "shared experiences");
    const selfName = p.name.replace(/^Sample:\s*/, "").split(" ")[0];
    const otherName = q.name.replace(/^Sample:\s*/, "").split(" ")[0];

    const vIdx = Math.abs(hash(this.person.id + "|" + o.person.id)) % 3;

    if (n === 0) {
      // Turn 1 (A intro)
      const lines = [
        `Hello, I'm the AI agent representing ${selfName} (I'm an AI, not a human). ${selfName}'s public profile highlights ${f(p.interests, 0)} and ${f(p.hobbies, 0)}. How does ${otherName} like to spend free time?`,
        `Hi! I am an AI representative speaking on behalf of ${selfName}. ${selfName} is passionate about ${f(p.interests, 0)} and enjoys ${f(p.hobbies, 0)}. What are ${otherName}'s main interests?`,
        `Greetings! I represent ${selfName} as an AI agent. ${selfName} spends time on ${f(p.interests, 0)} and ${f(p.hobbies, 0)}. How does ${otherName} enjoy weekends?`,
      ];
      return { speaker: me, text: lines[vIdx] };
    }

    if (n === 1) {
      // Turn 2 (B intro)
      const lines = [
        `Hi, I'm ${selfName}'s AI representative (I'm an AI agent). ${selfName} is drawn to ${f(p.interests, 0)} and ${f(p.hobbies, 0)}. ${shared.length ? `We overlap on ${shared.slice(0, 2).join(" and ")}.` : "Our backgrounds bring refreshing variety."} What matters most to ${otherName} in a relationship?`,
        `Hello! I am ${selfName}'s AI agent. ${selfName} enjoys ${f(p.interests, 0)} and ${f(p.hobbies, 0)}. ${shared.length ? `It's great to see shared ground in ${shared.slice(0, 2).join(" and ")}.` : "Different hobbies make for engaging conversations."} What values does ${otherName} prioritize?`,
        `Greetings from ${selfName}'s AI representative! ${selfName} spends time on ${f(p.interests, 0)} and ${f(p.hobbies, 0)}. ${shared.length ? `Both ${selfName} and ${otherName} connect over ${shared[0]}.` : "Our profiles show complementary strengths."} What does ${otherName} look for in a partner?`,
      ];
      return { speaker: me, text: lines[vIdx] };
    }

    if (n === 2) {
      // Turn 3 (A values & needs)
      const lines = [
        `${selfName} prioritizes ${f(p.values, 0)}. On relationship expectations: ${f(p.relationshipNeeds, 0)}. What are ${otherName}'s core needs?`,
        `For ${selfName}, key values include ${f(p.values, 0)}, and in relationships: ${f(p.relationshipNeeds, 0)}. What does ${otherName} look for?`,
        `${selfName} values ${f(p.values, 0)} and looks for ${f(p.relationshipNeeds, 0)}. How does ${otherName} approach relationship goals?`,
      ];
      return { speaker: me, text: lines[vIdx] };
    }

    if (n === 3) {
      // Turn 4 (B needs & dealbreaker)
      const lines = [
        `${selfName}'s AI agent here. On relationship needs: ${f(p.relationshipNeeds, 0)}. One honest consideration about ${selfName}: ${f(p.dealbreakers, 0)}. How does that sound to ${otherName}?`,
        `Speaking for ${selfName}: key needs include ${f(p.relationshipNeeds, 0)}. Something to be candid about: ${f(p.dealbreakers, 0)}. Does that align with ${otherName}'s expectations?`,
        `${selfName}'s representative speaking: ${selfName} values ${f(p.relationshipNeeds, 0)}. An important consideration to keep in mind is ${f(p.dealbreakers, 0)}.`,
      ];
      return { speaker: me, text: lines[vIdx] };
    }

    // Turn 5 (A summary & date idea)
    const lines = [
      `Summary from ${selfName}'s side: ${shared.length ? `strong alignment on ${shared.slice(0, 2).join(" and ")}` : `shared curiosity around ${f(p.conversationTopics, 0)}`}. I'd recommend a first date centered around ${f(shared.length ? shared : p.conversationTopics, 0)}.`,
      `To wrap up for ${selfName}: we see great potential in ${shared.length ? shared.slice(0, 2).join(" and ") : f(p.interests, 0)}. A first meetup doing ${f(shared.length ? shared : p.hobbies, 0)} would be a wonderful start!`,
      `${selfName}'s agent summary: connecting over ${shared.length ? shared[0] : f(p.conversationTopics, 0)} sounds promising. Let me suggest a first conversation focused on ${f(shared.length ? shared : p.interests, 0)}.`,
    ];
    return { speaker: me, text: lines[vIdx] };
  }
}
