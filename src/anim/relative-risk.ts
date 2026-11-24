// Relative risk: the same two bars, twice. First on a scale chosen to make
// the drop fill the frame, then on the scale of the thing being measured.
// Nothing about the data changes between the two views except the axis.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#risk-stage');
if (stage) {
  const W = 680, H = 326;
  const RED = '#b3412d', OK = '#2f6d4f';
  const BEFORE = 2, AFTER = 1, PER = 1000000;   // 2 in a million, down to 1
  const BASE = 250, TOP = 96;                   // the floor and ceiling of the plot
  const BX = [214, 386], BW = 96;
  const CYCLE = 9.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น แท่งสองแท่งที่ดูใหญ่เมื่อย่อแกน และเล็กจนแทบไม่เห็นเมื่อใช้แกนจริง',
  });
  const { filter } = inkDefs(svg, 'rr');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'rr-t' }, scene);

  pen(scene, 1.4).setAttribute('d', `M150 ${BASE} L560 ${BASE}`);
  pen(scene, 1.4).setAttribute('d', `M150 ${BASE} L150 ${TOP - 10}`);
  const axisTop = el('text', { x: 142, y: TOP - 2, 'text-anchor': 'end', 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'rr-t' }, scene);
  const axisMid = el('text', { x: 142, y: (TOP + BASE) / 2 + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: 'currentColor', opacity: 0.55, class: 'rr-t' }, scene);

  const bars = [BEFORE, AFTER].map((_, i) => {
    const r = shape(scene, 1.3);
    const cap = el('text', { x: BX[i] + BW / 2, y: BASE + 24, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'rr-t' }, scene);
    cap.textContent = i === 0 ? 'ก่อน' : 'หลัง';
    const val = el('text', { x: BX[i] + BW / 2, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', opacity: 0.8, class: 'rr-t' }, scene);
    return { r, val };
  });

  // the arrow that the headline is really about
  const drop = pen(scene, 1.8);
  drop.setAttribute('stroke', OK);
  const dropT = el('text', { x: 580, 'font-size': 12.5, fill: OK, class: 'rr-t' }, scene);
  dropT.textContent = 'ลด 50%';

  const note = el('text', { x: 36, y: 302, 'font-size': 12.5, fill: 'currentColor', class: 'rr-t' }, scene);

  // 1 = the axis stops just above the taller bar · 0 = the axis is the whole population
  const zoom = spring(14, 6, 1);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < 3.6 ? 3.6 : 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const near = k < 3.6;
    const z = zoom.step(near ? 1 : 0, dt);
    // the top of the axis, in the same units as the data
    const axisMax = BEFORE * 1.25 * z + PER * 0.00002 * (1 - z) + (1 - z) * 40;
    const h = (v: number) => Math.max(0.6, ((BASE - TOP) * v) / axisMax);

    [BEFORE, AFTER].forEach((v, i) => {
      const y = BASE - h(v);
      bars[i].r.setAttribute('d', `M${BX[i]} ${f(y)} L${BX[i] + BW} ${f(y)} L${BX[i] + BW} ${BASE} L${BX[i]} ${BASE}Z`);
      bars[i].val.setAttribute('y', f(y - 9));
      bars[i].val.setAttribute('opacity', f(z));
      bars[i].val.textContent = `${v} ในล้าน`;
    });

    const y0 = BASE - h(BEFORE), y1 = BASE - h(AFTER);
    drop.setAttribute('d', `M548 ${f(y0)} L548 ${f(y1)}`);
    drop.setAttribute('opacity', f(z));
    dropT.setAttribute('y', f((y0 + y1) / 2 + 4));
    dropT.setAttribute('opacity', f(z));

    axisTop.textContent = near ? `${f(axisMax)} ในล้าน` : '40 ในล้าน';
    axisTop.setAttribute('opacity', f(0.7));
    axisMid.textContent = near ? '' : '20 ในล้าน';

    headline.textContent = near
      ? 'บนแกนที่เลือกให้พอดีกับแท่ง การลดครึ่งหนึ่งดูใหญ่มาก'
      : 'บนแกนเดียวกับที่คนทั้งล้านยืนอยู่ สองแท่งนี้แทบไม่ต่างกัน';
    note.textContent = near
      ? 'ตัวเลขทุกตัวถูกต้อง · คลิกเพื่อดูแกนจริง'
      : 'ข้อมูลไม่เปลี่ยนเลย สิ่งที่เปลี่ยนคือแกน และแกนคือสิ่งที่พาดหัวไม่ได้บอก';
  });
}
