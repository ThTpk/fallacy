// Equivocation as one key and two locks. The argument needs the same word to
// open both premises. Watch the teeth: the key has to be recut between the two
// locks, and a key that has been recut is not the same key any more.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#equivocation-stage');
if (stage) {
  const W = 680, H = 300;
  const RED = '#b3412d', OK = '#2f6d4f';
  const LOCKS = [
    { x: 196, label: 'ข้ออ้างที่หนึ่ง', text: 'ทำจากธรรมชาติ', sense: 'ไม่ผ่านการสังเคราะห์', teeth: [10, 4, 9, 3] },
    { x: 470, label: 'ข้ออ้างที่สอง', text: 'ของธรรมชาติปลอดภัย', sense: 'ปลอดภัยต่อร่างกาย', teeth: [3, 11, 4, 10] },
  ];
  const LY = 150, CYCLE = 7.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น กุญแจดอกเดียวที่ต้องเปลี่ยนรูปฟันจึงจะไขได้ทั้งสองล็อก',
  });
  const { filter } = inkDefs(svg, 'eq');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'eq-t' }, scene);

  LOCKS.forEach((l) => {
    // a padlock: shackle over a body
    pen(scene, 2).setAttribute('d', `M${l.x - 20} ${LY - 20} L${l.x - 20} ${LY - 40} a20 20 0 0 1 40 0 L${l.x + 20} ${LY - 20}`);
    shape(scene, 1.6).setAttribute('d', `M${l.x - 34} ${LY - 20} L${l.x + 34} ${LY - 20} L${l.x + 34} ${LY + 38} L${l.x - 34} ${LY + 38}Z`);
    // the keyway
    pen(scene, 1.6).setAttribute('d', `M${l.x} ${LY + 2} L${l.x} ${LY + 24}`);
    el('circle', { cx: l.x, cy: LY - 2, r: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }, scene);

    const a = el('text', { x: l.x, y: LY - 62, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'eq-t' }, scene);
    a.textContent = l.label;
    const b = el('text', { x: l.x, y: LY + 62, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'eq-t' }, scene);
    b.textContent = l.text;
    const c = el('text', { x: l.x, y: LY + 82, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'eq-t' }, scene);
    c.textContent = `คำนี้ในที่นี้แปลว่า ${l.sense}`;
  });

  // the key: one word, carried from the first premise to the second
  const keyG = el('g', {}, scene);
  const blade = shape(keyG, 1.5);
  const bow = pen(keyG, 1.8);
  bow.setAttribute('d', 'M-54 0 a13 13 0 1 0 0.1 0Z');
  const word = el('text', {
    x: -54, y: -24, 'text-anchor': 'middle', 'font-size': 13,
    fill: 'currentColor', 'font-weight': 500, class: 'eq-t',
  }, keyG);
  word.textContent = 'ธรรมชาติ';

  const recut = el('text', { x: 340, y: LY - 84, 'text-anchor': 'middle', 'font-size': 12.5, fill: RED, opacity: 0, class: 'eq-t' }, scene);
  recut.textContent = 'ฟันกุญแจถูกตัดใหม่ตรงนี้';

  const note = el('text', { x: 36, y: 282, 'font-size': 12.5, fill: 'currentColor', class: 'eq-t' }, scene);

  /** the blade, with teeth cut to the given depths */
  const cut = (depths: number[]) => {
    let d = `M-41 -7 L10 -7 L10 7`;
    depths.forEach((t, i) => {
      const x = 10 - i * 12;
      d += ` L${x} ${f(7 - t)} L${x - 6} ${f(7 - t)} L${x - 6} 7 L${x - 12} 7`;
    });
    return d + ' L-41 7Z';
  };
  const lerp = (a: number[], b: number[], u: number) => a.map((v, i) => v + (b[i] - v) * u);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < 2.6 ? 2.6 : 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // 0–2.2 in the first lock · 2.2–4.0 travelling and being recut · 4.0– in the second
    const move = ease(Math.min(1, Math.max(0, (k - 2.2) / 1.8)));
    const x = LOCKS[0].x + (LOCKS[1].x - LOCKS[0].x) * move;
    keyG.setAttribute('transform', `translate(${f(x)} ${LY + 12})`);
    blade.setAttribute('d', cut(lerp(LOCKS[0].teeth, LOCKS[1].teeth, move)));

    const cutting = move > 0.08 && move < 0.92;
    recut.setAttribute('opacity', f(cutting ? 1 : 0));
    blade.setAttribute('stroke', cutting ? RED : OK);

    headline.textContent = move < 0.08
      ? 'กุญแจดอกนี้ไขล็อกแรกได้พอดี'
      : cutting ? 'ระหว่างทาง ฟันกุญแจถูกตัดใหม่'
        : 'ไขล็อกที่สองได้แล้ว ด้วยกุญแจที่ไม่ใช่ดอกเดิม';
    note.textContent = move > 0.92
      ? 'ข้อโต้แย้งต้องใช้คำเดียวกันตลอด ถ้าต้องตัดฟันใหม่กลางทาง ข้ออ้างสองข้อก็พูดถึงคนละเรื่อง'
      : 'คำบนหัวกุญแจไม่เปลี่ยน สิ่งที่เปลี่ยนคือรูปฟันข้างล่าง · คลิกเพื่อข้ามไปดู';
  });
}
