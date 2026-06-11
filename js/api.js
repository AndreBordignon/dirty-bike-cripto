const cache = new Map();

// Klines semanais da Binance (endpoint público, sem autenticação, CORS liberado)
export async function loadWeekly(symbol, limit = 500) {
  if (cache.has(symbol)) return cache.get(symbol);
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1w&limit=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const raw = await res.json();
  const points = raw.map(k => ({ t: k[0], close: +k[4] }));
  if (points.length < 12) throw new Error('histórico insuficiente');
  cache.set(symbol, points);
  return points;
}

// Pista simulada para modo offline (random walk com regimes de volatilidade)
export function synthetic(weeks = 260, startPrice = 100) {
  const points = [];
  let price = startPrice;
  let vol = 0.06;
  let t = Date.now() - weeks * 7 * 864e5;
  for (let i = 0; i < weeks; i++) {
    points.push({ t, close: price });
    vol = Math.max(0.03, Math.min(0.16, vol + (Math.random() - 0.5) * 0.03));
    price = Math.max(0.01, price * Math.exp((Math.random() * 2 - 1) * vol + 0.004));
    t += 7 * 864e5;
  }
  return points;
}
