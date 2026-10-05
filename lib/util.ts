export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const norm = (a: string[]) => a.map((x) => x.toLowerCase().trim()).filter((x) => x && !x.startsWith("unknown"));
export const inter = (a: string[], b: string[]) => { const B = norm(b); return a.filter((x) => B.includes(x.toLowerCase().trim()) && !x.toLowerCase().startsWith("unknown")); };
export const jac = (a: string[], b: string[]) => { const A = new Set(norm(a)), B = new Set(norm(b)); if (!A.size || !B.size) return 0; let i = 0; A.forEach((x) => { if (B.has(x)) i++; }); return i / (A.size + B.size - i); };
export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export const pick = (a: string[], i = 0, d = "unknown") => a[i] ?? a[0] ?? d;
export const initials = (n: string) => n.replace(/^Sample:\s*/, "").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
