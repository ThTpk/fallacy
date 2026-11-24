// Whataboutism: the spotlight moves, the question does not. The first box
// stays on stage the whole time with a clock on it, counting how long it has
// been waiting for the answer that the second box is not.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#whatabout-stage');
if (stage) {
  const W = 680, H = 300;
  const RED = '#b3412d';
  const A: [number, number] = [184, 160];       // the question that was asked
  const B: [number, number] = [496, 160];       // the one raised instead
  const BW = 250, BH = 86;
  const MOVE = 2.6, CYCLE = 9.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ไฟส่องย้ายจากคำถามเดิมไปคำถามใหม่ ส่วนคำถามเดิมยังอยู่ที่เดิม',
  });
  const { filter } = inkDefs(svg, 'wa');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'wa-t' }, scene);

  // the light, drawn under the boxes so it washes the stage rather than them
  const beam = el('path', { fill: 'var(--lamp)', opacity: 0.22, stroke: 'none' }, scene);
  const lamp = pen(scene, 1.6);

  const box = (c: [number, number], tag: string, text: string) => {
    const g = el('g', {}, scene);
    const r = shape(g, 1.3);
    r.setAttribute('d', `M${c[0] - BW / 2} ${c[1] - BH / 2} L${c[0] + BW / 2} ${c[1] - BH / 2} L${c[0] + BW / 2} ${c[1] + BH / 2} L${c[0] - BW / 2} ${c[1] + BH / 2}Z`);
    const t1 = el('text', { x: c[0], y: c[1] - 18, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.62, class: 'wa-t' }, g);
    t1.textContent = tag;
    const t2 = el('text', { x: c[0], y: c[1] + 8, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'wa-t' }, g);
    t2.textContent = text;
    return g;
  };

  const boxA = box(A, 'คำถามที่ถูกถาม', 'ทำไมโครงการถึงล่าช้า');
  const boxB = box(B, 'เรื่องที่ยกขึ้นมาแทน', 'แล้วสมัยคุณดูแลเองล่ะ');

  // the tag that stays stuck on the first box
  const waiting = el('text', { x: A[0], y: A[1] + 36, 'text-anchor': 'middle', 'font-size': 12, fill: RED, opacity: 0, class: 'wa-t' }, scene);

  const note = el('text', { x: 36, y: 268, 'font-size': 12.5, fill: 'currentColor', opacity: 0.78, class: 'wa-t' }, scene);

  const sx = spring(22, 6.5, A[0]);
  let k = 0, waited = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < MOVE ? MOVE : 0; if (k === 0) waited = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { k = 0; waited = 0; }

    const away = k > MOVE;
    if (away) waited += dt;

    const x = sx.step(away ? B[0] : A[0], dt);
    lamp.setAttribute('d', `M${f(x - 16)} 62 L${f(x + 16)} 62`);
    beam.setAttribute(
      'd',
      `M${f(x - 16)} 64 L${f(x - 108)} ${A[1] + BH / 2 + 10} L${f(x + 108)} ${A[1] + BH / 2 + 10} L${f(x + 16)} 64Z`,
    );

    // whichever box the light is off dims, or the spotlight means nothing
    const lit = Math.min(1, Math.abs(x - A[0]) / Math.abs(B[0] - A[0]));
    boxA.setAttribute('opacity', f(1 - lit * 0.45));
    boxB.setAttribute('opacity', f(0.55 + lit * 0.45));

    waiting.setAttribute('opacity', f(away ? Math.min(1, (k - MOVE) / 0.5) : 0));
    waiting.textContent = `ยังไม่ถูกตอบ · รออยู่ ${waited.toFixed(1)} วินาที`;

    headline.textContent = away
      ? 'ไฟย้ายไปแล้ว แต่คำถามเดิมยังอยู่ที่เดิม'
      : 'คำถามอยู่บนโต๊ะ รอคำตอบ';
    note.textContent = away
      ? 'ถ้าเรื่องทางขวาเป็นจริงทั้งหมด คำถามทางซ้ายก็ยังไม่ได้รับคำตอบอยู่ดี · คลิกเพื่อส่องกลับ'
      : 'คลิกเพื่อดูว่าเกิดอะไรขึ้นเมื่อมีคนยกเรื่องอื่นขึ้นมา';
  });
}
