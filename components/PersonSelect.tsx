"use client";
import { useRouter } from "next/navigation";
export default function PersonSelect({ people, value }: { people: { id: string; name: string }[]; value: string }) {
  const r = useRouter();
  return (
    <select aria-label="Select person" value={value} onChange={(e) => r.push(`/matches?p=${e.target.value}`)}>
      {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}
