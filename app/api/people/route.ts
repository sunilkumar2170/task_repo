import { NextResponse } from "next/server";
import { agents, summary } from "@/lib/store";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json((await agents()).map(summary)); }
