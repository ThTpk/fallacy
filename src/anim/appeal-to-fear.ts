// Appeal to fear: the shadow grows until it fills the frame, and the two
// boxes it was supposed to tick stay empty the whole time. Click and the
// shadow shrinks away, leaving them exactly as empty as before.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, wobble } from './lib/motion.ts';

const stage = document.querySelector('#fear-stage');
if (stage) {
  const W = 680, H = 320;
  const RED = '#b3412d';
  const QX = 300, Q1 = 142, Q2 = 196;
  const CYCLE = 9.6;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เงาที่โตขึ้นเรื่อย ๆ ขณะที่ช่องคำถามสองช่องยังว่างอยู่',
  });
  const { filter } = inkDefs(svg, 'fr');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // the shadow sits behind everything else
  const shadow = el('path', { fill: RED, opacity: 0 }, scene);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'fr-t' }, scene);

  const claim = shape(scene, 1.3);
  claim.setAttribute('d', 'M60 66 L620 66 L620 108 L60 108Z');
  const claimT = el('text', { x: 340, y: 93, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'currentColor', class: 'fr-t' }, scene);
  claimT.textContent = 'ถ้าไม่ทำตามนี้ จะเกิดเรื่องร้ายแรง';

  const box = (y: number, label: string) => {
    const b = pen(scene, 1.8);
    b.setAttribute('d', `M${QX - 42} ${y - 13} L${QX - 16} ${y - 13} L${QX - 16} ${y + 13} L${QX - 42} ${y + 13}Z`);
    const t = el('text', { x: QX, y: y + 5, 'font-size': 13, fill: 'currentColor', class: 'fr-t' }, scene);
    t.textContent = label;
    const mark = el('text', {
      x: QX - 29, y: y + 6, 'text-anchor': 'middle', 'font-size': 15,
      fill: RED, opacity: 0, class: 'fr-t',
    }, scene);
    mark.textContent = '—';
    return mark;
  };
  const m1 = box(Q1, 'เรื่องร้ายนั้นจะเกิดจริงไหม และโอกาสเท่าไร');
  const m2 = box(Q2, 'สิ่งที่เสนอมา ป้องกันมันได้จริงหรือเปล่า');

  const stamp = el('text', { x: 340, y: 252, 'text-anchor': 'middle', 'font-size': 14, fill: RED, opacity: 0, class: 'fr-t' }, scene);
  stamp.textContent = 'ข้อเสนอผ่านแล้ว';

  const note = el('text', { x: 36, y: 300, 'font-size': 12.5, fill: 'currentColor', class: 'fr-t' }, scene);

  const grow = spring(9, 5, 0);
  let k = 0, pushed = false;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { pushed = !pushed; });

  run((t, dt) => {
    k += dt;
    if (k > CYCLE) { k = 0; pushed = false; }

    // it swells on its own, and the click is the only thing that shrinks it
    const want = pushed ? 0 : Math.min(1, Math.max(0, (k - 1.0) / 3.2));
    const g = grow.step(want, dt);

    const r = 20 + g * 300;
    const cx = 340 + wobble(t * 0.4) * 10;
    shadow.setAttribute('d', `M${f(cx - r)} 320 a${f(r)} ${f(r * 0.86)} 0 1 1 ${f(r * 2)} 0Z`);
    shadow.setAttribute('opacity', f(g * 0.3));

    // whatever the shadow does, these never fill in
    m1.setAttribute('opacity', '0.8');
    m2.setAttribute('opacity', '0.8');
    stamp.setAttribute('opacity', f(g > 0.75 ? (g - 0.75) * 4 : 0));

    headline.textContent = g < 0.12
      ? 'ยังไม่มีใครตอบสองข้อนี้'
      : pushed || g < 0.5 ? 'เอาความกลัวออก แล้วดูสองช่องนี้อีกที'
        : 'ยิ่งกลัว ข้อเสนอยิ่งดูผ่าน';
    note.textContent = g > 0.75
      ? 'ช่องทั้งสองยังเป็นขีดอยู่เหมือนเดิม ไม่มีอะไรถูกตอบระหว่างทาง · คลิกเพื่อหรี่ความกลัวลง'
      : 'คลิกเพื่อสลับระหว่างมีความกลัวกับไม่มี';
  });
}
