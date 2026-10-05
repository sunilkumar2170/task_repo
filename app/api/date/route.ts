import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store";
import { runDate } from "@/lib/matching/datingEngine";
import datesJson from "@/data/dates.json";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

const cachedDates: Record<string, Match> = datesJson as unknown as Record<string, Match>;

export async function POST(req: Request) {
  const { a, b } = await req.json().catch(() => ({}));
  const [x, y] = [await getAgent(a), await getAgent(b)];
  if (!x || !y || x === y) return NextResponse.json({ error: "Pick two different people." }, { status: 400 });

  const k1 = `${a}|${b}`;
  const k2 = `${b}|${a}`;
  const precomputed = cachedDates[k1] || cachedDates[k2];

  if (precomputed && precomputed.conversation && precomputed.conversation.length > 0) {
    return NextResponse.json(precomputed);
  }

  return NextResponse.json(await runDate(x, y));
}
