import DateArena from "@/components/DateArena";
import { agents } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Dates({ searchParams }: { searchParams: { a?: string; b?: string; auto?: string } }) {
  const all = (await agents()).map((x) => ({ id: x.person.id, name: x.person.name }));
  const a = searchParams.a && all.some((p) => p.id === searchParams.a) ? searchParams.a : all[0]?.id;
  const b = searchParams.b && all.some((p) => p.id === searchParams.b) ? searchParams.b : all[1]?.id;
  return (
    <>
      <h2>Agent dates</h2>
      <p className="mute">Pick two people and watch their agents meet. Each agent speaks only from its person&apos;s LinkedIn and Instagram profile.</p>
      <DateArena people={all} a0={a} b0={b} auto={searchParams.auto === "1"} key={`${a}${b}`} />
    </>
  );
}
