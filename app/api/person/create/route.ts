import { NextResponse } from "next/server";
import { z } from "zod";
import { collectSources } from "@/lib/scraper";
import { normalizeLinkedInUrl } from "@/lib/scraper/linkedin";
import { normalizeInstagramUrl } from "@/lib/scraper/instagram";
import { addPerson, agents } from "@/lib/store";

export const dynamic = "force-dynamic";

const Body = z.object({
  linkedinUrl: z.string().min(1),
  instagramUrl: z.string().min(1),
  linkedinText: z.string().optional(),
  instagramText: z.string().optional(),
});

const title = (s: string) => s.replace(/[-_.]+/g, " ").replace(/\d+$/, "").trim().replace(/\b\w/g, (c) => c.toUpperCase());

export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "Enter both a LinkedIn URL and an Instagram URL." }, { status: 400 });

  const rawLi = b.data.linkedinUrl.trim();
  const rawIg = b.data.instagramUrl.trim();
  const normLi = normalizeLinkedInUrl(rawLi);
  const normIg = normalizeInstagramUrl(rawIg);

  const id = `user-${Date.now()}`;
  try {
    const sources = await collectSources(id, normLi, normIg, b.data);
    const li = sources[0].rawText.split("\n")[0].split(/ [-–|] /)[0].trim();
    const slug = normLi.match(/\/in\/([^/?#]+)/)?.[1] ?? "New person";
    const name = li && li.length < 40 && !/linkedin/i.test(li) ? li : title(slug);

    if ((await agents()).some((a) => a.person.linkedinUrl === normLi)) {
      return NextResponse.json({ error: "This person is already added." }, { status: 409 });
    }

    const agent = await addPerson({ id, name, linkedinUrl: normLi, instagramUrl: normIg, sources });
    return NextResponse.json({ id: agent.person.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
