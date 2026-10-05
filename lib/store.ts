import fs from "fs";
import seed from "../data/people.json";
import profilesJson from "../data/profiles.json";
import { PersonAgent } from "./agents/PersonAgent";
import { evaluatePair } from "./matching/datingEngine";
import type { Match, Person, Profile } from "./types";

const EXTRA = "/tmp/agentic-dating-extra.json";
type Seed = { id: string; name: string; linkedinUrl: string; instagramUrl: string; sample?: boolean; demoSourceData: { linkedin: string; instagram: string } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
const cachedProfiles: Record<string, Profile> = profilesJson as unknown as Record<string, Profile>;

const extra = (): Person[] => {
  try {
    return JSON.parse(fs.readFileSync(EXTRA, "utf8"));
  } catch {
    return [];
  }
};

export async function agents(): Promise<PersonAgent[]> {
  if (!g.__agents) {
    g.__agents = Promise.all([
      ...(seed as Seed[]).map(async (s) => {
        const person: Person = {
          id: s.id,
          name: s.name,
          linkedinUrl: s.linkedinUrl,
          instagramUrl: s.instagramUrl,
          sample: s.sample,
          sources: [
            { personId: s.id, sourceType: "linkedin", url: s.linkedinUrl, rawText: s.demoSourceData.linkedin, extractedAt: "cached" },
            { personId: s.id, sourceType: "instagram", url: s.instagramUrl, rawText: s.demoSourceData.instagram, extractedAt: "cached" },
          ],
        };
        const precomputed = cachedProfiles[s.id];
        if (precomputed) return new PersonAgent(person, precomputed);
        return PersonAgent.analyze(person);
      }),
      ...extra().map((p) => PersonAgent.analyze(p)),
    ]);
  }
  return g.__agents;
}

export const getAgent = async (id: string) => (await agents()).find((a) => a.person.id === id);

export async function addPerson(person: Person): Promise<PersonAgent> {
  const list = await agents();
  const agent = await PersonAgent.analyze(person);
  list.push(agent);
  g.__pairs = new Map();
  try {
    fs.writeFileSync(EXTRA, JSON.stringify([...extra(), person]));
  } catch {
    /* read-only FS: stays in memory */
  }
  return agent;
}

export async function pair(aId: string, bId: string): Promise<Match | null> {
  const [a, b] = [await getAgent(aId), await getAgent(bId)];
  if (!a || !b) return null;
  g.__pairs ??= new Map();
  const k = `${aId}|${bId}`;
  if (!g.__pairs.has(k)) g.__pairs.set(k, evaluatePair(a, b));
  return g.__pairs.get(k);
}

export async function ranking(id: string): Promise<{ agent: PersonAgent; match: Match }[]> {
  const all = await agents(), out = [];
  for (const o of all) if (o.person.id !== id) {
    const m = await pair(id, o.person.id);
    if (m) out.push({ agent: o, match: m });
  }
  return out.sort((x, y) => y.match.score - x.match.score || x.agent.person.id.localeCompare(y.agent.person.id));
}

export async function stats() {
  const all = await agents(), scores: { a: string; b: string; s: number }[] = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const m = await pair(all[i].person.id, all[j].person.id);
    if (m) scores.push({ a: all[i].person.name, b: all[j].person.name, s: m.score });
  }
  const best = scores.sort((x, y) => y.s - x.s)[0];
  return { people: all.length, pairs: scores.length, best, avg: scores.length ? Math.round(scores.reduce((t, x) => t + x.s, 0) / scores.length) : 0 };
}

export const summary = (a: PersonAgent) => ({
  id: a.person.id,
  name: a.person.name,
  sample: a.person.sample ?? false,
  profession: a.profile.profession,
  interests: a.profile.interests.slice(0, 3),
  confidence: a.profile.confidence,
});
