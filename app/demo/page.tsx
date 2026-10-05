import Link from "next/link";
import { agents } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Demo() {
  const n = (await agents()).length;
  return (
    <section className="hero">
      <h1>{n} agents are ready.</h1>
      <p>Every profile, date and ranking is already computed from each person&apos;s LinkedIn and public Instagram. No setup or API key needed.</p>
      <div className="row"><Link className="btn" href="/people">View profiles</Link><Link className="btn ghost" href="/dates">Watch agent dates</Link><Link className="btn ghost" href="/matches">View rankings</Link></div>
    </section>
  );
}
