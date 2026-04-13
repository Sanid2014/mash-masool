// Vercel Serverless Function — تجلب سعر الذهب من الخادم بدون مشاكل CORS
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  let ozUSD = null;

  // المصدر الأول: Swissquote — سعر فوري حقيقي
  try {
    const r = await fetch(
      "https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (r.ok) {
      const j = await r.json();
      const bid = j?.[0]?.spreadProfilePrices?.[0]?.bid;
      if (bid && Number(bid) > 500) ozUSD = Number(bid);
    }
  } catch {}

  // المصدر الثاني: metals.live
  if (!ozUSD) {
    try {
      const r = await fetch("https://api.metals.live/v1/spot/gold");
      if (r.ok) {
        const j = await r.json();
        const raw = Array.isArray(j) ? j[0] : j;
        const usd = raw?.gold ?? raw?.price ?? raw?.ask;
        if (usd && Number(usd) > 500) ozUSD = Number(usd);
      }
    } catch {}
  }

  // المصدر الثالث: fawazahmed0
  if (!ozUSD) {
    try {
      const r = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json"
      );
      if (r.ok) {
        const j = await r.json();
        const usd = j?.xau?.usd;
        if (usd && Number(usd) > 500) ozUSD = Number(usd);
      }
    } catch {}
  }

  if (!ozUSD) {
    return res.status(502).json({ error: "failed to fetch gold price" });
  }

  const perGramUSD = ozUSD / 31.1035;
  const sarRate = 3.75;

  res.status(200).json({
    ozUSD: +ozUSD.toFixed(2),
    ozSAR: +(ozUSD * sarRate).toFixed(2),
    k24sar: +(perGramUSD * sarRate).toFixed(2),
    k22sar: +(perGramUSD * sarRate * (22 / 24)).toFixed(2),
    k21sar: +(perGramUSD * sarRate * (21 / 24)).toFixed(2),
    k18sar: +(perGramUSD * sarRate * (18 / 24)).toFixed(2),
  });
}
