// Quoting out of context: a frame slides along the sentence and closes on
// three words. Those three words lift out and stand on their own, saying the
// opposite of the sentence they came from. Nothing is rewritten.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease, spring } from './lib/motion.ts';

const stage = document.querySelector('#context-stage');
if (stage) {
  const W = 680, H = 316;
  const RED = '#b3412d', OK = '#2f6d4f';
  const WORDS = ['ไม่มีหลักฐานใดบอกว่า', 'สินค้านี้', 'อันตราย'];
  const CLIP = [1, 2];                 // the words the frame closes on
  const BASE = 132, GAP = 14;
  const CYCLE = 8.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น กรอบเลื่อนมาคร่อมคำบางคำในประโยค แล้วยกคำเหล่านั้นออกไปยืนเดี่ยว ๆ',
  });
  const { filter } = inkDefs(svg, 'qc');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'qc-t' }, scene);
  const srcT = el('text', { x: 36, y: 96, 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'qc-t' }, scene);
  srcT.textContent = 'สิ่งที่เขาพูดจริง';

  const nodes = WORDS.map((w) => {
    const t = el('text', { y: BASE, 'font-size': 16, fill: 'currentColor', class: 'qc-t' }, scene);
    t.textContent = w;
    return t;
  });

  const frame = pen(scene, 2);
  frame.setAttribute('stroke', RED);
  const lifted = el('g', { opacity: 0 }, scene);
  const liftedBox = shape(lifted, 1.4);
  const liftedT = el('text', {
    x: 0, y: 6, 'text-anchor': 'middle', 'font-size': 16,
    fill: 'currentColor', class: 'qc-t',
  }, lifted);
  liftedT.textContent = CLIP.map((i) => WORDS[i]).join('');

  const outT = el('text', { x: 340, y: 254, 'text-anchor': 'middle', 'font-size': 12, fill: RED, opacity: 0, class: 'qc-t' }, scene);
  outT.textContent = 'สิ่งที่ถูกเอาไปเผยแพร่';

  const note = el('text', { x: 36, y: 294, 'font-size': 12.5, fill: 'currentColor', class: 'qc-t' }, scene);

  let xs: number[] = [], ws: number[] = [];
  function layout() {
    ws = nodes.map((n) => n.getBBox().width);
    const total = ws.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1);
    let x = (W - total) / 2;
    xs = [];
    nodes.forEach((n, i) => { n.setAttribute('x', f(x)); xs.push(x); x += ws[i] + GAP; });
  }
  layout();
  document.fonts?.ready.then(layout);

  const sx = spring(24, 7), sw = spring(24, 7);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const clipL = xs[CLIP[0]] - 6;
    const clipR = xs[CLIP[CLIP.length - 1]] + ws[CLIP[CLIP.length - 1]] + 6;
    // the frame starts around the whole sentence and closes onto the clip
    const closing = Math.min(1, Math.max(0, (k - 1.2) / 1.4));
    const fullL = xs[0] - 6, fullR = xs[xs.length - 1] + ws[ws.length - 1] + 6;
    const l = sx.step(fullL + (clipL - fullL) * ease(closing), dt);
    const r = sw.step(fullR + (clipR - fullR) * ease(closing), dt);
    frame.setAttribute('d', `M${f(l)} ${BASE - 26} L${f(l)} ${BASE + 12} M${f(r)} ${BASE - 26} L${f(r)} ${BASE + 12} M${f(l)} ${BASE - 26} L${f(r)} ${BASE - 26} M${f(l)} ${BASE + 12} L${f(r)} ${BASE + 12}`);
    frame.setAttribute('opacity', f(k > 0.6 ? 1 : 0));

    // then the framed words lift out and stand alone
    const lift = ease(Math.min(1, Math.max(0, (k - 3.2) / 1.3)));
    const cw = clipR - clipL;
    liftedBox.setAttribute('d', `M${f(-cw / 2 - 10)} -24 L${f(cw / 2 + 10)} -24 L${f(cw / 2 + 10)} 18 L${f(-cw / 2 - 10)} 18Z`);
    lifted.setAttribute('transform', `translate(${f((clipL + clipR) / 2 + (340 - (clipL + clipR) / 2) * lift)} ${f(BASE + (212 - BASE) * lift)})`);
    lifted.setAttribute('opacity', f(lift));

    nodes.forEach((n, i) => {
      const clipped = CLIP.includes(i);
      n.setAttribute('opacity', f(clipped ? 1 - lift * 0.78 : lift > 0.2 ? 0.34 : 1));
    });

    outT.setAttribute('opacity', f(lift > 0.8 ? 1 : 0));

    headline.textContent = k < 1.2
      ? 'ประโยคเต็มที่เขาพูด'
      : lift < 0.1 ? 'กรอบหุบลงมาคร่อมสามคำ'
        : 'สามคำนั้นยืนอยู่ได้เอง และพูดตรงข้ามกับประโยคที่มันมาจาก';
    note.textContent = lift > 0.8
      ? 'ไม่มีคำไหนถูกเปลี่ยนเลยสักคำ สิ่งที่หายไปคือคำที่อยู่ข้างหน้า · คลิกเพื่อดูใหม่'
      : 'คำทุกคำในกรอบเป็นคำที่เขาพูดจริง';
  });
}
