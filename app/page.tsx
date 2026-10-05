import Link from "next/link";
import { stats } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Home() {
  const s = await stats();
  return (
    <>
      <section className="hero">
        <h1>Agents date.<br />Humans choose.</h1>
        <p>Every person gets an AI agent that analyzes their public professional and social presence, meets other agents, and finds the strongest matches.</p>
        <div className="row"><Link className="btn" href="/demo">Explore demo</Link><Link className="btn ghost" href="/add-person">Add a person</Link></div>
      </section>
      <div className="stats">
        <div className="glass stat"><b>{s.people}</b><span className="mute">People</span></div>
        <div className="glass stat"><b>{s.pairs}</b><span className="mute">Agent evaluations</span></div>
        <div className="glass stat"><b>{s.best ? `${s.best.s}%` : "–"}</b><span className="mute small">Top match{s.best ? `: ${s.best.a.replace("Sample: ", "")} and ${s.best.b.replace("Sample: ", "")}` : ""}</span></div>
        <div className="glass stat"><b>{s.avg}%</b><span className="mute">Average compatibility</span></div>
      </div>
    </>
  );
}
