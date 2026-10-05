import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Chips from "@/components/Chips";
import { getAgent, ranking } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Profile({ params }: { params: { id: string } }) {
  const a = await getAgent(params.id);
  if (!a) notFound();

  const p = a.profile;
  const top = (await ranking(a.person.id)).slice(0, 5);

  const liSrc = a.person.sources.find((s) => s.sourceType === "linkedin")?.rawText ?? "";
  const igSrc = a.person.sources.find((s) => s.sourceType === "instagram")?.rawText ?? "";

  const sec = (t: string, items: string[]) => (
    <div>
      <h3>{t}</h3>
      <p>
        <Chips items={items} />
      </p>
    </div>
  );

  return (
    <>
      <div className="row">
        <Avatar name={a.person.name} size={80} />
        <div>
          <h1 style={{ fontSize: "2.6rem" }}>{a.person.name}</h1>
          <p className="mute" style={{ margin: 0 }}>{p.profession}</p>
        </div>
      </div>

      <div className="glass" style={{ margin: "22px 0" }}>
        <h2>Sources</h2>
        <div className="row">
          <a className="btn ghost" href={a.person.linkedinUrl} target="_blank" rel="noreferrer">
            Open LinkedIn
          </a>
          <a className="btn ghost" href={a.person.instagramUrl} target="_blank" rel="noreferrer">
            Open Instagram
          </a>
        </div>
        <p className="mute small">The agent read only these two official public sources.</p>
      </div>

      <div className="glass">
        <h2>Agent analysis</h2>
        <p>{p.summary}</p>

        {/* Evidence Line */}
        <details style={{ margin: "14px 0", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <summary className="mute small" style={{ cursor: "pointer", fontWeight: 600 }}>
            🔍 Evidence: View raw source text read by agent (LinkedIn & Instagram)
          </summary>
          <div style={{ marginTop: 10, fontSize: "0.85rem", color: "var(--fg-muted)" }}>
            <p><strong>LinkedIn source snippet (first 200 chars):</strong></p>
            <blockquote style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 4, fontFamily: "monospace" }}>
              {liSrc.slice(0, 200) || "No raw text available."}…
            </blockquote>
            <p style={{ marginTop: 8 }}><strong>Instagram source snippet (first 200 chars):</strong></p>
            <blockquote style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 4, fontFamily: "monospace" }}>
              {igSrc.slice(0, 200) || "No raw text available."}…
            </blockquote>
          </div>
        </details>

        <div className="two">
          {sec("Interests", p.interests)}
          {sec("Hobbies", p.hobbies)}
          {sec("Personality", p.personalityTraits)}
          {sec("Values", p.values.length ? p.values : ["unknown"])}
          {sec("Lifestyle", p.lifestyle)}
          {sec("Conversation topics", p.conversationTopics)}
          {sec("Relationship needs", p.relationshipNeeds)}
          {sec("Compatibility signals", p.compatibilitySignals)}
        </div>
        <p className="mute small">Dealbreakers: {p.dealbreakers.join("; ")}. Confidence {Math.round(p.confidence * 100)}%.</p>
      </div>

      <div className="glass" style={{ margin: "22px 0" }}>
        <h2>Top matches</h2>
        <table>
          <tbody>
            {top.map((m, i) => (
              <tr key={m.agent.person.id} style={i < 3 ? { fontWeight: "bold", background: "rgba(255,255,255,0.02)" } : {}}>
                <td>{i + 1}</td>
                <td>
                  <Link href={`/people/${m.agent.person.id}`}>{m.agent.person.name}</Link>
                  <div className="mute small">{m.match.reasons[0]}</div>
                </td>
                <td><b>{m.match.score}%</b></td>
                <td>
                  <Link className="btn ghost small" href={`/dates?a=${a.person.id}&b=${m.agent.person.id}&auto=1`}>
                    Watch date
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {top[0] && (
        <Link className="btn" href={`/dates?a=${a.person.id}&b=${top[0].agent.person.id}&auto=1`}>
          Replay top match date
        </Link>
      )}
    </>
  );
}
