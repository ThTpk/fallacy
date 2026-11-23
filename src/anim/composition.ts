// Composition: every brick is light, so the wall is light. The bricks stack up
// one at a time and the total climbs with them. Weight is a property that adds
// rather than carries over, and the number says so long before any argument does.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#composition-stage');
if (stage) {
  const W = 680, H = 300, GROUND = 256;
  const BW = 54, BH = 20, COLS = 6, ROWS = 6, X0 = 72, GAP = 3;
  const PER = 2;                       // kg per brick
  const RATE = 0.17;                   // seconds between bricks
  const PAUSE = 2.6;
  const RED = '#b3412d';
  const N = COLS * ROWS;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น อิฐเบาวางซ้อนกันเป็นกำแพง พร้อมน้ำหนักรวมที่เพิ่มขึ้นทุกก้อน',
  });
  const { filter } = inkDefs(svg, 'cp');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);

  const bricks = Array.from({ length: N }, (_, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const stagger = r % 2 ? 14 : 0;
    const x = X0 + c * (BW + GAP) + stagger;
    const y = GROUND - (r + 1) * (BH + GAP);
    const g = el('g', { opacity: 0 }, scene);
    const b = shape(g, 1.1);
    b.setAttribute('d', `M${x} ${y} L${x + BW} ${y} L${x + BW} ${y + BH} L${x} ${y + BH}Z`);
    const nick = pen(g, 0.5);
    nick.setAttribute('d', `M${x + 8} ${y + BH - 5} l10 0 M${x + BW - 18} ${y + 6} l8 0`);
    return { g, x, y };
  });

  const oneCap = el('text', { x: 456, y: 118, 'font-size': 12.5, fill: 'currentColor', opacity: 0.72, class: 'cp-t' }, scene);
  oneCap.textContent = `อิฐก้อนเดียว ${PER} กก.`;
  const oneBrick = shape(scene, 1.1);
  oneBrick.setAttribute('d', `M456 128 L${456 + BW} 128 L${456 + BW} ${128 + BH} L456 ${128 + BH}Z`);

  const totalCap = el('text', { x: 456, y: 196, 'font-size': 12.5, fill: 'currentColor', opacity: 0.72, class: 'cp-t' }, scene);
  totalCap.textContent = 'กำแพงทั้งกำแพง';
  const total = el('text', { x: 456, y: 230, 'font-size': 30, fill: 'currentColor', class: 'cp-t cp-n' }, scene);

  const claim = el('text', { x: 36, y: 46, 'font-size': 14.5, fill: 'currentColor', class: 'cp-t' }, scene);
  claim.textContent = 'ข้ออ้าง อิฐทุกก้อนเบา กำแพงจึงเบา';
  const verdict = el('text', { x: 36, y: 68, 'font-size': 12, fill: RED, opacity: 0, class: 'cp-t' }, scene);
  verdict.textContent = 'น้ำหนักเป็นคุณสมบัติที่บวกกัน ไม่ใช่คุณสมบัติที่ส่งผ่าน';

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    const built = Math.min(N, Math.floor(k / RATE));
    if (k > N * RATE + PAUSE) k = 0;

    bricks.forEach(({ g }, i) => {
      if (i < built) {
        const age = Math.min(1, (k - i * RATE) / 0.22);
        const drop = (1 - ease(age)) * -26;
        g.setAttribute('opacity', f(Math.min(1, age * 2)));
        g.setAttribute('transform', `translate(0 ${f(drop)})`);
      } else g.setAttribute('opacity', '0');
    });

    const kg = built * PER;
    total.textContent = `${kg} กก.`;
    total.setAttribute('fill', kg > 20 ? RED : 'currentColor');
    verdict.setAttribute('opacity', f(Math.min(1, Math.max(0, (kg - 20) / 24))));
  });
}
