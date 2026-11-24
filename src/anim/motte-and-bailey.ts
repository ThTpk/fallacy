// Motte and bailey: the challenge always lands on whichever claim the speaker
// is standing on, and the speaker steps down to the solid one just before it
// arrives. The claim that gets used is the one that is never tested.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#motte-stage');
if (stage) {
  const W = 680, H = 320;
  const RED = '#b3412d', OK = '#2f6d4f';

  // the bailey is wide and open, the motte is small and walled; the speaker
  // stands on top of whichever one they are currently asserting
  const BAILEY = { x: 96, y: 92, w: 308, h: 64 };
  const MOTTE = { x: 140, y: 200, w: 220, h: 60 };
  const UP: [number, number] = [250, BAILEY.y - 8];
  const DOWN: [number, number] = [250, MOTTE.y - 18];
  const CYCLE = 7.2;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ผู้พูดถอยจากข้ออ้างแรงลงไปข้ออ้างอ่อนเมื่อถูกค้าน แล้วกลับขึ้นมา',
  });
  const { filter } = inkDefs(svg, 'mb');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'mb-t' }, scene);

  const bailey = pen(scene, 1.3);
  bailey.setAttribute('d', `M${BAILEY.x} ${BAILEY.y} L${BAILEY.x + BAILEY.w} ${BAILEY.y} L${BAILEY.x + BAILEY.w} ${BAILEY.y + BAILEY.h} L${BAILEY.x} ${BAILEY.y + BAILEY.h}Z`);
  bailey.setAttribute('stroke-dasharray', '7 5');
  const bt = el('text', { x: BAILEY.x + 20, y: BAILEY.y + 26, 'font-size': 13, fill: 'currentColor', class: 'mb-t' }, scene);
  bt.textContent = 'ข้ออ้างแรง ที่เอาไปใช้จริง';
  const bn = el('text', { x: BAILEY.x + 20, y: BAILEY.y + 48, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'mb-t' }, scene);
  bn.textContent = 'กว้าง มีประโยชน์ และค้านได้';

  // battlements, so the lower box reads as a keep and not just a second box
  for (let i = 0; i < 6; i++) {
    const x = MOTTE.x + 8 + i * 36;
    pen(scene, 1.2).setAttribute('d', `M${x} ${MOTTE.y} L${x} ${MOTTE.y - 10} L${x + 18} ${MOTTE.y - 10} L${x + 18} ${MOTTE.y}`);
  }
  shape(scene, 1.5).setAttribute('d', `M${MOTTE.x} ${MOTTE.y} L${MOTTE.x + MOTTE.w} ${MOTTE.y} L${MOTTE.x + MOTTE.w} ${MOTTE.y + MOTTE.h} L${MOTTE.x} ${MOTTE.y + MOTTE.h}Z`);
  const mt = el('text', { x: MOTTE.x + 20, y: MOTTE.y + 24, 'font-size': 13, fill: 'currentColor', class: 'mb-t' }, scene);
  mt.textContent = 'ข้ออ้างอ่อน ที่ถอยมาตั้งรับ';
  const mn = el('text', { x: MOTTE.x + 20, y: MOTTE.y + 44, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'mb-t' }, scene);
  mn.textContent = 'แคบ ค้านไม่ลง และไม่ให้ข้อสรุปที่ต้องการ';

  const token = el('g', {}, scene);
  el('circle', { cx: 0, cy: 0, r: 8, fill: 'currentColor' }, token);
  pen(token, 1.6).setAttribute('d', 'M0 -8 L0 -26 L16 -21 L0 -16');

  const arrow = el('g', { opacity: 0 }, scene);
  const shaft = pen(arrow, 2.2);
  shaft.setAttribute('stroke', RED);
  shaft.setAttribute('d', 'M0 0 L46 0');
  const head = pen(arrow, 2.2);
  head.setAttribute('stroke', RED);
  head.setAttribute('d', 'M0 -6 L-8 0 L0 6');

  const untested = el('text', { x: BAILEY.x + BAILEY.w + 14, y: BAILEY.y + 36, 'font-size': 11.5, fill: RED, opacity: 0, class: 'mb-t' }, scene);
  untested.textContent = 'ไม่เคยถูกตรวจ';
  const held = el('text', { x: MOTTE.x + MOTTE.w + 14, y: MOTTE.y + 12, 'font-size': 11.5, fill: OK, opacity: 0, class: 'mb-t' }, scene);
  held.textContent = 'ตรงนี้รับไหว';

  const note = el('text', { x: 36, y: 298, 'font-size': 12.5, fill: 'currentColor', opacity: 0.78, class: 'mb-t' }, scene);

  const px = spring(26, 7, UP[0]), py = spring(26, 7, UP[1]);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 1.0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // 0.0–1.9 standing on the bailey · 1.9–5.0 down in the motte while the
    // challenge arrives and bounces · 5.0– back up to the claim that is used
    const down = k > 1.9 && k < 5.0;
    const target = down ? DOWN : UP;
    token.setAttribute('transform', `translate(${f(px.step(target[0], dt))} ${f(py.step(target[1], dt))})`);

    // the challenge stops at the edge of whichever box is being stood on
    const stopX = (down ? MOTTE.x + MOTTE.w : BAILEY.x + BAILEY.w) + 10;
    const lane = down ? MOTTE.y + MOTTE.h / 2 : BAILEY.y + BAILEY.h / 2;
    let ax = 0, vis = 0;
    if (k > 1.6 && k < 5.4) {
      const u = ease(Math.min(1, (k - 1.6) / 1.5));
      const back = k > 4.4 ? ease(Math.min(1, (k - 4.4) / 1.0)) : 0;
      ax = 648 - (648 - stopX) * u + (648 - stopX) * back;
      vis = 1 - back * 0.9;
    }
    arrow.setAttribute('opacity', f(vis));
    arrow.setAttribute('transform', `translate(${f(ax)} ${f(lane)})`);

    held.setAttribute('opacity', f(k > 3.1 && k < 5.0 ? 1 : 0));
    untested.setAttribute('opacity', f(k > 5.6 ? 1 : 0));

    headline.textContent = k < 1.6
      ? 'ผู้พูดยืนอยู่บนข้ออ้างแรง'
      : down ? 'ถูกค้าน จึงถอยลงไปยืนบนข้ออ้างอ่อน'
        : 'ค้านผ่านไปแล้ว จึงกลับขึ้นมาใช้ข้ออ้างแรงเหมือนเดิม';
    note.textContent = k > 5.6
      ? 'สิ่งที่รับการค้านไหวคือกล่องล่าง แต่สิ่งที่ถูกเอาไปใช้ต่อคือกล่องบน ซึ่งไม่มีใครตรวจเลย'
      : 'คลิกเพื่อเริ่มรอบใหม่';
  });
}
