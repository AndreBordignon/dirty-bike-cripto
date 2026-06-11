import { COINS } from './config.js';
import { loadWeekly, synthetic } from './api.js';
import { buildMenu } from './menu.js';
import { Game, bindInput } from './game.js';

const $ = id => document.getElementById(id);
const screens = { menu: $('screen-menu'), game: $('screen-game') };

const hud = {
  dist: $('hud-dist'),
  price: $('hud-price'),
  week: $('hud-week'),
  score: $('hud-score'),
  progress: $('hud-progress'),
};

let sessionBest = 0;
let current = null;

const game = new Game($('game-canvas'), hud, onEnd);
bindInput(game, $('btn-gas'), $('btn-brake'));

buildMenu($('coin-list'), COINS, pick);

async function pick(coin) {
  current = coin;
  $('overlay').hidden = true;
  show('game');
  $('hud-coin').textContent = `${coin.id}/USDT`;
  $('hud-coin').style.color = coin.color;
  $('offline-badge').hidden = true;
  let points;
  try {
    points = await loadWeekly(coin.symbol);
  } catch {
    points = synthetic();
    $('offline-badge').hidden = false;
  }
  game.start(coin, points);
}

function onEnd(r) {
  sessionBest = Math.max(sessionBest, r.score);
  $('overlay-title').textContent = r.win ? 'Surfou o gráfico inteiro!' : 'Quebrou!';
  const lines = [
    `${r.dist.toLocaleString('pt-BR')} m · ${r.flipPts} pts de manobra`,
    r.win
      ? `${current.id} fez ${r.ret >= 0 ? '+' : ''}${Math.round(r.ret).toLocaleString('pt-BR')}% no período · sua corrida: ${Math.round(r.time)}s`
      : `${r.progress.toFixed(1)}% do gráfico percorrido`,
    `pontuação: ${r.score.toLocaleString('en-US')} · recorde da sessão: ${sessionBest.toLocaleString('en-US')}`,
  ];
  $('overlay-stats').innerHTML = lines.map(l => `<span>${l}</span>`).join('');
  $('overlay').hidden = false;
}

$('btn-retry').addEventListener('click', () => pick(current));
$('btn-menu').addEventListener('click', () => {
  $('overlay').hidden = true;
  game.stop();
  show('menu');
});

function show(name) {
  for (const k in screens) screens[k].hidden = k !== name;
}
