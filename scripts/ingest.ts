/* Refresh demo snapshots from the two official public URLs: npm run ingest */
import fs from "fs";
import { collectSources } from "../lib/scraper";
const file = "data/people.json";
const people = JSON.parse(fs.readFileSync(file, "utf8"));
(async () => {
  for (const p of people) {
    try {
      const [li, ig] = await collectSources(p.id, p.linkedinUrl, p.instagramUrl);
      p.demoSourceData = { linkedin: li.rawText, instagram: ig.rawText }; p.sample = false;
      console.log("ok     ", p.name);
    } catch (e) { console.log("skipped", p.name, "-", (e as Error).message); }
  }
  fs.writeFileSync(file, JSON.stringify(people, null, 2));
})();
