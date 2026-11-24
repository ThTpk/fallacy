// Texas sharpshooter, drawn as the barn wall it is named after. Shots land at
// random, then a ring is drawn around whichever three happened to land closest
// together. Click to shoot again: there is always such a cluster.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease, seeded } from './lib/motion.ts';

const stage = document.querySelector('#sharpshooter-stage');
if (stage) {
  const W = 680, H = 316;
  const RED = '#b3412d', OK = '#2f6d4f';
  const WALL = { x: 150, y: 80, w: 380, h: 170 };
  const SHOTS = 14;
  const FIRE = 2.4, DRAW = 1.4, HOLD = 2.6;
  const CYCLE = FIRE + DRAW + HOLD;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น รอยกระสุนกระจายบนผนัง แล้ววงเป้าถูกวาดรอบกลุ่มที่ชิดกันที่สุด',
  });
  const { filter } = inkDefs(svg, 'ts');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'ts-t' }, scene);

  // the barn wall, with planks
  shape(scene, 1.5).setAttribute(
    'd', `M${WALL.x} ${WALL.y} L${WALL.x + WALL.w} ${WALL.y} L${WALL.x + WALL.w} ${WALL.y + WALL.h} L${WALL.x} ${WALL.y + WALL.h}Z`);
  for (let i = 1; i < 5; i++) {
    const y = WALL.y + (WALL.h * i) / 5;
    const p = pen(scene, 0.9);
    p.setAttribute('opacity', '0.35');
    p.setAttribute('d', `M${WALL.x} ${f(y)} L${WALL.x + WALL.w} ${f(y)}`);
  }

  const holes = Array.from({ length: SHOTS }, () =>
    el('circle', { r: 4.2, fill: 'currentColor', opacity: 0 }, scene));

  const ring = el('circle', { fill: 'none', stroke: RED, 'stroke-width': 2.4, opacity: 0 }, scene);
  const ring2 = el('circle', { fill: 'none', stroke: RED, 'stroke-width': 1.3, opacity: 0 }, scene);
  const boast = el('text', { x: 0, 'text-anchor': 'middle', 'font-size': 12.5, fill: RED, opacity: 0, class: 'ts-t' }, scene);
  boast.textContent = 'นี่คือรูปแบบที่ผมทำนายไว้';

  const note = el('text', { x: 36, y: 292, 'font-size': 12.5, fill: 'currentColor', class: 'ts-t' }, scene);

  let rnd = seeded(5);
  let pts: [number, number][] = [];
  let best = { x: 0, y: 0, r: 40 };

  function reload() {
    pts = Array.from({ length: SHOTS }, () => [
      WALL.x + 24 + rnd(0, WALL.w - 48),
      WALL.y + 24 + rnd(0, WALL.h - 48),
    ] as [number, number]);
    holes.forEach((h, i) => {
      h.setAttribute('cx', f(pts[i][0]));
      h.setAttribute('cy', f(pts[i][1]));
    });
    // the tightest triple decides where the target goes — which is the point
    let bestSpread = Infinity;
    for (let i = 0; i < SHOTS; i++) {
      const near = pts
        .map((p, j) => ({ j, d: Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) }))
        .sort((p, q) => p.d - q.d)
        .slice(0, 3);
      const spread = near[2].d;
      if (spread < bestSpread) {
        bestSpread = spread;
        const g = near.map((n) => pts[n.j]);
        best = {
          x: g.reduce((s, p) => s + p[0], 0) / 3,
          y: g.reduce((s, p) => s + p[1], 0) / 3,
          r: Math.max(26, spread * 0.8 + 14),
        };
      }
    }
  }
  reload();

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; reload(); });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { k = 0; reload(); }

    const fired = Math.min(SHOTS, Math.floor((k / FIRE) * SHOTS) + (k > 0 ? 1 : 0));
    holes.forEach((h, i) => h.setAttribute('opacity', f(i < fired ? 0.85 : 0)));

    const d = ease(Math.min(1, Math.max(0, (k - FIRE) / DRAW)));
    ring.setAttribute('cx', f(best.x));
    ring.setAttribute('cy', f(best.y));
    ring.setAttribute('r', f(best.r));
    ring.setAttribute('opacity', f(d));
    ring2.setAttribute('cx', f(best.x));
    ring2.setAttribute('cy', f(best.y));
    ring2.setAttribute('r', f(best.r * 0.55));
    ring2.setAttribute('opacity', f(d * 0.8));
    boast.setAttribute('x', f(Math.min(Math.max(best.x, 190), 500)));
    boast.setAttribute('y', f(WALL.y + WALL.h + 26));
    boast.setAttribute('opacity', f(d));

    headline.textContent = d < 0.05
      ? `ยิงไปแล้ว ${fired} นัด โดยไม่ได้เล็งอะไร`
      : 'แล้วค่อยวาดวงรอบกลุ่มที่ชิดกันที่สุด';
    note.textContent = d > 0.9
      ? 'ยิงใหม่กี่ครั้งก็มีกลุ่มที่ชิดกันให้วงเสมอ เพราะการกระจายแบบสุ่มย่อมมีก้อนอยู่แล้ว · คลิกเพื่อยิงใหม่'
      : 'คลิกเพื่อยิงชุดใหม่';
  });
}
