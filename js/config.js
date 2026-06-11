export const COINS = [
  { id: 'BTC',  symbol: 'BTCUSDT',  name: 'Bitcoin',   color: '#F7931A' },
  { id: 'ETH',  symbol: 'ETHUSDT',  name: 'Ethereum',  color: '#9A8CF2' },
  { id: 'SOL',  symbol: 'SOLUSDT',  name: 'Solana',    color: '#14F195' },
  { id: 'BNB',  symbol: 'BNBUSDT',  name: 'BNB',       color: '#F3BA2F' },
  { id: 'XRP',  symbol: 'XRPUSDT',  name: 'XRP',       color: '#4FA8E0' },
  { id: 'DOGE', symbol: 'DOGEUSDT', name: 'Dogecoin',  color: '#C2A633' },
  { id: 'ADA',  symbol: 'ADAUSDT',  name: 'Cardano',   color: '#3468D1' },
  { id: 'LINK', symbol: 'LINKUSDT', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'AVAX', symbol: 'AVAXUSDT', name: 'Avalanche', color: '#E84142' },
  { id: 'PEPE', symbol: 'PEPEUSDT', name: 'Pepe',      color: '#57A639' },
];

export const PHYS = {
  G: 900,        // gravidade px/s²
  ACC: 760,       // aceleração no chão
  BRAKE: 1150,    // força de freio
  DRAG: 0.22,     // arrasto proporcional
  LEAN_BACK: 11,  // accel angular do freio no ar (backflip)
  LEAN_FWD: 8,    // accel angular do gás no ar (frontflip)
  VA_MAX: 7.5,    // velocidade angular máxima
  CRASH_ANGLE: 1.5, // diferença máxima de ângulo na aterrissagem (rad)
};

export const TRACK = {
  SEG: 90,          // px por semana (1 candle semanal = 1 segmento)
  H_START: 255,     // altura inicial do terreno
  H_MIN: 105,       // teto do terreno (preço alto)
  H_MAX: 340,       // piso do terreno (preço baixo)
  LOG_CLAMP: 0.18,  // clamp do log-retorno semanal
  LOG_SCALE: 260,   // px por unidade de log-retorno
  PX_PER_M: 40,     // conversão px -> metros de jogo
};

export const VIEW = { W: 960, H: 480 };

export function fmtPrice(p) {
  if (p >= 1000) return '$' + Math.round(p).toLocaleString('en-US');
  if (p >= 1) return '$' + p.toFixed(2);
  return '$' + Number(p.toPrecision(3));
}

export function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
