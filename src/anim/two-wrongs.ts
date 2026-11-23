// Two wrongs: pile whatever you like on the other pan. The beam tilts, because
// that is what beams do, and the verdict hanging over our own pan never moves.
// Weighing one wrong against another is not a way of making either one right.
import { el, pen, shape, blot, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#twowrongs-stage');
if (stage) {
  const W = 680, H = 300;
  const PIVOT: [number, number] = [340, 150];
  const ARM = 210, DROP = 56;
  const ADD_EVERY = 2.2, MAX = 6;
  const RED = '#b3412d';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ตาชั่งที่ถูกถมด้วยความผิดของอีกฝ่าย คานเอียงแต่คำตัดสินฝั่งเราไม่เปลี่ยน',
  });
  const { filter } = inkDefs(svg, 'tw');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 268 L${W} 268`);
  const post = shape(scene, 1.1);
  post.setAttribute('d', `M${PIVOT[0] - 16} 268 L${PIVOT[0] - 5} ${PIVOT[1] + 4} L${PIVOT[0] + 5} ${PIVOT[1] + 4} L${PIVOT[0] + 16} 268Z`);

  const beamG = el('g', {}, scene);
  const beam = pen(beamG, 1.6);
  beam.setAttribute('d', `M${PIVOT[0] - ARM} ${PIVOT[1]} L${PIVOT[0] + ARM} ${PIVOT[1]}`);
  const cords = pen(beamG, 0.8);
  cords.setAttribute('d', `M${PIVOT[0] - ARM} ${PIVOT[1]} l0 ${DROP} M${PIVOT[0] + ARM} ${PIVOT[1]} l0 ${DROP}`);
  const panL = pen(beamG, 1.2);
  panL.setAttribute('d', `M${PIVOT[0] - ARM - 42} ${PIVOT[1] + DROP} q42 26 84 0`);
  const panR = pen(beamG, 1.2);
  panR.setAttribute('d', `M${PIVOT[0] + ARM - 42} ${PIVOT[1] + DROP} q42 26 84 0`);

  // one blot on our pan, and as many as you like on theirs
  const ours = blot(beamG);
  ours.setAttribute('d', `M${PIVOT[0] - ARM - 13} ${PIVOT[1] + DROP - 2} a13 10 0 1 0 26 0 a13 10 0 1 0 -26 0Z`);
  const theirs = Array.from({ length: MAX }, (_, i) => {
    const b = blot(beamG);
    const r = i % 3, c = Math.floor(i / 3);
    b.setAttribute('d', `M${PIVOT[0] + ARM - 24 + r * 17} ${PIVOT[1] + DROP - 4 - c * 13} a8 6.5 0 1 0 16 0 a8 6.5 0 1 0 -16 0Z`);
    b.setAttribute('opacity', '0');
    return b;
  });

  const capL = el('text', { x: PIVOT[0] - ARM, y: 250, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'tw-t' }, scene);
  capL.textContent = 'สิ่งที่เราทำ';
  const capR = el('text', { x: PIVOT[0] + ARM, y: 250, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'tw-t' }, scene);
  capR.textContent = 'สิ่งที่คนอื่นทำ';

  // the verdict hangs over our pan and is not attached to the beam
  const verdictBox = shape(scene, 1.1);
  verdictBox.setAttribute('d', `M${PIVOT[0] - ARM - 62} 44 L${PIVOT[0] - ARM + 62} 44 L${PIVOT[0] - ARM + 62} 80 L${PIVOT[0] - ARM - 62} 80Z`);
  const verdict = el('text', { x: PIVOT[0] - ARM, y: 68, 'text-anchor': 'middle', 'font-size': 15, fill: RED, class: 'tw-t' }, scene);
  verdict.textContent = 'ยังผิดอยู่';

  const tally = el('text', { x: 36, y: 288, 'font-size': 12, fill: 'currentColor', opacity: 0.7, class: 'tw-t' }, scene);

  const tilt = spring(42, 8);
  let n = 0, k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { n = n >= MAX ? 0 : n + 1; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k >= ADD_EVERY) { n = n >= MAX ? 0 : n + 1; k = 0; }

    theirs.forEach((b, i) => b.setAttribute('opacity', i < n ? '1' : '0'));
    const a = tilt.step((n - 1) * 2.6, dt);
    beamG.setAttribute('transform', `rotate(${f(Math.max(-14, Math.min(14, a)))} ${PIVOT[0]} ${PIVOT[1]})`);

    tally.textContent = n === 0
      ? 'ยังไม่ได้ยกเรื่องของใครมาเทียบ'
      : `ยกเรื่องของคนอื่นมาแล้ว ${n} เรื่อง · คำตัดสินฝั่งเราอยู่ที่เดิม`;
  });
}
