import { NextResponse } from "next/server";
import { z } from "zod";
import { collectSources } from "@/lib/scraper";
import { analyzePerson } from "@/lib/ai/analyzePerson";
export const dynamic = "force-dynamic";
const Body = z.object({ linkedinUrl: z.string(), instagramUrl: z.string(), linkedinText: z.string().optional(), instagramText: z.string().optional(), name: z.string().optional() });
export async function POST(req: Request) {
  const b = Body.safeParse(await req.json().catch(() => ({})));
  if (!b.success) return NextResponse.json({ error: "linkedinUrl and instagramUrl are required" }, { status: 400 });
  try {
    const sources = await collectSources("tmp", b.data.linkedinUrl, b.data.instagramUrl, b.data);
    return NextResponse.json({ sources, profile: await analyzePerson(b.data.name || "Unknown", sources) });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 422 }); }
}
