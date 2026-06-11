import { PHYS } from './config.js';

const norm = a => Math.atan2(Math.sin(a), Math.cos(a));

export class Bike {
  reset(x, track) {
    this.x = x;
    this.y = track.ground(x) - 17;
    this.vx = 0; this.vy = 0;
    this.ang = 0; this.va = 0;
    this.rot = 0;
    this.grounded = true;
    this.wheelSpin = 0;
    this.crashed = false;
  }

  // Retorna eventos do frame: { crash, flips }
  step(dt, inp, track) {
    const ev = { crash: false, flips: 0 };
    if (this.crashed) return ev;

    this.vy += PHYS.G * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 40) { this.x = 40; this.vx = Math.max(0, this.vx); }

    const gy = track.ground(this.x);
    const slope = track.slope(this.x);

    if (this.y >= gy - 17) {
      const diff = norm(this.ang - slope);
      if (!this.grounded) {
        if (Math.abs(diff) > PHYS.CRASH_ANGLE) {
          this.crashed = true; ev.crash = true; return ev;
        }
        ev.flips = Math.floor(Math.abs(this.rot) / (Math.PI * 1.7));
        ev.backflip = this.rot < 0;
      }
      this.grounded = true;
      this.rot = 0;
      this.y = gy - 17;

      let spd = this.vx * Math.cos(slope) + this.vy * Math.sin(slope);
      if (inp.gas) spd += PHYS.ACC * dt;
      if (inp.brake) spd -= PHYS.BRAKE * dt;
      spd -= spd * PHYS.DRAG * dt;
      this.vx = spd * Math.cos(slope);
      this.vy = spd * Math.sin(slope);
      this.ang += norm(slope - this.ang) * Math.min(1, 14 * dt);
      this.va = 0;
      this.wheelSpin += (spd / 11) * dt;
    } else {
      this.grounded = false;
      if (inp.brake) this.va -= PHYS.LEAN_BACK * dt;
      else if (inp.gas) this.va += PHYS.LEAN_FWD * dt;
      else this.va *= Math.max(0, 1 - 2 * dt);
      this.va = Math.max(-PHYS.VA_MAX, Math.min(PHYS.VA_MAX, this.va));
      this.ang += this.va * dt;
      this.rot += this.va * dt;
      this.wheelSpin += (inp.gas ? 14 : this.va) * dt;
    }

    // Capacete abaixo do chão = crash imediato (pega aterrissagem de cabeça entre frames)
    const hx = this.x + Math.sin(this.ang) * 26;
    const hy = this.y - Math.cos(this.ang) * 26;
    if (hy > track.ground(hx) + 2) {
      this.crashed = true; ev.crash = true;
    }
    return ev;
  }

  draw(ctx, accent) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.ang);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.wheel(ctx, -17, 0);
    this.wheel(ctx, 17, 0);

    // balança traseira (swingarm)
    ctx.strokeStyle = '#5B6B7C'; ctx.lineWidth = 3.5;
    line(ctx, -4, -5, -17, 0);

    // garfo dianteiro (fork)
    ctx.strokeStyle = '#93A3B3'; ctx.lineWidth = 4;
    line(ctx, 12, -15, 17, 0);

    // motor + escapamento
    ctx.fillStyle = '#39434F';
    ctx.fillRect(-7, -9, 11, 7);
    ctx.strokeStyle = '#707F8F'; ctx.lineWidth = 3;
    line(ctx, -5, -6, -16, -8);

    // plásticos: rabeta levantada, banco e tanque (cor da moeda)
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-7, -12.5);
    ctx.lineTo(3, -15);
    ctx.lineTo(11, -13.5);
    ctx.lineTo(7, -8);
    ctx.lineTo(-6, -8.5);
    ctx.closePath();
    ctx.fill();

    // paralama dianteiro
    ctx.strokeStyle = accent; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(17, 0, 15.5, -2.55, -0.65);
    ctx.stroke();

    // guidão
    ctx.strokeStyle = '#93A3B3'; ctx.lineWidth = 3;
    line(ctx, 12, -15, 9, -21);
    line(ctx, 6.5, -21.5, 11.5, -20.5);

    // piloto: perna, tronco inclinado, braço
    ctx.strokeStyle = '#C7D1DB';
    ctx.lineWidth = 3.5;
    path(ctx, [[-6, -16], [2, -10], [0, -4]]);          // quadril > joelho > pedaleira
    ctx.lineWidth = 4.5;
    line(ctx, -6, -16, 2, -26);                          // tronco
    ctx.lineWidth = 3.5;
    path(ctx, [[2, -26], [7, -23], [9.5, -21]]);         // ombro > cotovelo > guidão

    // capacete com viseira na cor da moeda
    ctx.fillStyle = '#F2F5F8';
    ctx.beginPath(); ctx.arc(5, -29, 5.2, 0, 7); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    line(ctx, 8, -30.5, 10.8, -28.6);

    ctx.restore();
  }

  wheel(ctx, wx, wy) {
    ctx.strokeStyle = '#46535F'; ctx.lineWidth = 4.5;     // pneu
    ctx.beginPath(); ctx.arc(wx, wy, 11, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#8A99A8'; ctx.lineWidth = 1.5;     // raios
    for (let k = 0; k < 3; k++) {
      const a = this.wheelSpin + (k * Math.PI) / 3;
      line(ctx, wx - Math.cos(a) * 7.5, wy - Math.sin(a) * 7.5, wx + Math.cos(a) * 7.5, wy + Math.sin(a) * 7.5);
    }
    ctx.fillStyle = '#8A99A8';
    ctx.beginPath(); ctx.arc(wx, wy, 2, 0, 7); ctx.fill();
  }
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function path(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
