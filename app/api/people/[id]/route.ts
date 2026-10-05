import { NextResponse } from "next/server";
import { getAgent } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await getAgent(params.id);
  return a ? NextResponse.json({ person: a.person, profile: a.profile }) : NextResponse.json({ error: "Person not found" }, { status: 404 });
}
