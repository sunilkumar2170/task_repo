import Link from "next/link";
import Avatar from "@/components/Avatar";
import Chips from "@/components/Chips";
import { agents, ranking } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function People() {
  const all = await agents();
  const cards = await Promise.all(all.map(async (a) => ({ a, top: (await ranking(a.person.id))[0] })));
  return (
    <>
      <h2>{all.length} people</h2>
      <div className="grid">
        {cards.map(({ a, top }) => (
          <Link href={`/people/${a.person.id}`} key={a.person.id} className="glass">
            <div className="row"><Avatar name={a.person.name} /><div><h3>{a.person.name}</h3>{a.person.sample && <span className="badge">Sample record</span>}</div></div>
            <p className="mute small">{a.profile.profession}</p>
            <Chips items={a.profile.interests.slice(0, 3)} />
            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
              {top ? <span className="badge">Best match {top.match.score}%</span> : <span />}<span className="small">View profile</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
