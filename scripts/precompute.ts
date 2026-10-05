import fs from "fs";
import path from "path";
import people from "../data/people.json";
import { PersonAgent } from "../lib/agents/PersonAgent";
import { analyzePerson } from "../lib/ai/analyzePerson";
import { runDate, evaluatePair } from "../lib/matching/datingEngine";
import type { Profile, Match } from "../lib/types";

async function main() {
  console.log(`Precomputing profiles and top-3 dates for ${people.length} people...`);

  const profilesMap: Record<string, Profile> = {};
  const agentMap: Record<string, PersonAgent> = {};

  for (const p of people) {
    const sources = [
      { personId: p.id, sourceType: "linkedin" as const, url: p.linkedinUrl, rawText: p.demoSourceData.linkedin, extractedAt: "cached" },
      { personId: p.id, sourceType: "instagram" as const, url: p.instagramUrl, rawText: p.demoSourceData.instagram, extractedAt: "cached" },
    ];
    const profile = await analyzePerson(p.name, sources);
    profilesMap[p.id] = profile;
    agentMap[p.id] = new PersonAgent(p as any, profile);
    console.log(`Profile ready: ${p.name}`);
  }

  const datesMap: Record<string, Match> = {};
  const allAgents = Object.values(agentMap);

  for (const agent of allAgents) {
    const rankings = allAgents
      .filter((o) => o.person.id !== agent.person.id)
      .map((o) => ({ other: o, eval: evaluatePair(agent, o) }))
      .sort((x, y) => y.eval.score - x.eval.score)
      .slice(0, 3);

    for (const r of rankings) {
      const pairKey1 = `${agent.person.id}|${r.other.person.id}`;
      const pairKey2 = `${r.other.person.id}|${agent.person.id}`;

      if (!datesMap[pairKey1] && !datesMap[pairKey2]) {
        console.log(`Running date: ${agent.person.name} <-> ${r.other.person.name}`);
        const dateMatch = await runDate(agent, r.other);
        datesMap[pairKey1] = dateMatch;
        datesMap[pairKey2] = dateMatch;
      }
    }
  }

  fs.writeFileSync(path.join(process.cwd(), "data/profiles.json"), JSON.stringify(profilesMap, null, 2));
  fs.writeFileSync(path.join(process.cwd(), "data/dates.json"), JSON.stringify(datesMap, null, 2));

  console.log("Precomputation complete! Wrote data/profiles.json and data/dates.json.");
}

main().catch((err) => {
  console.error("Precompute failed:", err);
  process.exit(1);
});
