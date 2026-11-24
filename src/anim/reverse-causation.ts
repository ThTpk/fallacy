// Reverse causation: the claimed arrow is drawn above the pipe, and the water
// in the pipe runs the other way. The paddle wheel settles the argument,
// because it only turns the way the flow actually goes.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#reverse-stage');
if (stage) {
  const W = 680, H = 300;
  const RED = '#b3412d', OK = '#2f6d4f';
  const PIPE_Y = 182, LX = 212, RX = 468;
  const TANK = { w: 152, h: 108, y: 128 };
  const WHEEL: [number, number] = [340, PIPE_Y];
  const CYCLE = 8.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ลูกศรที่อ้างชี้ไปทางหนึ่ง แต่น้ำในท่อไหลสวนทาง และกังหันหมุนตามน้ำ',
  });
  const { filter } = inkDefs(svg, 'rc');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'rc-t' }, scene);

  const tank = (cx: number, label: string, sub: string) => {
    shape(scene, 1.5).setAttribute(
      'd', `M${cx - TANK.w / 2} ${TANK.y} L${cx + TANK.w / 2} ${TANK.y} L${cx + TANK.w / 2} ${TANK.y + TANK.h} L${cx - TANK.w / 2} ${TANK.y + TANK.h}Z`);
    const a = el('text', { x: cx, y: TANK.y + 44, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'rc-t' }, scene);
    a.textContent = label;
    const b = el('text', { x: cx, y: TANK.y + 66, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.62, class: 'rc-t' }, scene);
    b.textContent = sub;
  };
  tank(LX - 40, 'ใช้ยานอนหลับ', 'สิ่งที่ถูกชี้ว่าเป็นเหตุ');
  tank(RX + 40, 'นอนไม่หลับ', 'สิ่งที่ถูกชี้ว่าเป็นผล');

  // the pipe between them
  pen(scene, 1.4).setAttribute('d', `M${LX + 36} ${PIPE_Y - 16} L${RX - 36} ${PIPE_Y - 16}`);
  pen(scene, 1.4).setAttribute('d', `M${LX + 36} ${PIPE_Y + 16} L${RX - 36} ${PIPE_Y + 16}`);

  // the claimed direction, drawn above the pipe where claims live
  const claim = pen(scene, 1.8);
  claim.setAttribute('stroke', RED);
  claim.setAttribute('stroke-dasharray', '6 5');
  claim.setAttribute('d', `M${LX + 40} ${PIPE_Y - 64} L${RX - 48} ${PIPE_Y - 64}`);
  const claimHead = pen(scene, 1.8);
  claimHead.setAttribute('stroke', RED);
  claimHead.setAttribute('d', `M${RX - 58} ${PIPE_Y - 71} L${RX - 44} ${PIPE_Y - 64} L${RX - 58} ${PIPE_Y - 57}`);
  const claimT = el('text', { x: (LX + RX) / 2, y: PIPE_Y - 76, 'text-anchor': 'middle', 'font-size': 12, fill: RED, class: 'rc-t' }, scene);
  claimT.textContent = 'ทิศที่ถูกอ้าง';

  // the water, which runs the other way
  const drops = Array.from({ length: 9 }, (_, i) => ({
    u: i / 9,
    node: el('circle', { r: 4.5, fill: 'currentColor', opacity: 0.55 }, scene),
  }));

  const wheel = el('g', {}, scene);
  pen(wheel, 1.6).setAttribute('d', 'M-18 0 L18 0 M0 -18 L0 18 M-13 -13 L13 13 M13 -13 L-13 13');
  el('circle', { cx: 0, cy: 0, r: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 }, wheel);
  el('circle', { cx: 0, cy: 0, r: 3, fill: 'currentColor' }, wheel);

  const actualArrow = pen(scene, 1.8);
  actualArrow.setAttribute('stroke', OK);
  const actualHead = pen(scene, 1.8);
  actualHead.setAttribute('stroke', OK);
  const actual = el('text', { x: (LX + RX) / 2, y: PIPE_Y + 58, 'text-anchor': 'middle', 'font-size': 12.5, fill: OK, opacity: 0, class: 'rc-t' }, scene);
  actual.textContent = 'ทิศที่น้ำไหลจริง';

  const note = el('text', { x: 36, y: 276, 'font-size': 12.5, fill: 'currentColor', class: 'rc-t' }, scene);

  let k = 0, spin = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < 2.4 ? 2.4 : 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // the flow only starts once the claim has been on screen long enough to read
    const flow = ease(Math.min(1, Math.max(0, (k - 2.4) / 1.2)));
    const speed = flow * 0.26;
    drops.forEach((d) => {
      d.u = (d.u + dt * speed) % 1;
      // right to left: from the effect back to what was called the effect
      d.node.setAttribute('cx', f(RX - 44 - (RX - LX - 88) * d.u));
      d.node.setAttribute('cy', f(PIPE_Y));
      d.node.setAttribute('opacity', f(flow * 0.6));
    });

    spin -= dt * flow * 150;      // the wheel can only turn the way the water goes
    wheel.setAttribute('transform', `translate(${WHEEL[0]} ${WHEEL[1]}) rotate(${f(spin)})`);
    actual.setAttribute('opacity', f(flow));
    // name the real direction with an arrow of its own, not just motion
    actualArrow.setAttribute('opacity', f(flow));
    actualHead.setAttribute('opacity', f(flow));
    actualArrow.setAttribute('d', `M${RX - 48} ${PIPE_Y + 38} L${LX + 44} ${PIPE_Y + 38}`);
    actualHead.setAttribute('d', `M${LX + 54} ${PIPE_Y + 31} L${LX + 40} ${PIPE_Y + 38} L${LX + 54} ${PIPE_Y + 45}`);

    headline.textContent = flow < 0.2
      ? 'ข้ออ้างชี้ว่ายาทำให้นอนไม่หลับ'
      : 'เปิดน้ำดู แล้วกังหันหมุนสวนกับลูกศร';
    note.textContent = flow < 0.2
      ? 'ลูกศรเส้นประด้านบนคือสิ่งที่ถูกอ้าง ยังไม่มีใครดูว่าของจริงไหลไปทางไหน · คลิกเพื่อเปิดน้ำ'
      : 'คนนอนไม่หลับจึงไปหายามากิน ไม่ใช่ยาทำให้นอนไม่หลับ · สองอย่างนี้เห็นคู่กันเหมือนกันทุกครั้ง';
  });
}
