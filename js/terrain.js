import { TRACK } from './config.js';

// Constrói o terreno a partir dos fechamentos semanais.
// Usa log-retornos com clamp: preserva o formato local do gráfico
// e mantém as inclinações sempre jogáveis, mesmo em moedas que
// multiplicaram 100x no período.
export class Track {
  constructor(points) {
    this.points = points;
    this.SEG = TRACK.SEG;
    this.h = [TRACK.H_START];
    for (let i = 1; i < points.length; i++) {
      let lr = Math.log(points[i].close / points[i - 1].close);
      lr = Math.max(-TRACK.LOG_CLAMP, Math.min(TRACK.LOG_CLAMP, lr));
      const next = this.h[i - 1] - lr * TRACK.LOG_SCALE; // preço sobe = terreno sobe na tela
      this.h.push(Math.max(TRACK.H_MIN, Math.min(TRACK.H_MAX, next)));
    }
    this.length = (points.length - 1) * this.SEG;
  }

  segIndex(x) {
    const cx = Math.max(0, Math.min(this.length - 1, x));
    return Math.min(this.h.length - 2, Math.floor(cx / this.SEG));
  }

  // Interpolação cosseno: a mesma curva é usada na física e no desenho,
  // então a linha do gráfico É o chão, sem divergência visual.
  ground(x) {
    const cx = Math.max(0, Math.min(this.length, x));
    const i = this.segIndex(cx);
    const t = (cx - i * this.SEG) / this.SEG;
    const u = (1 - Math.cos(Math.PI * t)) / 2;
    return this.h[i] + (this.h[i + 1] - this.h[i]) * u;
  }

  slope(x) {
    return Math.atan2(this.ground(x + 9) - this.ground(x - 9), 18);
  }

  priceAt(x) {
    const cx = Math.max(0, Math.min(this.length, x));
    const i = this.segIndex(cx);
    const t = (cx - i * this.SEG) / this.SEG;
    return this.points[i].close + (this.points[i + 1].close - this.points[i].close) * t;
  }

  dateAt(x) {
    return new Date(this.points[this.segIndex(x)].t);
  }

  totalReturn() {
    const first = this.points[0].close;
    const last = this.points[this.points.length - 1].close;
    return (last / first - 1) * 100;
  }
}
