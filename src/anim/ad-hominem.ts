// Ad hominem: the argument is written on a card. A second card, carrying the
// speaker instead of the reasoning, slides over the top of it. Peel that away
// and the argument underneath has not changed a word — nobody has answered it,
// they have only covered it up.
import { el, shape, blot, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#adhom-stage');
if (stage) {
  const W = 680, H = 286;
  const CX = 150, CY = 88, CW = 380, CH = 124;
  const LOOP = 11, ON = 1.6, OFF = 7.0, SLIDE = 0.85;
  const RED = '#b3412d';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น การ์ดข้อโต้แย้งถูกการ์ดรูปผู้พูดเลื่อนมาปิดทับ คลิกเพื่อเลื่อนออก',
  });
  const { filter } = inkDefs(svg, 'ah');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // --- the argument, underneath the whole time -----------------------------
  const card = shape(scene, 1.15);
  card.setAttribute('d', `M${CX} ${CY} L${CX + CW} ${CY} L${CX + CW} ${CY + CH} L${CX} ${CY + CH}Z`);
  const tag = el('text', { x: CX + 18, y: CY + 26, 'font-size': 11.5, fill: 'currentColor', opacity: 0.65, class: 'ah-t' }, scene);
  tag.textContent = 'ข้อโต้แย้งที่เสนอมา';
  const L1 = el('text', { x: CX + 18, y: CY + 56, 'font-size': 14.5, fill: 'currentColor', class: 'ah-t' }, scene);
  L1.textContent = 'ตัวเลขสามปีย้อนหลังบอกว่าต้นทุนต่อหน่วยลดลง';
  const L2 = el('text', { x: CX + 18, y: CY + 80, 'font-size': 14.5, fill: 'currentColor', class: 'ah-t' }, scene);
  L2.textContent = 'ถ้าขยายกำลังผลิต ต้นทุนน่าจะลดลงอีก';
  const L3 = el('text', { x: CX + 18, y: CY + 106, 'font-size': 11.5, fill: 'currentColor', opacity: 0.6, class: 'ah-t' }, scene);
  L3.textContent = 'ตรวจได้จากงบที่แนบมา';

  // --- the cover: who said it, not what they said --------------------------
  const cover = el('g', {}, scene);
  const face = shape(cover, 1.15);
  face.setAttribute('d', `M${CX} ${CY} L${CX + CW} ${CY} L${CX + CW} ${CY + CH} L${CX} ${CY + CH}Z`);
  // a small bust, faceless as always
  const bust = shape(cover, 1.0);
  bust.setAttribute('d', `M${CX + 34} ${CY + 104} q0 -34 26 -34 q26 0 26 34Z`);
  el('ellipse', { cx: CX + 60, cy: CY + 56, rx: 15, ry: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.15 }, cover);
  const hair = blot(cover);
  hair.setAttribute('d', `M${CX + 45} ${CY + 46} q14 -16 30 -2 q-6 -10 -16 -10 q-12 0 -14 12Z`);
  const ctag = el('text', { x: CX + 108, y: CY + 32, 'font-size': 11.5, fill: RED, class: 'ah-t' }, cover);
  ctag.textContent = 'สิ่งที่ถูกพูดถึงแทน';
  const C1 = el('text', { x: CX + 108, y: CY + 60, 'font-size': 14.5, fill: 'currentColor', class: 'ah-t' }, cover);
  C1.textContent = 'เขาเคยทำธุรกิจเจ๊งมาก่อน';
  const C2 = el('text', { x: CX + 108, y: CY + 84, 'font-size': 14.5, fill: 'currentColor', class: 'ah-t' }, cover);
  C2.textContent = 'แถมยังเรียนไม่จบด้วย';
  const C3 = el('text', { x: CX + 108, y: CY + 108, 'font-size': 11.5, fill: 'currentColor', opacity: 0.6, class: 'ah-t' }, cover);
  C3.textContent = 'ทั้งสองข้อนี้อาจเป็นเรื่องจริง';

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'ah-t' }, scene);
  const foot = el('text', { x: 36, y: 254, 'font-size': 12.5, fill: 'currentColor', opacity: 0.7, class: 'ah-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = (k > ON + SLIDE && k < OFF) ? OFF : ON; });

  run((_t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;
    const on = k < ON ? 0
      : k < ON + SLIDE ? ease((k - ON) / SLIDE)
        : k < OFF ? 1
          : k < OFF + SLIDE ? 1 - ease((k - OFF) / SLIDE) : 0;

    // the cover slides in from the right and clips to the card's own width
    cover.setAttribute('transform', `translate(${f((1 - on) * (CW + 30))} 0)`);
    cover.setAttribute('opacity', f(on < 0.02 ? 0 : 1));

    headline.textContent = on > 0.5 ? 'คำตอบที่ได้พูดถึงแต่ตัวคน' : 'ข้อโต้แย้งที่ยังรออยู่';
    foot.textContent = on > 0.5
      ? 'ทั้งสองข้อข้างบนอาจจริง และก็ยังไม่แตะตัวเลขในการ์ดที่อยู่ข้างใต้เลย'
      : 'การ์ดใบเดิม ไม่มีคำไหนเปลี่ยน และยังไม่มีใครตอบมัน';
  });
}
