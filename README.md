# Candle Cross 🏍️📈

Motocross em cima do gráfico semanal real das suas criptos. Cada moeda é uma pista:
o terreno é construído a partir dos fechamentos semanais (klines `1w` da Binance),
do primeiro candle listado até hoje. Backflips valem pontos, aterrissar de cabeça
encerra a corrida, e cruzar o candle de hoje fecha o gráfico com bandeira quadriculada.

## Rodar localmente

O projeto usa ES modules, então precisa de um servidor HTTP (abrir o arquivo direto não funciona):

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Deploy

É um site 100% estático — qualquer host serve:

- **Vercel**: `vercel` na raiz do projeto, zero config.
- **Portais de jogos (Poki / CrazyGames / GameDistribution)**: zip da pasta e upload.
  Antes de submeter, integrar o SDK de ads do portal (ver roadmap).

## Estrutura

```
index.html       telas de menu e jogo
css/style.css    tema terminal de trading + acentos por moeda
js/config.js     lista de moedas, constantes de física e da pista
js/api.js        klines da Binance + fallback offline (pista simulada)
js/terrain.js    fechamentos semanais -> terreno jogável (log-retornos com clamp)
js/bike.js       física arcade + desenho da moto de cross e do piloto
js/game.js       loop, câmera, render do gráfico em linha, HUD, input
js/menu.js       watchlist com sparkline = preview da pista
js/main.js       máquina de estados das telas
```

## Tuning rápido

Tudo que define o "feel" está em `js/config.js`:

- `PHYS.G / ACC / BRAKE` — peso e resposta da moto
- `PHYS.LEAN_*` — velocidade de rotação no ar (dificuldade dos flips)
- `PHYS.CRASH_ANGLE` — tolerância da aterrissagem (1.5 rad ≈ arcade; baixar = punitivo)
- `TRACK.SEG` — px por semana (pista mais comprida ou mais densa)
- `TRACK.LOG_SCALE / LOG_CLAMP` — quão dramáticos ficam os morros da volatilidade

## Adicionar moedas

Basta acrescentar uma entrada em `COINS` no `config.js` com qualquer par `*USDT`
listado na Binance spot.

## Roadmap (versão portal)

- [ ] SDK de ads do portal: interstitial no game over, rewarded "continue de onde caiu"
- [ ] Pista do dia fixa + leaderboard diário (todo mundo corre o mesmo gráfico)
- [ ] Sons (motor, salto, crash) — desbloquear áudio no primeiro toque
- [ ] Seletor de intervalo (1d / 1w / 1M) como modos de dificuldade
- [ ] Compartilhar resultado (canvas -> PNG com o trecho do gráfico onde caiu)
