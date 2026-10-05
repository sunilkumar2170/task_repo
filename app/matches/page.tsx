import Link from "next/link";
import PersonSelect from "@/components/PersonSelect";
import { agents, ranking } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Matches({ searchParams }: { searchParams: { p?: string } }) {
  const all = await agents();
  const cur = all.find((x) => x.person.id === searchParams.p) ?? all[0];
  const rows = cur ? await ranking(cur.person.id) : [];

  return (
    <>
      <h2>Who fits whom?</h2>
      <div style={{ maxWidth: 380, marginBottom: 18 }}>
        <PersonSelect people={all.map((x) => ({ id: x.person.id, name: x.person.name }))} value={cur?.person.id ?? ""} />
      </div>
      <div className="glass" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Person</th>
              <th>Score</th>
              <th>Main reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isTop3 = i < 3;
              return (
                <tr
                  key={r.agent.person.id}
                  style={
                    isTop3
                      ? {
                          fontWeight: 600,
                          background: "rgba(255, 255, 255, 0.04)",
                          borderLeft: "3px solid var(--accent, #6366f1)",
                        }
                      : {}
                  }
                >
                  <td>
                    {isTop3 ? <span className="badge">#{i + 1}</span> : `#${i + 1}`}
                  </td>
                  <td>
                    <Link href={`/people/${r.agent.person.id}`}>
                      <b>{r.agent.person.name}</b>
                    </Link>
                  </td>
                  <td>
                    <b>{r.match.score}%</b>
                    <div className="meter" style={{ width: 80 }}>
                      <i style={{ width: `${r.match.score}%` }} />
                    </div>
                  </td>
                  <td className="mute small">{r.match.reasons[0]}</td>
                  <td>
                    <Link className="btn ghost small" href={`/dates?a=${cur.person.id}&b=${r.agent.person.id}&auto=1`}>
                      Watch date
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mute small">Click &quot;Watch date&quot; or a person&apos;s name to replay their date and open their profile.</p>
    </>
  );
}
