import { hash, initials } from "@/lib/util";
export default function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const h = hash(name) % 360;
  return <div className="avatar" aria-hidden style={{ width: size, height: size, fontSize: size / 2.6, background: `linear-gradient(135deg,hsl(${h} 70% 72%),hsl(${(h + 50) % 360} 75% 68%))` }}>{initials(name)}</div>;
}
