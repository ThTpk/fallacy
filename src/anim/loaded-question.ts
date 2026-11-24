// Loaded question: the question is a form with small print. Both answers sign
// the same line, so the stamp lands in the same place whichever box is ticked.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#loaded-stage');
if (stage) {
  const W = 680, H = 312;
  const RED = '#b3412d';
  const CARD = { x: 100, y: 70, w: 480, h: 150 };
  const ANS = [
    { label: 'ใช่ เลิกแล้ว', x: 212 },
    { label: 'ยังไม่เลิก', x: 468 },
  ];
  const CYCLE = 5.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คำถามที่มีข้อความตัวเล็กฝังอยู่ ทั้งสองคำตอบประทับตรารับข้อเดียวกัน',
  });
  const { filter } = inkDefs(svg, 'lq');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'lq-t' }, scene);

  shape(scene, 1.4).setAttribute(
    'd', `M${CARD.x} ${CARD.y} L${CARD.x + CARD.w} ${CARD.y} L${CARD.x + CARD.w} ${CARD.y + CARD.h} L${CARD.x} ${CARD.y + CARD.h}Z`);

  const q = el('text', { x: CARD.x + 26, y: CARD.y + 42, 'font-size': 15, fill: 'currentColor', class: 'lq-t' }, scene);
  q.textContent = 'คุณเลิกโกงข้อสอบแล้วหรือยัง';

  // the line the question quietly asks you to sign
  pen(scene, 1).setAttribute('d', `M${CARD.x + 26} ${CARD.y + 64} L${CARD.x + CARD.w - 26} ${CARD.y + 64}`);
  const fine = el('text', { x: CARD.x + 26, y: CARD.y + 92, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'lq-t' }, scene);
  fine.textContent = 'ข้อความตัวเล็กที่ติดมากับคำถาม';
  const hidden = el('text', { x: CARD.x + 26, y: CARD.y + 118, 'font-size': 14, fill: 'currentColor', class: 'lq-t' }, scene);
  hidden.textContent = 'คุณเคยโกงข้อสอบ';

  // the stamp that lands on the small print, wherever the tick went
  const stampG = el('g', { opacity: 0 }, scene);
  const ring = pen(stampG, 2.4);
  ring.setAttribute('stroke', RED);
  ring.setAttribute('d', 'M-62 0 a62 22 0 1 0 124 0 a62 22 0 1 0 -124 0Z');
  const stampT = el('text', {
    x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 13, fill: RED,
    'font-weight': 500, class: 'lq-t',
  }, stampG);
  stampT.textContent = 'ยอมรับแล้ว';

  const boxes = ANS.map((a) => {
    const g = el('g', {}, scene);
    shape(g, 1.3).setAttribute('d', `M${a.x - 92} 240 L${a.x + 92} 240 L${a.x + 92} 280 L${a.x - 92} 280Z`);
    const t = el('text', { x: a.x, y: 265, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'currentColor', class: 'lq-t' }, g);
    t.textContent = a.label;
    const tick = pen(g, 2.6);
    tick.setAttribute('stroke', RED);
    tick.setAttribute('d', `M${a.x - 74} 260 L${a.x - 66} 270 L${a.x - 50} 248`);
    tick.setAttribute('opacity', '0');
    return { g, tick };
  });

  const note = el('text', { x: 36, y: 302, 'font-size': 12, fill: 'currentColor', opacity: 0.78, class: 'lq-t' }, scene);

  const sc = spring(26, 7, 1.6);
  let k = 0, which = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { which = 1 - which; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { which = 1 - which; k = 0; }

    boxes.forEach((b, i) => {
      b.tick.setAttribute('opacity', f(i === which && k > 0.8 ? 1 : 0));
      b.g.setAttribute('opacity', f(i === which ? 1 : 0.5));
    });

    // the stamp slams down on the small print, never on the answer
    const u = ease(Math.min(1, Math.max(0, (k - 1.4) / 0.5)));
    const s = sc.step(u > 0 ? 1 : 1.6, dt);
    stampG.setAttribute('opacity', f(u));
    stampG.setAttribute(
      'transform',
      `translate(${CARD.x + 300} ${CARD.y + 112}) rotate(-7) scale(${f(0.6 + s * 0.4)})`,
    );

    headline.textContent = k < 0.8
      ? 'คำถามเดียว สองคำตอบ'
      : u < 1 ? `ตอบว่า ${ANS[which].label}`
        : 'ตราลงที่บรรทัดเดิมทั้งสองทาง';
    note.textContent = u >= 1
      ? 'ทางออกไม่ใช่การเลือกช่อง แต่คือการปฏิเสธบรรทัดตัวเล็กก่อน แล้วค่อยตอบคำถาม'
      : 'คลิกเพื่อสลับคำตอบ';
  });
}
