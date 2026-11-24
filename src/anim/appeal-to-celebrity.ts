// Appeal to celebrity: the signature slides over the claim and the whole thing
// looks convincing. Slide it off again and the claim underneath has exactly as
// many lines of evidence as it had before, which is none.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease, wobble } from './lib/motion.ts';

const stage = document.querySelector('#celebrity-stage');
if (stage) {
  const W = 680, H = 296;
  const RED = '#b3412d', OK = '#2f6d4f';
  const CARD = { x: 150, y: 86, w: 380, h: 116 };
  const CYCLE = 7.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ลายเซ็นคนดังเลื่อนมาทับข้อความ แล้วเลื่อนออกไป ข้อความยังว่างเปล่าเท่าเดิม',
  });
  const { filter } = inkDefs(svg, 'ce');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'ce-t' }, scene);

  shape(scene, 1.4).setAttribute(
    'd', `M${CARD.x} ${CARD.y} L${CARD.x + CARD.w} ${CARD.y} L${CARD.x + CARD.w} ${CARD.y + CARD.h} L${CARD.x} ${CARD.y + CARD.h}Z`);
  const claim = el('text', { x: CARD.x + CARD.w / 2, y: CARD.y + 38, 'text-anchor': 'middle', 'font-size': 14, fill: 'currentColor', class: 'ce-t' }, scene);
  claim.textContent = 'อาหารเสริมนี้ทำให้สูงขึ้นจริง';

  // the evidence slot underneath, which is what actually matters
  const slot = el('text', { x: CARD.x + CARD.w / 2, y: CARD.y + 68, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.6, class: 'ce-t' }, scene);
  slot.textContent = 'หลักฐานที่แนบมา';
  const lines = [0, 1, 2].map((i) =>
    el('line', {
      x1: CARD.x + 70, x2: CARD.x + CARD.w - 70, y1: CARD.y + 84 + i * 12, y2: CARD.y + 84 + i * 12,
      stroke: 'currentColor', 'stroke-width': 1, opacity: 0.3, 'stroke-dasharray': '5 5',
    }, scene));
  const count = el('text', { x: CARD.x + CARD.w + 18, y: CARD.y + 96, 'font-size': 12, fill: RED, class: 'ce-t' }, scene);
  count.textContent = '0 บรรทัด';

  // the signature, drawn as one long stroke that writes itself on
  const sig = pen(scene, 2.6);
  sig.setAttribute('stroke', 'var(--hl)');
  const sigPath =
    'M-120 16 C-100 -22 -84 -24 -78 2 C-72 26 -60 26 -52 -2 C-46 -22 -32 -22 -28 4' +
    ' C-24 26 -8 24 2 0 C12 -24 30 -20 34 4 C38 24 56 26 70 2 C80 -14 100 -16 118 6';
  sig.setAttribute('d', sigPath);
  const sigLen = sig.getTotalLength ? sig.getTotalLength() : 520;
  sig.setAttribute('stroke-dasharray', f(sigLen));
  const sigG = el('g', {}, scene);
  sigG.appendChild(sig);
  // beside the signature, not under it, where the evidence lines are
  const who = el('text', { x: 134, y: 10, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'ce-t' }, sigG);
  who.textContent = 'ดาราที่เราชอบ';

  const note = el('text', { x: 36, y: 262, 'font-size': 12.5, fill: 'currentColor', class: 'ce-t' }, scene);
  const after = el('text', { x: 36, y: 284, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'ce-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < 3.6 ? 3.6 : 0; });

  run((t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // 0–1.0 bare · 1.0–2.6 the signature arrives and writes · 2.6–4.4 it sits
    // there looking convincing · 4.4– it slides off and nothing has changed
    const arrive = ease(Math.min(1, Math.max(0, (k - 1.0) / 1.0)));
    const leave = ease(Math.min(1, Math.max(0, (k - 4.4) / 1.2)));
    const sx = CARD.x + CARD.w / 2 + (1 - arrive) * 440 + leave * 460;
    const sy = CARD.y + 58 + wobble(t * 0.5) * 1.5;
    sigG.setAttribute('transform', `translate(${f(sx)} ${f(sy)})`);
    sigG.setAttribute('opacity', f(Math.min(arrive, 1 - leave * 0.96)));

    const written = ease(Math.min(1, Math.max(0, (k - 1.6) / 1.0)));
    sig.setAttribute('stroke-dashoffset', f(sigLen * (1 - written)));

    // the evidence lines never fill in, whatever is lying across them
    lines.forEach((l) => l.setAttribute('opacity', '0.3'));
    count.setAttribute('fill', RED);

    headline.textContent = k < 1.0
      ? 'ข้อความนี้ยังไม่มีหลักฐานแนบมาเลย'
      : k < 4.4 ? 'ลายเซ็นมาถึงแล้ว และมันดูน่าเชื่อขึ้นทันที'
        : 'เอาลายเซ็นออก แล้วดูอีกที';
    note.textContent = k >= 4.4 && leave > 0.5
      ? 'ช่องหลักฐานมีเท่าเดิมคือศูนย์บรรทัด ลายเซ็นไม่ได้เติมอะไรลงไปในนั้นเลย'
      : 'ความน่าเชื่อที่เพิ่มขึ้นมาจากคนเซ็น ไม่ได้มาจากสิ่งที่เขียนอยู่ข้างใต้';
    after.textContent = 'คลิกเพื่อข้ามไปดูตอนลายเซ็นถูกเอาออก';
  });
}
