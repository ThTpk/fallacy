// Faulty analogy: three planks really do connect the two cases, and the cart
// crosses them happily. The fourth — the feature the conclusion actually rides
// on — was never there. Counting matching features is not the test.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#analogy-stage');
if (stage) {
  const W = 680, H = 286, DECK = 170;
  const LEFT_X = 36, LEFT_W = 164, RIGHT_X = 492, RIGHT_W = 152;
  const PLANKS = ['ทั้งคู่ทำงานหนัก', 'ทั้งคู่มีชิ้นส่วนสึก', 'ทั้งคู่ต้องบำรุงรักษา'];
  const MISSING = 'ความล้าทางชีวภาพ';
  const PW = 88, PGAP = 10, P0 = LEFT_X + LEFT_W + 6;
  const GAP_X = P0 + 3 * (PW + PGAP);
  const CYCLE = 5.2, ROLL = 2.4;
  const RED = '#b3412d';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น รถเข็นวิ่งข้ามสะพานสามแผ่นแล้วตกตรงช่องที่ไม่มีแผ่นที่สี่',
  });
  const { filter } = inkDefs(svg, 'fa');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const pier = (x: number, w: number, head: string, body: string) => {
    shape(scene, 1.15).setAttribute('d', `M${x} ${DECK} L${x + w} ${DECK} L${x + w} ${H - 24} L${x} ${H - 24}Z`);
    const a = el('text', { x: x + w / 2, y: DECK + 26, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.66, class: 'fa-t' }, scene);
    a.textContent = head;
    const b = el('text', { x: x + w / 2, y: DECK + 46, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'fa-t' }, scene);
    b.textContent = body;
  };
  pier(LEFT_X, LEFT_W, 'กรณีที่เรารู้', 'ร่างกายคนต้องพัก');
  pier(RIGHT_X, RIGHT_W, 'กรณีที่กำลังสรุป', 'เครื่องจักรต้องพัก');

  PLANKS.forEach((t, i) => {
    const x = P0 + i * (PW + PGAP);
    shape(scene, 1.1).setAttribute('d', `M${x} ${DECK} L${x + PW} ${DECK} L${x + PW} ${DECK + 9} L${x} ${DECK + 9}Z`);
    const lab = el('text', { x: x + PW / 2, y: DECK - 10, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'currentColor', opacity: 0.7, class: 'fa-t' }, scene);
    lab.textContent = t;
  });
  // the plank that is not there
  const ghost = pen(scene, 1.1);
  ghost.setAttribute('stroke', RED);
  ghost.setAttribute('stroke-dasharray', '5 5');
  ghost.setAttribute('d', `M${GAP_X} ${DECK} L${GAP_X + PW} ${DECK} M${GAP_X} ${DECK + 9} L${GAP_X + PW} ${DECK + 9}`);
  const ghostLab = el('text', { x: GAP_X + PW / 2, y: DECK - 10, 'text-anchor': 'middle', 'font-size': 10.5, fill: RED, class: 'fa-t' }, scene);
  ghostLab.textContent = MISSING;

  const cartG = el('g', {}, scene);
  const box = shape(cartG, 1.15);
  box.setAttribute('d', 'M-17 -14 L17 -14 L17 0 L-17 0Z');
  el('circle', { cx: -9, cy: 4, r: 4.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }, cartG);
  el('circle', { cx: 9, cy: 4, r: 4.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }, cartG);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'fa-t' }, scene);
  const sub = el('text', { x: 36, y: 62, 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'fa-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const u = Math.min(1, k / ROLL);
    const startX = LEFT_X + 34, endX = GAP_X + 26;
    const x = startX + (endX - startX) * u;
    const past = Math.max(0, x - (GAP_X + 2));
    const fall = past > 0 ? Math.pow(past / 26, 2) * 96 : 0;
    const tip = past > 0 ? Math.min(42, past * 2.2) : 0;
    cartG.setAttribute('transform', `translate(${f(x)} ${f(DECK - 4 + fall)}) rotate(${f(tip)})`);
    cartG.setAttribute('opacity', f(fall > 80 ? Math.max(0, 1 - (fall - 80) / 20) : 1));

    const crossed = x > GAP_X;
    headline.textContent = crossed ? 'ข้อที่ต่างกัน คือข้อที่ข้อสรุปต้องใช้' : 'สามข้อแรกเหมือนกันจริง';
    sub.textContent = crossed
      ? 'คนล้าเพราะชีววิทยา เครื่องจักรไม่มีกลไกนั้น สะพานจึงขาดตรงนี้'
      : 'นับข้อที่เหมือนกันได้เรื่อย ๆ แต่นั่นไม่ใช่เกณฑ์ตัดสิน';
  });
}
