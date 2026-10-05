import { fetchPublicText } from "./public";
import type { Source } from "../types";

export const INSTAGRAM_RE = /^(https?:\/\/)?(www\.)?instagram\.com\/(?!p\/|reel\/|explore|accounts|stories)[A-Za-z0-9._]+/i;

export function normalizeInstagramUrl(u: string): string {
  let s = u.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

export const InstagramAdapter = {
  valid: (u: string) => INSTAGRAM_RE.test(u.trim()),
  async fetch(personId: string, url: string): Promise<Source | null> {
    const normUrl = normalizeInstagramUrl(url);
    const rawText = await fetchPublicText(normUrl);
    return rawText ? { personId, sourceType: "instagram", url: normUrl, rawText, extractedAt: new Date().toISOString() } : null;
  },
};
