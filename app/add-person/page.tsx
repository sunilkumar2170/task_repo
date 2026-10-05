"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const STEPS = ["LinkedIn analyzed", "Instagram analyzed", "Profile generated", "Agent created", "Matches calculated"];
export default function AddPerson() {
  const r = useRouter();
  const [f, setF] = useState({ linkedinUrl: "", instagramUrl: "", linkedinText: "", instagramText: "" });
  const [done, setDone] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  async function go() {
    setErr(""); setDone(0); setBusy(true);
    const tick = setInterval(() => setDone((d) => Math.min(d + 1, 3)), 900);
    const res = await fetch("/api/person/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await res.json(); clearInterval(tick);
    if (!res.ok) { setErr(j.error || "Something went wrong."); setBusy(false); setDone(0); return; }
    setDone(5); setTimeout(() => r.push(`/people/${j.id}`), 700);
  }
  return (
    <div style={{ maxWidth: 620 }}>
      <h2>Add a person</h2>
      <p className="mute">Paste the person&apos;s official LinkedIn and public Instagram links. Only people who agree to be included should be added.</p>
      <div className="glass">
        <label htmlFor="li">LinkedIn URL</label><input id="li" placeholder="https://www.linkedin.com/in/username" value={f.linkedinUrl} onChange={set("linkedinUrl")} />
        <label htmlFor="ig">Instagram URL (public profile)</label><input id="ig" placeholder="https://www.instagram.com/username" value={f.instagramUrl} onChange={set("instagramUrl")} />
        <details style={{ marginTop: 12 }}><summary className="mute small">If a platform blocks reading, paste the visible public text instead (optional)</summary>
          <label htmlFor="lt">LinkedIn public text</label><textarea id="lt" rows={3} value={f.linkedinText} onChange={set("linkedinText")} />
          <label htmlFor="it">Instagram public bio and captions</label><textarea id="it" rows={3} value={f.instagramText} onChange={set("instagramText")} /></details>
        <div className="row" style={{ marginTop: 16 }}><button className="btn" disabled={busy} onClick={go}>{busy ? "Creating agent…" : "Create agent"}</button></div>
        {err && <p className="err" role="alert">{err}</p>}
        {busy && <div style={{ marginTop: 14 }}>{STEPS.map((s, i) => <div key={s} className={i < done ? "ok" : "mute"}>{i < done ? "✓" : "○"} {s}</div>)}</div>}
      </div>
    </div>
  );
}
