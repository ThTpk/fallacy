// No true Scotsman: a boundary is drawn round a group, a claim is made about
// everyone inside it, and then someone turns up who breaks the claim. Instead
// of giving up the claim, the boundary moves in to leave them outside. Each
// move keeps the claim alive and makes it say less.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#scotsman-stage');
if (stage) {
  const W = 680, H = 296, BASE = 248;
  const N = 7, X0 = 94, GAP = 76;
  const LEFT = 56, TOP = 142, BOT = 268;
  const STEP = 2.6, MOVE = 0.7;
  const RED = '#b3412d';
  const NAMES = ['คนสายนี้', 'คนสายนี้ตัวจริง', 'ตัวจริงแท้ ๆ', 'ตัวจริงดั้งเดิม', 'ตัวจริงที่เข้าใจจริง'];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ขอบเขตรอบกลุ่มคนหดเข้าทุกครั้งที่เจอคนที่ขัดกับข้ออ้าง',
  });
  const { filter } = inkDefs(svg, 'nt');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${BASE} L${W} ${BASE}`);

  const ring = el('rect', { x: LEFT, y: TOP, rx: 16, width: 0, height: BOT - TOP, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-dasharray': '8 6' }, scene);
  const ringCap = el('text', { x: LEFT + 14, y: TOP + 22, 'font-size': 12.5, fill: 'currentColor', class: 'nt-t' }, scene);

  // --- the people, drawn once ----------------------------------------------
  const folk = Array.from({ length: N }, (_, i) => {
    const x = X0 + i * GAP;
    const g = el('g', {}, scene);
    const body = shape(g, 1.1);
    body.setAttribute('d', `M${x - 11} ${BASE} L${x - 9} ${BASE - 34} q9 -7 18 0 L${x + 11} ${BASE}Z`);
    el('ellipse', { cx: x, cy: BASE - 46, rx: 7, ry: 8.4, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1 }, g);
    const legs = pen(g, 1.0);
    legs.setAttribute('d', `M${x - 5} ${BASE} l0 6 M${x + 5} ${BASE} l0 6`);
    const mark = el('g', { opacity: 0 }, g);
    const cross = pen(mark, 1.6);
    cross.setAttribute('stroke', RED);
    cross.setAttribute('d', `M${x - 6} ${BASE - 74} l12 12 M${x + 6} ${BASE - 74} l-12 12`);
    return { g, mark, x };
  });

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'nt-t' }, scene);
  const sub = el('text', { x: 36, y: 66, 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'nt-t' }, scene);
  const tally = el('text', { x: 36, y: 288, 'font-size': 12, fill: 'currentColor', opacity: 0.68, class: 'nt-t' }, scene);

  // how many are still counted as members; it only ever goes down
  let inside = N, moves = 0, k = 0, moving = false;
  const edgeFor = (n: number) => X0 + (n - 1) * GAP + 30;
  let fromR = edgeFor(N) - LEFT, toR = fromR;

  const shrink = () => {
    if (moving || inside <= 3) return;
    fromR = edgeFor(inside) - LEFT;
    inside -= 1; moves += 1;
    toR = edgeFor(inside) - LEFT;
    moving = true; k = 0;
  };

  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', shrink);

  run((_t, dt) => {
    k += dt;
    if (!moving && k >= STEP) {
      if (inside > 3) shrink();
      else { inside = N; moves = 0; fromR = toR = edgeFor(N) - LEFT; k = 0; }
    }
    if (moving && k >= MOVE) { moving = false; k = 0; }

    const u = moving ? ease(k / MOVE) : 1;
    ring.setAttribute('width', f(fromR + (toR - fromR) * u));
    ringCap.textContent = NAMES[Math.min(moves, NAMES.length - 1)];

    folk.forEach((p, i) => {
      const out = i >= inside;
      p.mark.setAttribute('opacity', f(out ? (i === inside && moving ? u : 1) : 0));
      p.g.setAttribute('opacity', f(out ? 0.5 : 1));
    });

    headline.textContent = moves === 0 ? 'ข้ออ้าง คนสายนี้ไม่ทำแบบนั้น' : 'พอเจอคนที่ทำ นิยามก็ขยับ';
    sub.textContent = moves === 0
      ? 'ทุกคนในกรอบนับเป็นสมาชิก'
      : 'คนที่ขัดกับข้ออ้างถูกพาออกนอกกรอบ ข้ออ้างเดิมจึงยังไม่เคยผิด';
    tally.textContent = `ขยับนิยามไปแล้ว ${moves} ครั้ง · เหลือคนที่นับว่าเป็นตัวจริง ${inside} คน`;
  });
}
