import { NextResponse } from "next/server";
import { ranking } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const { personId } = await req.json().catch(() => ({}));
  const r = await ranking(personId);
  return r.length ? NextResponse.json(r.slice(0, 5).map((x) => ({ person: x.agent.person.name, ...x.match }))) : NextResponse.json({ error: "Person not found" }, { status: 404 });
}
