import { PHYS, TRACK, VIEW, fmtPrice, hexToRgba } from './config.js';
import { Track } from './terrain.js';
import { Bike } from './bike.js';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });

export class Game {
  constructor(canvas, hud, onEnd) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;          // { dist, price, week, score, progress }
    this.onEnd = onEnd;      // (result) => void
    this.state = 'idle';
    this.inp = { gas: false, brake: false };
    this.bike = new Bike();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = VIEW.W * this.dpr;
    canvas.height = VIEW.H * this.dpr;
    this.toast = { text: '', until: 0 };
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  }

  start(coin, points) {
    this.coin = coin;
    this.track = new Track(points);
    this.bike.reset(120, this.track);
    this.dist = 0;
    this.flipPts = 0;
    this.camX = 0; this.camY = 0;
    this.startTime = performance.now();
    this.state = 'play';
  }

  stop() { this.state = 'idle'; }

  frame(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    if (this.state === 'play') { this.step(dt); this.render(); }
    requestAnimationFrame(tt => this.frame(tt));
  }

  step(dt) {
    const ev = this.bike.step(dt, this.inp, this.track);

    if (ev.flips > 0) {
      const pts = ev.flips * 500;
      this.flipPts += pts;
      this.showToast(`${ev.flips > 1 ? ev.flips + 'x ' : ''}${ev.backflip ? 'BACKFLIP' : 'FRONTFLIP'}! +${pts}`);
    }

    this.dist = Math.max(this.dist, Math.floor((this.bike.x - 120) / TRACK.PX_PER_M));
    const score = this.dist + this.flipPts;
    const prog = Math.min(100, (this.bike.x / this.track.length) * 100);

    this.hud.dist.textContent = `${this.dist} m`;
    this.hud.price.textContent = fmtPrice(this.track.priceAt(this.bike.x));
    this.hud.week.textContent = dateFmt.format(this.track.dateAt(this.bike.x));
    this.hud.score.textContent = score.toLocaleString('en-US');
    this.hud.progress.style.width = prog.toFixed(1) + '%';

    if (ev.crash) {
      this.state = 'over';
      this.render();
      this.onEnd({ win: false, score, dist: this.dist, flipPts: this.flipPts, progress: prog });
      return;
    }
    if (this.bike.x >= this.track.length - 30) {
      this.state = 'over';
      this.render();
      this.onEnd({
        win: true, score, dist: this.dist, flipPts: this.flipPts, progress: 100,
        ret: this.track.totalReturn(),
        time: (performance.now() - this.startTime) / 1000,
      });
      return;
    }

    this.camX = Math.max(0, Math.min(this.bike.x - 230, this.track.length - VIEW.W + 60));
    this.camY = Math.min(0, this.bike.y - 130);
  }

  showToast(text) { this.toast = { text, until: performance.now() + 1000 }; }

  render() {
    const { ctx, track, camX, camY } = this;
    const accent = this.coin.color;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW.W, VIEW.H);
    ctx.save();
    ctx.translate(-camX, -camY);

    const i0 = Math.max(0, Math.floor(camX / track.SEG) - 1);
    const i1 = Math.min(track.h.length - 1, Math.floor((camX + VIEW.W) / track.SEG) + 1);

    // grid vertical: 1 linha por semana, label de data a cada 8 semanas
    ctx.lineWidth = 1;
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = i0; i <= i1; i++) {
      const x = i * track.SEG;
      ctx.strokeStyle = 'rgba(140,160,180,0.07)';
      ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + VIEW.H); ctx.stroke();
      if (i % 8 === 0) {
        ctx.fillStyle = 'rgba(140,160,180,0.45)';
        ctx.fillText(dateFmt.format(new Date(track.points[i].t)), x, camY + VIEW.H - 10);
      }
    }
    // grid horizontal
    ctx.strokeStyle = 'rgba(140,160,180,0.05)';
    for (let y = 60; y < VIEW.H; y += 60) {
      ctx.beginPath(); ctx.moveTo(camX, y + camY); ctx.lineTo(camX + VIEW.W, y + camY); ctx.stroke();
    }

    // linha do gráfico = chão (área preenchida + traço na cor da moeda + pontos semanais)
    const xa = camX - 12, xb = camX + VIEW.W + 12;
    ctx.beginPath();
    ctx.moveTo(xa, camY + VIEW.H + 30);
    for (let x = xa; x <= xb; x += 6) ctx.lineTo(x, track.ground(x));
    ctx.lineTo(xb, camY + VIEW.H + 30);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(accent, 0.08);
    ctx.fill();

    ctx.beginPath();
    for (let x = xa; x <= xb; x += 6) {
      x === xa ? ctx.moveTo(x, track.ground(x)) : ctx.lineTo(x, track.ground(x));
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = accent;
    for (let i = Math.max(0, i0); i <= i1 && i < track.h.length; i++) {
      ctx.beginPath(); ctx.arc(i * track.SEG, track.h[i], 2.5, 0, 7); ctx.fill();
    }

    this.drawFinish(ctx, track);
    this.bike.draw(ctx, accent);
    ctx.restore();

    // toast de manobra
    if (performance.now() < this.toast.until) {
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '700 26px "Saira Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.toast.text, VIEW.W / 2, 110);
    }
  }

  drawFinish(ctx, track) {
    const fx = track.length;
    const fy = track.ground(fx);
    ctx.strokeStyle = '#93A3B3'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 78); ctx.stroke();
    const s = 7;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#E8EDF2' : '#1A222C';
        ctx.fillRect(fx + c * s, fy - 78 + r * s, s, s);
      }
    }
    ctx.fillStyle = 'rgba(232,237,242,0.6)';
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOJE', fx + 14, fy - 88);
  }
}

// Input compartilhado (teclado + botões de toque)
export function bindInput(game, gasBtn, brakeBtn) {
  const GAS = ['ArrowRight', 'ArrowUp', 'Space', 'KeyD', 'KeyW'];
  const BRK = ['ArrowLeft', 'KeyA', 'KeyS'];
  window.addEventListener('keydown', e => {
    if (GAS.includes(e.code)) { game.inp.gas = true; e.preventDefault(); }
    if (BRK.includes(e.code)) { game.inp.brake = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    if (GAS.includes(e.code)) game.inp.gas = false;
    if (BRK.includes(e.code)) game.inp.brake = false;
  });
  const bind = (el, key) => {
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      game.inp[key] = true;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      el.addEventListener(ev, () => (game.inp[key] = false)));
  };
  bind(gasBtn, 'gas');
  bind(brakeBtn, 'brake');
}
