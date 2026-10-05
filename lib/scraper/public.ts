/** Safe public-page extraction. No login, no CAPTCHA/auth bypass, no stealth. Returns null if the platform blocks us. */
const dyn = new Function("m", "return import(m)") as (m: string) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function viaPlaywright(url: string): Promise<string | null> {
  try {
    const { chromium } = await dyn("playwright");
    const b = await chromium.launch();
    const pg = await b.newPage();
    await pg.goto(url, { timeout: 15000, waitUntil: "domcontentloaded" });
    const t: string = await pg.evaluate(() => [document.title, ...Array.from(document.querySelectorAll('meta[name="description"],meta[property="og:description"]')).map((m) => m.getAttribute("content"))].join("\n") + "\n" + document.body.innerText.slice(0, 4000));
    await b.close();
    return t;
  } catch { return null; }
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#064;/g, "@");
function meta(h: string) {
  const out = new Set<string>();
  const t = h.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]; if (t) out.add(t);
  for (const m of Array.from(h.matchAll(/<meta[^>]+(?:property|name)="(?:og:title|og:description|description)"[^>]+content="([^"]*)"/gi))) out.add(m[1]);
  return decode(Array.from(out).join("\n")).trim();
}

export async function fetchPublicText(url: string): Promise<string | null> {
  let text: string | null = null;
  if (process.env.USE_PLAYWRIGHT === "1") text = await viaPlaywright(url);
  if (!text) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; AgenticDatingBot/1.0)", "accept-language": "en" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
      if (!r.ok || /authwall|login|challenge/.test(r.url)) return null;
      text = meta(await r.text());
    } catch { return null; }
  }
  return text && text.length > 40 && !/^(sign in|log in|instagram$)/i.test(text) ? text : null;
}
