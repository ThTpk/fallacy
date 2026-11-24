// Poisoning the well, drawn as a well. One drop goes in before anybody draws
// water. After that every bucket that comes up is pushed away without being
// looked into — and the buckets are the things the person actually said.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease, minJerk } from './lib/motion.ts';

const stage = document.querySelector('#well-stage');
if (stage) {
  const W = 680, H = 330;
  const RED = '#b3412d';
  const GY = 176;                             // ground level: the well is a hole in it
  const WX = 170, RIM = GY - 10, DEEP = 110;  // the mouth sits on a low wall
  const RX = 44, RY = 11;
  const SURF = GY + 34;                       // where the water sits
  const CARRY = 86;                           // the height the bucket is carried at
  const BUCKETS = ['ข้อโต้แย้งที่เขาพูด', 'ข้อมูลที่เขายกมา', 'คำชี้แจงของเขา'];
  const DROP_AT = 1.6, FIRST = 3.4, EVERY = 3.0;
  const CYCLE = FIRST + BUCKETS.length * EVERY + 1.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น หยดหนึ่งตกลงบ่อน้ำก่อน แล้วทุกถังที่ตักขึ้นมาหลังจากนั้นถูกปัดทิ้ง',
  });
  const { filter } = inkDefs(svg, 'pw');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'pw-t' }, scene);

  // the ground, so the shaft reads as a hole and not a drinking glass, with
  // the hatching underneath that says "this side is earth"
  pen(scene, 1.3).setAttribute('d', `M26 ${GY} L336 ${GY}`);
  for (let x = 32; x < 336; x += 19) {
    if (x > WX - RX - 12 && x < WX + RX + 2) continue;   // leave the mouth clear
    const h = pen(scene, 0.9);
    h.setAttribute('opacity', '0.5');
    h.setAttribute('d', `M${x} ${GY} L${x - 9} ${GY + 9}`);
  }
  // the shaft, below ground, tapering a little with depth
  shape(scene, 1.4).setAttribute(
    'd', `M${WX - RX} ${GY} L${WX - RX + 7} ${GY + DEEP} L${WX + RX - 7} ${GY + DEEP} L${WX + RX} ${GY}Z`);
  // the low wall around the mouth
  pen(scene, 1.5).setAttribute(`d`, `M${WX - RX} ${GY} L${WX - RX} ${RIM}`);
  pen(scene, 1.5).setAttribute('d', `M${WX + RX} ${GY} L${WX + RX} ${RIM}`);
  // the water, below its own surface line
  const water = el('path', { fill: 'currentColor', opacity: 0.14 }, scene);
  const surf = el('ellipse', { cx: WX, cy: SURF, rx: RX - 3, ry: RY - 3, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1, opacity: 0.5 }, scene);
  // the rim last, so it sits over the walls
  pen(scene, 1.7).setAttribute(
    'd', `M${WX - RX} ${RIM} a${RX} ${RY} 0 1 0 ${RX * 2} 0 a${RX} ${RY} 0 1 0 ${-RX * 2} 0Z`);

  const rope = pen(scene, 1);
  rope.setAttribute('opacity', '0.6');

  const drop = el('circle', { r: 6.5, fill: RED, opacity: 0 }, scene);
  const dropLabel = el('text', { x: 254, y: 90, 'font-size': 12, fill: RED, opacity: 0, class: 'pw-t' }, scene);
  dropLabel.textContent = 'คนนี้เคยมีเรื่องเสียหาย · พูดไว้ก่อนเขาจะได้พูด';

  const bucketG = el('g', { opacity: 0 }, scene);
  const bucket = shape(bucketG, 1.5);
  bucket.setAttribute('d', 'M-25 -18 L25 -18 L19 20 L-19 20Z');
  const fill = el('path', { d: 'M-22 -6 L22 -6 L19 20 L-19 20Z', fill: RED, opacity: 0 }, bucketG);
  pen(bucketG, 1.2).setAttribute('d', 'M-25 -18 a25 9 0 0 0 50 0');
  const label = el('text', {
    x: 0, y: 40, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', class: 'pw-t',
  }, bucketG);

  const reject = el('text', { x: 386, y: 196, 'font-size': 12.5, fill: RED, opacity: 0, class: 'pw-t' }, scene);
  reject.textContent = 'ปัดทิ้งโดยไม่ได้ดูว่าในถังมีอะไร';
  const cross = pen(scene, 2.6);
  cross.setAttribute('stroke', RED);
  cross.setAttribute('opacity', '0');

  const tally = el('text', { x: 36, y: 312, 'font-size': 12.5, fill: 'currentColor', opacity: 0.78, class: 'pw-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // the drop falls in first, and the water stays dark from then on
    const du = (k - (DROP_AT - 0.8)) / 1.1;
    const falling = du > 0 && du < 1;
    const dirty = k > DROP_AT + 0.3;
    drop.setAttribute('opacity', f(falling ? 1 : 0));
    drop.setAttribute('cx', f(WX));
    drop.setAttribute('cy', f(48 + (SURF - 48) * minJerk(Math.max(0, Math.min(1, du)))));
    dropLabel.setAttribute('opacity', f(
      k < DROP_AT - 0.8 ? 0 : k > FIRST - 0.5 ? Math.max(0, 1 - (k - FIRST + 0.5) / 0.4)
        : Math.min(1, (k - DROP_AT + 0.8) / 0.4)));

    water.setAttribute('d', `M${WX - RX + 3} ${SURF} L${WX + RX - 3} ${SURF} L${WX + RX - 7} ${GY + DEEP} L${WX - RX + 7} ${GY + DEEP}Z`);
    water.setAttribute('opacity', f(dirty ? 0.3 : 0.14));
    water.setAttribute('fill', dirty ? RED : 'currentColor');
    surf.setAttribute('stroke', dirty ? RED : 'currentColor');

    // then the buckets, one at a time: up out of the well, across, pushed away
    const i = Math.floor((k - FIRST) / EVERY);
    const u = (k - FIRST - i * EVERY) / EVERY;
    if (i >= 0 && i < BUCKETS.length) {
      label.textContent = BUCKETS[i];
      bucketG.setAttribute('opacity', '1');
      fill.setAttribute('opacity', f(dirty ? 0.52 : 0));

      let bx = WX, by = SURF + 10;
      if (u < 0.34) {                               // hauled up
        by = SURF + 10 - (SURF + 10 - CARRY) * ease(u / 0.34);
      } else if (u < 0.62) {                        // carried across
        by = CARRY;
        bx = WX + (448 - WX) * ease((u - 0.34) / 0.28);
      } else {                                      // pushed away
        const a = ease((u - 0.62) / 0.38);
        by = CARRY + 44 * a;
        bx = 448 + 170 * a;
      }
      bucketG.setAttribute('transform', `translate(${f(bx)} ${f(by)})`);
      rope.setAttribute('d', u < 0.4 ? `M${f(bx)} 0 L${f(bx)} ${f(by - 18)}` : '');

      const shown = u > 0.6 && u < 0.9;
      reject.setAttribute('opacity', f(shown ? 1 : 0));
      cross.setAttribute('opacity', f(shown ? 1 : 0));
      cross.setAttribute('d', `M${f(bx - 17)} ${f(by - 16)} L${f(bx + 17)} ${f(by + 18)} M${f(bx + 17)} ${f(by - 16)} L${f(bx - 17)} ${f(by + 18)}`);
    } else {
      bucketG.setAttribute('opacity', '0');
      reject.setAttribute('opacity', '0');
      cross.setAttribute('opacity', '0');
      rope.setAttribute('d', `M${WX} 0 L${WX} ${f(SURF + 10)}`);
    }

    const sent = Math.max(0, Math.min(BUCKETS.length, i + (i >= 0 && u > 0.9 ? 1 : 0)));
    headline.textContent = !dirty
      ? 'ยังไม่มีใครพูดอะไร และยังไม่มีใครตักน้ำ'
      : i < 0 ? 'ยาลงไปแล้ว ก่อนจะมีอะไรให้ฟัง'
        : `ถังที่ ${Math.min(BUCKETS.length, i + 1)} ขึ้นมาจากบ่อเดียวกัน`;
    tally.textContent = i < 0
      ? 'คลิกเพื่อเริ่มใหม่'
      : `ปัดไปแล้ว ${sent} จาก ${BUCKETS.length} ถัง โดยยังไม่มีใครเปิดดูสักถัง · คลิกเพื่อเริ่มใหม่`;
  });
}
