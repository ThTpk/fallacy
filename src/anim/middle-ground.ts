// Argument to moderation: the midpoint marker is tied to the two flags, so
// whoever drags their flag further out drags the "truth" along with it. The
// evidence mark never moves.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#moderation-stage');
if (stage) {
  const W = 680, H = 316;
  const RED = '#b3412d', OK = '#2f6d4f';
  const X0 = 80, X1 = 600, LINE = 168;
  const TRUTH = 0.3;                    // where the evidence actually points
  const STEPS = [0.62, 0.78, 0.94];     // how far the right flag gets dragged
  const PER = 2.4, HOLD = 2.6;
  const CYCLE = STEPS.length * PER + HOLD;
  const px = (u: number) => X0 + (X1 - X0) * u;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ธงฝั่งขวาถูกลากออกไปเรื่อย ๆ และจุดกึ่งกลางเลื่อนตามไปด้วย',
  });
  const { filter } = inkDefs(svg, 'md');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'md-t' }, scene);

  pen(scene, 1.4).setAttribute('d', `M${X0 - 14} ${LINE} L${X1 + 14} ${LINE}`);

  // where the evidence points, fixed for the whole scene
  const tx = px(TRUTH);
  const truthMark = pen(scene, 2.2);
  truthMark.setAttribute('d', `M${tx} ${LINE - 16} L${tx} ${LINE + 16}`);
  truthMark.setAttribute('stroke', OK);
  const truthT = el('text', { x: tx, y: LINE + 38, 'text-anchor': 'middle', 'font-size': 12, fill: OK, class: 'md-t' }, scene);
  truthT.textContent = 'จุดที่หลักฐานชี้';

  const flag = (colour: string, label: string) => {
    const g = el('g', {}, scene);
    pen(g, 2).setAttribute('d', `M0 ${LINE} L0 ${LINE - 46}`);
    const p = shape(g, 1.3);
    p.setAttribute('d', `M0 ${LINE - 46} L34 ${LINE - 38} L0 ${LINE - 30}Z`);
    p.setAttribute('stroke', colour);
    const t = el('text', { x: 0, y: LINE - 54, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', class: 'md-t' }, g);
    t.textContent = label;
    return g;
  };
  const left = flag('currentColor', 'ฝ่าย ก');
  const right = flag('currentColor', 'ฝ่าย ข');

  const mid = el('g', {}, scene);
  el('circle', { cx: 0, cy: LINE, r: 9, fill: 'var(--hl-bg)', stroke: 'var(--hl)', 'stroke-width': 2 }, mid);
  const midT = el('text', { x: 0, y: LINE + 60, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'var(--hl)', class: 'md-t' }, mid);
  midT.textContent = 'ความจริงอยู่ตรงกลาง';

  const gap = el('text', { x: 36, y: 272, 'font-size': 13, fill: 'currentColor', class: 'md-t' }, scene);
  const note = el('text', { x: 36, y: 296, 'font-size': 12, fill: 'currentColor', opacity: 0.74, class: 'md-t' }, scene);

  const sr = spring(16, 6, STEPS[0]);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const step = Math.min(STEPS.length - 1, Math.floor(k / PER));
    const rU = sr.step(STEPS[step], dt);
    const lU = 0.12;

    left.setAttribute('transform', `translate(${f(px(lU))} 0)`);
    right.setAttribute('transform', `translate(${f(px(rU))} 0)`);

    const m = (lU + rU) / 2;
    mid.setAttribute('transform', `translate(${f(px(m))} 0)`);

    const off = Math.abs(m - TRUTH) * 100;
    const moved = k > PER * 0.9;
    headline.textContent = !moved
      ? 'สองฝ่ายประกาศจุดยืน แล้วเลือกจุดกึ่งกลาง'
      : 'ฝ่าย ข ขยับออกไปอีก จุดกึ่งกลางขยับตาม';
    gap.textContent = `จุดกึ่งกลางห่างจากจุดที่หลักฐานชี้อยู่ ${off.toFixed(0)} หน่วย`;
    note.textContent = moved
      ? 'ขีดเขียวไม่ได้ขยับเลยสักครั้ง สิ่งที่ลากจุดกึ่งกลางคือธง ไม่ใช่หลักฐาน · คลิกเพื่อดูใหม่'
      : 'ดูว่าจะเกิดอะไรขึ้นเมื่อฝ่ายหนึ่งขยับจุดยืนออกไป';
  });
}
