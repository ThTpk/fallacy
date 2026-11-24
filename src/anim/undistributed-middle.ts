// Undistributed middle: the set the two premises put things into is wide. One
// four-legged thing after another drops into it, and every single one supports
// exactly the same inference from the dog. By the sixth arrival the conclusion
// "a dog is a bed" has as much behind it as "a dog is a table" ever had.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { minJerk } from './lib/motion.ts';

const stage = document.querySelector('#middle-stage');
if (stage) {
  const W = 680, H = 314;
  const RED = '#b3412d';
  const ITEMS = ['สุนัข', 'โต๊ะ', 'ม้า', 'เก้าอี้', 'แมว', 'เตียง'];
  const SLOT: [number, number][] = [
    [170, 128], [342, 128], [514, 128],
    [170, 180], [342, 180], [514, 180],
  ];
  const LANE = 236;        // the tie runs along here, clear of every chip
  const CW = 108, CH = 40;
  const EVERY = 1.3, FALL = 0.5, HOLD = 2.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ของสี่ขาหลายอย่างตกลงในวงเดียวกันทีละชิ้น',
  });
  const { filter } = inkDefs(svg, 'um');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'um-t' }, scene);
  headline.textContent = 'ข้ออ้างบอกแค่ว่าทั้งคู่อยู่ในวงนี้';

  // the middle term: one wide set, drawn loose because its edge is vague
  const set = pen(scene, 1.3);
  set.setAttribute('d', 'M96 74 L584 74 L584 252 L96 252Z');
  set.setAttribute('stroke-dasharray', '6 5');
  const setLabel = el('text', { x: 116, y: 100, 'font-size': 12.5, fill: 'currentColor', opacity: 0.68, class: 'um-t' }, scene);
  setLabel.textContent = 'สิ่งที่มีสี่ขา';

  // the tie the argument wants to draw, from the dog to whatever just landed
  const tie = pen(scene, 1.6);
  tie.setAttribute('stroke', RED);
  tie.setAttribute('stroke-dasharray', '5 4');

  const chips = ITEMS.map((name, i) => {
    const g = el('g', { opacity: 0 }, scene);
    const r = shape(g, 1.2);
    r.setAttribute('d', `M${-CW / 2} ${-CH / 2} L${CW / 2} ${-CH / 2} L${CW / 2} ${CH / 2} L${-CW / 2} ${CH / 2}Z`);
    const t = el('text', {
      x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 13.5,
      fill: 'currentColor', class: 'um-t',
      'font-weight': i === 0 ? 500 : 400,
    }, g);
    t.textContent = name;
    return g;
  });

  const verdict = el('text', { x: 36, y: 282, 'font-size': 13.5, fill: 'currentColor', class: 'um-t' }, scene);
  const tally = el('text', { x: 36, y: 304, 'font-size': 11.5, fill: 'currentColor', opacity: 0.68, class: 'um-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  // a click brings the next one in early, or starts the round over at the end
  svg.addEventListener('pointerdown', () => {
    const landed = Math.floor(k / EVERY) + 1;
    k = landed >= ITEMS.length ? 0 : landed * EVERY;
  });

  run((_t, dt) => {
    k += dt;
    const full = ITEMS.length * EVERY;
    if (k > full + HOLD) k = 0;

    let newest = 0;
    chips.forEach((g, i) => {
      const since = k - i * EVERY;
      if (since < 0) { g.setAttribute('opacity', '0'); return; }
      newest = i;
      const u = minJerk(Math.min(1, since / FALL));
      const [sx, sy] = SLOT[i];
      // each row slides in from just above itself: from off the canvas they
      // would cross the headline, and from the top of the set the lower row
      // would fall straight through the chip above it
      const from = sy < 160 ? 92 : 154;
      const y = from + (sy - from) * u;
      g.setAttribute('transform', `translate(${sx} ${f(y)})`);
      g.setAttribute('opacity', f(Math.min(1, since / 0.18)));
    });

    // the dog is always slot 0; the tie runs from it to the newest arrival
    if (newest > 0) {
      // under the grid rather than across it: a straight line from the dog to
      // anything on the far side would cut through whatever sits between them
      const [ax, ay] = SLOT[0];
      const [bx, by] = SLOT[newest];
      const a = ay + CH / 2, b = by + CH / 2;
      tie.setAttribute('d', `M${ax} ${a} C${ax} ${LANE} ${bx} ${LANE} ${bx} ${b}`);
      tie.setAttribute('opacity', f(Math.min(1, (k - newest * EVERY) / FALL)));
    } else {
      tie.setAttribute('opacity', '0');
    }

    verdict.textContent = newest === 0
      ? 'สุนัขมีสี่ขา · ยังไม่มีอะไรให้เทียบ'
      : `เหตุผลเดียวกันนี้สรุปได้ว่า สุนัขคือ${ITEMS[newest]}`;
    tally.textContent = newest === 0
      ? 'รอของชิ้นต่อไปที่มีสี่ขาเหมือนกัน · คลิกเพื่อเร่ง'
      : `จับคู่กับสุนัขได้แล้ว ${newest} อย่าง ยิ่งวงกว้าง ข้อสรุปยิ่งว่างเปล่า · คลิกเพื่อเร่ง`;
  });
}
