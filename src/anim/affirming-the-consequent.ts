// Affirming the consequent: three roads run into one place. Standing at that
// place tells you nothing about which road brought you there, and the scene
// takes a different one each time so the reader can never predict it either.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#consequent-stage');
if (stage) {
  const W = 680, H = 306;
  const RED = '#b3412d', OK = '#2f6d4f';
  const END: [number, number] = [524, 164];
  const ROADS = [
    { label: 'ฝนตก', y: 84, claimed: true },
    { label: 'รถน้ำผ่าน', y: 164, claimed: false },
    { label: 'ท่อประปาแตก', y: 244, claimed: false },
  ];
  const BX = 96, BW = 168, BH = 44;
  const CYCLE = 4.6;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ถนนสามสายวิ่งเข้าหาจุดเดียวกัน การยืนที่จุดนั้นไม่บอกว่ามาจากสายไหน',
  });
  const { filter } = inkDefs(svg, 'afc');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'afc-t' }, scene);

  const path = (r: typeof ROADS[number]) =>
    `M${BX + BW} ${r.y} C${BX + BW + 80} ${r.y} ${END[0] - 110} ${END[1]} ${END[0] - 38} ${END[1]}`;

  const lanes = ROADS.map((r) => {
    const base = pen(scene, 1.4);
    base.setAttribute('d', path(r));
    base.setAttribute('opacity', '0.38');
    const lit = pen(scene, 2.6);
    lit.setAttribute('d', path(r));
    lit.setAttribute('stroke', OK);
    const len = lit.getTotalLength ? lit.getTotalLength() : 420;
    lit.setAttribute('stroke-dasharray', f(len));
    lit.setAttribute('stroke-dashoffset', f(len));

    shape(scene, 1.2).setAttribute(
      'd', `M${BX} ${r.y - BH / 2} L${BX + BW} ${r.y - BH / 2} L${BX + BW} ${r.y + BH / 2} L${BX} ${r.y + BH / 2}Z`);
    const t = el('text', {
      x: BX + BW / 2, y: r.y + 5, 'text-anchor': 'middle', 'font-size': 13,
      fill: 'currentColor', class: 'afc-t',
    }, scene);
    t.textContent = r.label;
    return { lit, len };
  });

  // the one place all three arrive at, which is the only thing we observe
  shape(scene, 1.5).setAttribute(
    'd', `M${END[0] - 36} ${END[1] - 30} L${END[0] + 96} ${END[1] - 30} L${END[0] + 96} ${END[1] + 30} L${END[0] - 36} ${END[1] + 30}Z`);
  const obs = el('text', {
    x: END[0] + 30, y: END[1] - 6, 'text-anchor': 'middle', 'font-size': 11.5,
    fill: 'currentColor', opacity: 0.66, class: 'afc-t',
  }, scene);
  obs.textContent = 'สิ่งที่เราเห็น';
  const obsT = el('text', {
    x: END[0] + 30, y: END[1] + 16, 'text-anchor': 'middle', 'font-size': 14,
    fill: 'currentColor', 'font-weight': 500, class: 'afc-t',
  }, scene);
  obsT.textContent = 'ถนนเปียก';

  const verdict = el('text', { x: 36, y: 288, 'font-size': 13, fill: 'currentColor', class: 'afc-t' }, scene);

  let k = 0, which = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { which = (which + 1) % ROADS.length; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { which = (which + 1) % ROADS.length; k = 0; }

    // the road lights up backwards, from what we saw towards what caused it
    const u = ease(Math.min(1, Math.max(0, (k - 1.0) / 1.3)));
    lanes.forEach((l, i) => {
      l.lit.setAttribute('stroke-dashoffset', f(i === which ? l.len * (1 - u) : l.len));
    });

    if (k < 1.0) {
      headline.textContent = 'เราเห็นแต่ปลายทาง · เส้นไหนพามาก็ยังไม่รู้';
      verdict.textContent = 'คลิกเพื่อเปิดดูว่ารอบนี้มาจากทางไหน';
    } else {
      headline.textContent = `รอบนี้มาจาก ${ROADS[which].label}`;
      verdict.textContent = ROADS[which].claimed
        ? 'รอบนี้บังเอิญตรงกับที่อ้าง แต่รอบหน้าก็ยังเป็นเส้นอื่นได้อยู่ดี'
        : 'ข้อสรุปที่ว่าต้องเป็นฝนตก ผิดในรอบนี้ · และมันผิดได้ทุกรอบที่มีทางอื่น';
    }
  });
}
