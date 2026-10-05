import { NextResponse } from "next/server";
import { ranking } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: { personId: string } }) {
  const r = await ranking(params.personId);
  return r.length ? NextResponse.json(r.map((x, i) => ({ rank: i + 1, id: x.agent.person.id, person: x.agent.person.name, score: x.match.score, reasons: x.match.reasons, strengths: x.match.strengths, concerns: x.match.concerns }))) : NextResponse.json({ error: "Person not found" }, { status: 404 });
}
