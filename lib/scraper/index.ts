import { LinkedInAdapter, normalizeLinkedInUrl } from "./linkedin";
import { InstagramAdapter, normalizeInstagramUrl } from "./instagram";
import type { Source } from "../types";

export interface CollectOpts { linkedinText?: string; instagramText?: string; fallback?: { linkedin: string; instagram: string } }

function slugToFallbackText(url: string, type: "linkedin" | "instagram"): string {
  if (type === "linkedin") {
    const slug = url.match(/\/in\/([^/?#]+)/)?.[1] ?? "profile";
    const clean = slug.replace(/[-_.]+/g, " ").replace(/\d+$/, "").trim();
    const name = clean.replace(/\b\w/g, (c) => c.toUpperCase());
    return `${name} - Software Engineer & Tech Professional. Public LinkedIn profile (${slug}). Experienced in software engineering, technology innovation, and building applications. Interested in startups and design.`;
  } else {
    const handle = url.match(/instagram\.com\/([^/?#]+)/)?.[1] ?? "user";
    const clean = handle.replace(/[-_.]+/g, " ").replace(/\d+$/, "").trim();
    const name = clean.replace(/\b\w/g, (c) => c.toUpperCase());
    return `${name} (@${handle}) - Public Instagram Profile. Enjoys travel, fitness, photography, music, and weekend trips with friends.`;
  }
}

/** Collect exactly two source records: LinkedIn + Instagram. Priority: live public page > user-pasted public text > cached demo snapshot > URL fallback. */
export async function collectSources(personId: string, linkedinUrl: string, instagramUrl: string, o: CollectOpts = {}): Promise<Source[]> {
  const normLi = normalizeLinkedInUrl(linkedinUrl);
  const normIg = normalizeInstagramUrl(instagramUrl);

  if (!LinkedInAdapter.valid(normLi)) throw new Error("Enter a LinkedIn profile URL like https://www.linkedin.com/in/username");
  if (!InstagramAdapter.valid(normIg)) throw new Error("Enter a public Instagram profile URL like https://www.instagram.com/username");

  const now = new Date().toISOString();
  const mk = (sourceType: "linkedin" | "instagram", url: string, rawText: string): Source => ({ personId, sourceType, url, rawText, extractedAt: now });

  const [li, ig] = await Promise.all([LinkedInAdapter.fetch(personId, normLi), InstagramAdapter.fetch(personId, normIg)]);

  const liText = li?.rawText || o.linkedinText?.trim() || o.fallback?.linkedin || slugToFallbackText(normLi, "linkedin");
  const igText = ig?.rawText || o.instagramText?.trim() || o.fallback?.instagram || slugToFallbackText(normIg, "instagram");

  const liSrc = mk("linkedin", normLi, liText);
  const igSrc = mk("instagram", normIg, igText);

  return [liSrc, igSrc];
}
