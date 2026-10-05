"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Match, Turn } from "@/lib/types";

type P = { id: string; name: string };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DateArena({ people, a0, b0, auto }: { people: P[]; a0: string; b0: string; auto: boolean }) {
  const [a, setA] = useState(a0), [b, setB] = useState(b0);
  const [turns, setTurns] = useState<Turn[]>([]), [thinking, setThinking] = useState<"A" | "B" | null>(null);
  const [match, setMatch] = useState<Match | null>(null), [shown, setShown] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const started = useRef(false);
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "";

  async function start() {
    if (a === b) { setErr("Pick two different people."); return; }
    setErr(""); setBusy(true); setTurns([]); setMatch(null); setShown(0); setThinking("A");
    try {
      const r = await fetch("/api/date", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a, b }) });
      const m: Match = await r.json();
      if (!r.ok) throw new Error((m as unknown as { error: string }).error);
      for (const t of m.conversation) { setThinking(t.speaker); await sleep(900); setTurns((x) => [...x, t]); }
      setThinking(null); setMatch(m);
      for (let i = 0; i <= m.score; i += 3) { setShown(i); await sleep(30); }
      setShown(m.score);
    } catch (e) { setErr((e as Error).message); setThinking(null); }
    setBusy(false);
  }
  useEffect(() => { if (auto && !started.current) { started.current = true; start(); } }); // eslint-disable-line

  const sel = (v: string, set: (s: string) => void, l: string) => (
    <div><label>{l}</label><select value={v} onChange={(e) => set(e.target.value)}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
  );
  return (
    <div>
      <div className="glass two">{sel(a, setA, "Person A")}{sel(b, setB, "Person B")}</div>
      <div className="row" style={{ margin: "16px 0" }}><button className="btn" disabled={busy} onClick={start}>{busy ? "Date in progress…" : "Start date"}</button>{err && <span className="err" role="alert">{err}</span>}</div>
      <div className="arena" aria-live="polite">
        {turns.map((t, i) => (
          <motion.div key={i} className={`bubble ${t.speaker}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="who">{name(t.speaker === "A" ? a : b)}&apos;s agent</div>{t.text}
          </motion.div>
        ))}
        {thinking && <div className={`bubble ${thinking}`}><div className="who">{name(thinking === "A" ? a : b)}&apos;s agent is thinking</div><span className="dots"><span /><span /><span /></span></div>}
      </div>
      {match && (
        <motion.div className="glass" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div><div className="mute small">Compatibility</div><div className="score">{shown}%</div></div>
            <div className="mute" style={{ maxWidth: 340 }}>Verdict: {match.score >= 75 ? "Strong match. Worth a real conversation." : match.score >= 62 ? "Promising, with a few things to explore." : "Different worlds. Could still surprise each other."}</div>
          </div>
          <div className="meter" style={{ margin: "14px 0" }}><i style={{ width: `${shown}%` }} /></div>
          <div className="two">
            <div><h3>Why they match</h3>{match.reasons.map((x) => <p key={x} className="ok">✓ {x}</p>)}</div>
            <div><h3>Strengths and concerns</h3>{match.strengths.map((x) => <p key={x}>★ {x}</p>)}{match.concerns.map((x) => <p key={x} style={{ color: "var(--amber)" }}>⚠ {x}</p>)}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
