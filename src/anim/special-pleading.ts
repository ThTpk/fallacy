// Special pleading: a gate that stamps everyone who passes. One of them walks
// through without a stamp, and the slot where the reason should be stays
// empty. The rule on the wall never changes.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#pleading-stage');
if (stage) {
  const W = 680, H = 320;
  const RED = '#b3412d', OK = '#2f6d4f';
  const PEOPLE = [
    { t: 'คนที่หนึ่ง', exempt: false },
    { t: 'คนที่สอง', exempt: false },
    { t: 'ตัวเราเอง', exempt: true },
    { t: 'คนที่สี่', exempt: false },
  ];
  const GATE = 340, LANE = 170;
  const EVERY = 2.5, WALK = 1.6;
  const CYCLE = PEOPLE.length * EVERY + 2.2;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ทุกคนที่ผ่านประตูถูกประทับตรา ยกเว้นคนเดียวที่ผ่านไปโดยไม่มีตรา',
  });
  const { filter } = inkDefs(svg, 'spl');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'spl-t' }, scene);

  // the rule, written on the wall and never edited
  shape(scene, 1.3).setAttribute('d', 'M196 66 L484 66 L484 104 L196 104Z');
  const ruleT = el('text', { x: 340, y: 90, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'spl-t' }, scene);
  ruleT.textContent = 'ใครมาสายต้องโดนหักคะแนน';

  pen(scene, 1.2).setAttribute('d', `M40 ${LANE + 26} L640 ${LANE + 26}`);
  pen(scene, 2).setAttribute('d', `M${GATE} ${LANE + 26} L${GATE} ${LANE - 40}`);
  pen(scene, 2).setAttribute('d', `M${GATE + 52} ${LANE + 26} L${GATE + 52} ${LANE - 40}`);
  const stamper = pen(scene, 2.4);
  stamper.setAttribute('stroke', 'var(--hl)');

  const walker = el('g', { opacity: 0 }, scene);
  const wbox = shape(walker, 1.3);
  wbox.setAttribute('d', 'M-52 -20 L52 -20 L52 20 L-52 20Z');
  const wt = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'spl-t' }, walker);
  // fixed on the canvas, not carried by the walker, which walks off the edge
  const mark = el('text', { x: 636, y: LANE - 54, 'text-anchor': 'end', 'font-size': 13, opacity: 0, class: 'spl-t' }, scene);

  // the slot the reason for an exemption is supposed to go in
  const slotBox = pen(scene, 1.4);
  slotBox.setAttribute('stroke-dasharray', '5 4');
  slotBox.setAttribute('d', 'M212 238 L468 238 L468 276 L212 276Z');
  const slotT = el('text', { x: 340, y: 230, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'spl-t' }, scene);
  slotT.textContent = 'เหตุผลที่กรณีนี้ต่างจากกรณีอื่น';
  const slotV = el('text', { x: 340, y: 262, 'text-anchor': 'middle', 'font-size': 13, fill: RED, opacity: 0, class: 'spl-t' }, scene);
  slotV.textContent = 'ว่างอยู่';

  const note = el('text', { x: 36, y: 302, 'font-size': 12.5, fill: 'currentColor', class: 'spl-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const i = Math.floor(k / EVERY);
    const u = ease(Math.min(1, (k - i * EVERY) / WALK));
    const p = PEOPLE[Math.min(i, PEOPLE.length - 1)];

    if (i < PEOPLE.length) {
      walker.setAttribute('opacity', '1');
      wt.textContent = p.t;
      wbox.setAttribute('stroke', p.exempt ? 'var(--hl)' : 'currentColor');
      walker.setAttribute('transform', `translate(${f(20 + (660 - 20) * u)} ${LANE})`);
      const past = u > 0.52;
      mark.setAttribute('opacity', f(past ? 1 : 0));
      mark.setAttribute('fill', p.exempt ? RED : OK);
      mark.textContent = p.exempt ? 'ผ่านไปโดยไม่โดนหัก' : 'โดนหักคะแนน';
    } else {
      walker.setAttribute('opacity', '0');
      mark.setAttribute('opacity', '0');
    }

    // the stamp comes down for everyone except the one case
    const stamping = u > 0.42 && u < 0.62 && !p.exempt && i < PEOPLE.length;
    stamper.setAttribute('opacity', f(stamping ? 1 : 0.25));
    stamper.setAttribute('d', `M${GATE + 10} ${LANE - 40} L${GATE + 42} ${LANE - 40} M${GATE + 26} ${LANE - 40} L${GATE + 26} ${f(LANE - 40 + (stamping ? 26 : 10))}`);

    const atExempt = i === 2 && u > 0.52;
    slotV.setAttribute('opacity', f(atExempt || i > 2 ? 1 : 0));

    headline.textContent = i >= PEOPLE.length
      ? 'กฎบนผนังไม่ได้ถูกแก้สักคำ'
      : p.exempt && u > 0.52 ? 'คนนี้ผ่านไปโดยไม่โดนหัก'
        : 'ทุกคนที่ผ่านประตู โดนหักคะแนน';
    note.textContent = i >= PEOPLE.length || atExempt
      ? 'สิ่งที่ถูกเปลี่ยนไม่ใช่กฎ แต่คือรายชื่อคนที่กฎใช้ด้วย ซึ่งไม่ได้เขียนไว้ที่ไหน · คลิกเพื่อดูใหม่'
      : 'ดูช่องเหตุผลด้านล่างเมื่อถึงคิวที่สาม';
  });
}
