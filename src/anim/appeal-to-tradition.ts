// Appeal to tradition: two practices of the same age, drawn as two bars that
// grow along the same century. One worked and one killed people, and the bars
// are the same length the whole way.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#tradition-stage');
if (stage) {
  const W = 680, H = 316;
  const RED = '#b3412d', OK = '#2f6d4f';
  const X0 = 150, X1 = 592;
  const ROWS = [
    { label: 'ล้างมือก่อนทำคลอด', verdict: 'ได้ผลจริง', ok: true, y: 132 },
    { label: 'ปล่อยเลือดรักษาโรค', verdict: 'ฆ่าคนมาตลอด', ok: false, y: 206 },
  ];
  const YEARS = 2000, GROW = 4.6, HOLD = 2.8;
  const CYCLE = GROW + HOLD;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ธรรมเนียมสองอย่างอายุเท่ากัน อันหนึ่งได้ผล อีกอันไม่ได้ผล',
  });
  const { filter } = inkDefs(svg, 'tdn');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'tdn-t' }, scene);
  const clock = el('text', { x: 36, y: 68, 'font-size': 12.5, fill: 'currentColor', opacity: 0.7, class: 'tdn-t' }, scene);

  pen(scene, 1.1).setAttribute('d', `M${X0} 92 L${X1} 92`);
  const axisL = el('text', { x: X0, y: 84, 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'tdn-t' }, scene);
  axisL.textContent = 'เริ่มทำ';
  const axisR = el('text', { x: X1, y: 84, 'text-anchor': 'end', 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'tdn-t' }, scene);
  axisR.textContent = 'วันนี้';

  const rows = ROWS.map((r) => {
    const t = el('text', { x: 36, y: r.y + 5, 'font-size': 13, fill: 'currentColor', class: 'tdn-t' }, scene);
    t.textContent = r.label;
    pen(scene, 1).setAttribute('d', `M${X0} ${r.y} L${X1} ${r.y}`);
    const bar = pen(scene, 9);
    bar.setAttribute('stroke', 'var(--hl)');
    bar.setAttribute('stroke-linecap', 'round');
    const v = el('text', {
      x: X1 + 8, y: r.y + 5, 'font-size': 12,
      fill: r.ok ? OK : RED, opacity: 0, class: 'tdn-t',
    }, scene);
    v.textContent = r.verdict;
    return { bar, v, y: r.y };
  });

  const note = el('text', { x: 36, y: 268, 'font-size': 13, fill: 'currentColor', class: 'tdn-t' }, scene);
  const sub = el('text', { x: 36, y: 292, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'tdn-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const u = ease(Math.min(1, k / GROW));
    const x = X0 + (X1 - X0) * u;
    rows.forEach((r) => {
      r.bar.setAttribute('d', `M${X0} ${r.y} L${f(x)} ${r.y}`);
      r.v.setAttribute('opacity', f(u >= 1 ? Math.min(1, (k - GROW) / 0.5) : 0));
    });

    const years = Math.round(YEARS * u);
    clock.textContent = `ทำกันมาแล้ว ${years} ปี`;

    const done = u >= 1;
    headline.textContent = done
      ? 'อายุเท่ากันเป๊ะ แต่ผลคนละเรื่อง'
      : 'ธรรมเนียมสองอย่าง เริ่มพร้อมกัน และยังอยู่ทั้งคู่';
    note.textContent = done
      ? 'แถบสองแถบยาวเท่ากันตลอดทาง ความยาวจึงไม่ใช่สิ่งที่แยกสองอันนี้ออกจากกัน'
      : 'ดูว่าแถบไหนจะยาวกว่า';
    sub.textContent = done
      ? 'สิ่งที่แยกได้คือผลที่วัดได้ ซึ่งไม่ได้อยู่บนแกนนี้เลย · คลิกเพื่อดูใหม่'
      : 'คลิกเพื่อเริ่มใหม่';
  });
}
