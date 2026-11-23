// False dilemma: two doors are offered, and a marker hops between them as if
// that were the whole choice. The wall between them turns out to be a curtain:
// it lifts, and three doors that were there all along are standing in the gap.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#dilemma-stage');
if (stage) {
  const W = 680, H = 300, FLOOR = 252, TOP = 104, DW = 96, DH = FLOOR - TOP;
  const LOOP = 13, SHOW = 4.6, HIDE = 10.6, FADE = 1.2;
  const DX = [24, 156, 288, 420, 552];
  const LABEL = ['เปิดเต็มที่ทุกอย่าง', 'เปิดบางส่วน', 'เปิดแบบมีเงื่อนไข', 'เปิดเป็นขั้นตามเวลา', 'ปิดทั้งหมด'];
  const OFFERED = [0, 4];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ประตูสองบานถูกยื่นให้เลือก แล้วผนังตรงกลางเปิดออกเผยว่ามีอีกสามบาน',
  });
  const { filter } = inkDefs(svg, 'fd');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${FLOOR} L${W} ${FLOOR}`);

  const doors = DX.map((x, i) => {
    const g = el('g', {}, scene);
    const leaf = shape(g, 1.15);
    leaf.setAttribute('d', `M${x} ${FLOOR} L${x} ${TOP + 8} Q${x + DW / 2} ${TOP - 4} ${x + DW} ${TOP + 8} L${x + DW} ${FLOOR}Z`);
    const panel = pen(g, 0.6);
    panel.setAttribute('d', `M${x + 14} ${TOP + 30} L${x + DW - 14} ${TOP + 30} L${x + DW - 14} ${FLOOR - 70} L${x + 14} ${FLOOR - 70}Z M${x + 14} ${FLOOR - 56} L${x + DW - 14} ${FLOOR - 56} L${x + DW - 14} ${FLOOR - 16} L${x + 14} ${FLOOR - 16}Z`);
    el('circle', { cx: x + DW - 20, cy: FLOOR - 82, r: 2.6, fill: 'currentColor' }, g);
    const cap = el('text', { x: x + DW / 2, y: TOP - 14, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', class: 'fd-t' }, g);
    cap.textContent = LABEL[i];
    return { g, hidden: !OFFERED.includes(i) };
  });

  // the "wall" that hides the middle three: hatched, and really a curtain
  const wall = el('g', {}, scene);
  const slab = shape(wall, 1.1);
  slab.setAttribute('d', `M${DX[1] - 14} ${FLOOR} L${DX[1] - 14} ${TOP - 2} L${DX[3] + DW + 14} ${TOP - 2} L${DX[3] + DW + 14} ${FLOOR}Z`);
  const hatch = pen(wall, 0.5);
  hatch.setAttribute('d', Array.from({ length: 22 }, (_, i) => `M${DX[1] - 14 + i * 18} ${FLOOR} l26 -${DH}`).join(' '));
  const wallCap = el('text', { x: (DX[1] + DX[3] + DW) / 2, y: TOP + 42, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'fd-t' }, wall);
  wallCap.textContent = 'มีแค่สองทางให้เลือก';

  // the marker that hops between the two on offer
  const mark = el('g', {}, scene);
  const chev = pen(mark, 1.6);
  chev.setAttribute('d', 'M-7 -6 L0 2 L7 -6');
  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'fd-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (k < SHOW || k > HIDE) k = SHOW; });

  run((t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;
    const open = k < SHOW ? 0
      : k < SHOW + FADE ? ease((k - SHOW) / FADE)
        : k < HIDE ? 1
          : k < HIDE + FADE ? 1 - ease((k - HIDE) / FADE) : 0;

    // the curtain lifts rather than dissolving, so it reads as something removed
    wall.setAttribute('opacity', f(1 - open));
    wall.setAttribute('transform', `translate(0 ${f(-open * (DH + 10))})`);
    doors.forEach((d, i) => { if (d.hidden) d.g.setAttribute('opacity', f(open)); });

    headline.textContent = open > 0.5
      ? 'ทางเลือกที่อยู่ตรงนั้นมาตลอด'
      : 'ข้ออ้างยื่นมาสองทาง';

    // before the reveal the marker hops between the two poles; after, it walks
    // the whole row, because every door is a live option
    const n = open > 0.5 ? DX.length : 2;
    const idx = open > 0.5 ? Math.floor(t / 0.9) % n : OFFERED[Math.floor(t / 1.15) % 2];
    const x = DX[open > 0.5 ? idx : idx] + DW / 2;
    const hop = Math.abs(Math.sin(t * Math.PI * (open > 0.5 ? 1.11 : 0.87))) * 7;
    mark.setAttribute('transform', `translate(${f(x)} ${f(TOP - 30 - hop)})`);
  });
}
