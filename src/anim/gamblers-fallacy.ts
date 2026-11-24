// Gambler's fallacy: the streak on the left grows and grows. The needle on
// the right, which is the only thing that matters for the next spin, does not
// move at all.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { seeded } from './lib/motion.ts';

const stage = document.querySelector('#gambler-stage');
if (stage) {
  const W = 680, H = 320;
  const RED = '#b3412d', OK = '#2f6d4f';
  const N = 18, PER = 0.52;
  const CYCLE = N * PER + 3.0;
  const COLS = 9, GX = 60, GY = 124, STEP = 34;

  // a run that happens to start with a long streak, which is what real runs do
  const rnd = seeded(13);
  const outcome = Array.from({ length: N }, (_, i) => (i < 7 ? true : rnd(0, 1) < 0.5));

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ผลออกสีเดิมติดกันหลายครั้ง แต่เข็มโอกาสของครั้งถัดไปไม่ขยับ',
  });
  const { filter } = inkDefs(svg, 'gb');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'gb-t' }, scene);
  const gridT = el('text', { x: GX, y: 100, 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'gb-t' }, scene);
  gridT.textContent = 'ผลที่ออกมาแล้ว';

  const marks = outcome.map((o, i) => {
    const x = GX + (i % COLS) * STEP, y = GY + Math.floor(i / COLS) * STEP;
    const c = el('circle', {
      cx: x, cy: y, r: 11, opacity: 0,
      fill: o ? 'var(--hl-bg)' : 'none',
      stroke: o ? 'var(--hl)' : 'currentColor', 'stroke-width': 1.4,
    }, scene);
    return c;
  });

  // the dial for the next spin, which is the claim being tested
  const DC: [number, number] = [520, 212], R = 76;
  const rad = (d: number) => (d * Math.PI) / 180;
  const on = (d: number, r: number): [number, number] => [DC[0] + r * Math.cos(rad(d)), DC[1] + r * Math.sin(rad(d))];
  const A0 = -176, A1 = -4;
  pen(scene, 1.3).setAttribute('d',
    `M${f(on(A0, R)[0])} ${f(on(A0, R)[1])} A${R} ${R} 0 0 1 ${f(on(A1, R)[0])} ${f(on(A1, R)[1])}`);
  ([[A0, '0%'], [(A0 + A1) / 2, '50%'], [A1, '100%']] as const).forEach(([a, lab]) => {
    const p1 = on(a, R - 9), p2 = on(a, R);
    pen(scene, 1).setAttribute('d', `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])}`);
    const lp = on(a, R + 18);
    const t = el('text', {
      x: f(lp[0]), y: f(lp[1]), 'text-anchor': a === A0 ? 'start' : a === A1 ? 'end' : 'middle',
      'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'gb-t',
    }, scene);
    t.textContent = lab;
  });
  const needle = pen(scene, 2.6);
  needle.setAttribute('stroke', OK);
  el('circle', { cx: DC[0], cy: DC[1], r: 5, fill: 'currentColor' }, scene);
  const dialT = el('text', { x: DC[0], y: DC[1] + 32, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', class: 'gb-t' }, scene);
  dialT.textContent = 'โอกาสออกสีเดิมครั้งหน้า';

  const streakT = el('text', { x: 36, y: 276, 'font-size': 13, fill: 'currentColor', class: 'gb-t' }, scene);
  const note = el('text', { x: 36, y: 300, 'font-size': 12, fill: 'currentColor', opacity: 0.74, class: 'gb-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const shown = Math.min(N, Math.floor(k / PER) + 1);
    marks.forEach((m, i) => m.setAttribute('opacity', f(i < shown ? 1 : 0)));

    // the current run of the same colour
    let streak = 1;
    for (let i = shown - 1; i > 0; i--) {
      if (outcome[i] === outcome[i - 1]) streak++; else break;
    }

    // the needle never moves, because nothing about the wheel changed
    const a = A0 + (A1 - A0) * 0.5;
    const tip = on(a, R - 14);
    needle.setAttribute('d', `M${DC[0]} ${DC[1]} L${f(tip[0])} ${f(tip[1])}`);

    headline.textContent = shown >= N
      ? 'ออกมาแล้ว 18 ครั้ง เข็มยังอยู่ที่เดิม'
      : `ออกมาแล้ว ${shown} ครั้ง`;
    streakT.textContent = `ตอนนี้ออกสีเดิมติดกัน ${streak} ครั้ง · โอกาสครั้งหน้ายังเป็น 50%`;
    note.textContent = 'แถบซ้ายยาวขึ้นเรื่อย ๆ แต่ไม่มีอะไรในวงล้อเปลี่ยน เข็มจึงไม่ขยับ · คลิกเพื่อดูใหม่';
  });
}
