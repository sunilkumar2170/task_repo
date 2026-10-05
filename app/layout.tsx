import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
export const metadata = { title: "Agentic Dating", description: "Agents date. Humans choose." };
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en"><body>
      <div className="wrap">
        <nav><Link href="/" className="brand">Agentic Dating</Link>
          <Link href="/people">People</Link><Link href="/dates">Agent dates</Link><Link href="/matches">Rankings</Link><Link href="/add-person">Add a person</Link><Link href="/demo">Demo</Link></nav>
        <main>{children}</main>
      </div>
    </body></html>
  );
}
