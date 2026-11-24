// Base rate neglect: screen a thousand people and only draw the ones the test
// flags. Both columns are drawn one dot per person, so the count on the
// readout is the count on the screen, and the pile on the right wins by ten.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';

const stage = document.querySelector('#baserate-stage');
if (stage) {
  const W = 680, H = 330;
  const RED = '#b3412d';
  const SCREENED = 1000;          // people put through the test
  const SICK = 10;                // 1 in 100 of them actually have it
  const FALSE_POS = 100;          // 1% of the 990 healthy, rounded
  const RUN = 9.0, HOLD = 2.6;

  // left column: the true positives. right column: the false ones.
  const L = { x: 108, w: 2, cols: 2 };
  const R = { x: 352, cols: 10 };
  const TOP = 118, GAP = 17;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ผลตรวจเป็นบวกสองกอง กองที่ไม่ป่วยสูงกว่ากองที่ป่วยจริงสิบเท่า',
  });
  const { filter } = inkDefs(svg, 'br');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'br-t' }, scene);
  const counter = el('text', { x: 36, y: 68, 'font-size': 12.5, fill: 'currentColor', opacity: 0.7, class: 'br-t' }, scene);

  const colLabel = (x: string | number, t: string, sub: string, colour: string) => {
    const a = el('text', { x, y: 98, 'font-size': 13, fill: colour, class: 'br-t' }, scene);
    a.textContent = t;
    const b = el('text', { x, y: 116, 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'br-t' }, scene);
    b.textContent = sub;
  };
  colLabel(L.x, 'ป่วยจริง', 'ผลบวกถูกต้อง', 'var(--hl)');
  colLabel(R.x, 'ไม่ป่วย', 'ผลบวกลวง', RED);

  const dot = (x: number, y: number, fill: string, stroke: string) =>
    el('circle', { cx: x, cy: y, r: 5.5, fill, stroke, 'stroke-width': 1.3, opacity: 0 }, scene);

  const sick = Array.from({ length: SICK }, (_, i) =>
    dot(L.x + 8 + (i % L.cols) * GAP, TOP + 14 + Math.floor(i / L.cols) * GAP, 'var(--hl-bg)', 'var(--hl)'));
  const well = Array.from({ length: FALSE_POS }, (_, i) =>
    dot(R.x + 8 + (i % R.cols) * GAP, TOP + 14 + Math.floor(i / R.cols) * GAP, 'none', RED));

  const verdict = el('text', { x: 36, y: 306, 'font-size': 13.5, fill: 'currentColor', class: 'br-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > RUN + HOLD) k = 0;

    const u = Math.min(1, k / RUN);
    const screened = Math.round(SCREENED * u);
    const nSick = Math.min(SICK, Math.floor(SICK * u + 0.0001));
    const nWell = Math.min(FALSE_POS, Math.floor(FALSE_POS * u + 0.0001));

    sick.forEach((d, i) => d.setAttribute('opacity', f(i < nSick ? 1 : 0)));
    well.forEach((d, i) => d.setAttribute('opacity', f(i < nWell ? 1 : 0)));

    const pos = nSick + nWell;
    headline.textContent = 'ชุดตรวจแม่น 99% และโรคนี้พบ 1 ใน 100 คน';
    counter.textContent = `ตรวจไปแล้ว ${screened} คน · ผลเป็นบวก ${pos} คน`;
    verdict.textContent = pos === 0
      ? 'ยังไม่มีผลบวกออกมา · คลิกเพื่อเริ่มใหม่'
      : `ในคนที่ผลบวก ${pos} คน ป่วยจริง ${nSick} คน คิดเป็น ${((nSick / pos) * 100).toFixed(0)}% ไม่ใช่ 99%`;
  });
}
