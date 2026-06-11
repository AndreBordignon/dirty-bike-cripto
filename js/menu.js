import { fmtPrice, TRACK } from './config.js';
import { loadWeekly } from './api.js';

// Menu estilo watchlist: o sparkline de cada moeda é o preview literal da pista.
export function buildMenu(listEl, coins, onPick) {
  for (const coin of coins) {
    const row = document.createElement('button');
    row.className = 'coin-row';
    row.style.setProperty('--accent', coin.color);
    row.innerHTML = `
      <span class="coin-badge">${coin.id}</span>
      <span class="coin-names">
        <span class="coin-name">${coin.name}</span>
        <span class="coin-pair">${coin.id}/USDT · 1w</span>
      </span>
      <canvas class="spark" width="140" height="40"></canvas>
      <span class="coin-stats">
        <span class="coin-price">—</span>
        <span class="coin-meta">carregando…</span>
      </span>`;
    row.addEventListener('click', () => onPick(coin));
    listEl.appendChild(row);
    hydrate(row, coin);
  }
}

async function hydrate(row, coin) {
  const priceEl = row.querySelector('.coin-price');
  const metaEl = row.querySelector('.coin-meta');
  try {
    const pts = await loadWeekly(coin.symbol);
    const closes = pts.map(p => p.close);
    const last = closes[closes.length - 1];
    const ret = (last / closes[0] - 1) * 100;
    const meters = Math.round(((pts.length - 1) * TRACK.SEG) / TRACK.PX_PER_M);

    priceEl.textContent = fmtPrice(last);
    metaEl.textContent = `pista ${meters.toLocaleString('pt-BR')} m · ${ret >= 0 ? '+' : ''}${Math.round(ret).toLocaleString('pt-BR')}%`;
    metaEl.classList.add(ret >= 0 ? 'up' : 'down');
    drawSpark(row.querySelector('.spark'), closes, coin.color);
  } catch {
    priceEl.textContent = 'offline';
    metaEl.textContent = 'pista simulada disponível';
    row.classList.add('offline');
  }
}

function drawSpark(cv, closes, color) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  // amostra ~70 pontos para o preview
  const step = Math.max(1, Math.floor(closes.length / 70));
  const pts = closes.filter((_, i) => i % step === 0);
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - 4 - ((p - min) / span) * (H - 8);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}
