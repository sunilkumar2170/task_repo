import { fetchPublicText } from "./public";
import type { Source } from "../types";

export const LINKEDIN_RE = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i;

export function normalizeLinkedInUrl(u: string): string {
  let s = u.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

export const LinkedInAdapter = {
  valid: (u: string) => LINKEDIN_RE.test(u.trim()),
  async fetch(personId: string, url: string): Promise<Source | null> {
    const normUrl = normalizeLinkedInUrl(url);
    const rawText = await fetchPublicText(normUrl);
    return rawText ? { personId, sourceType: "linkedin", url: normUrl, rawText, extractedAt: new Date().toISOString() } : null;
  },
};
