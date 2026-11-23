// Appeal to authority: a citation has three gates to get through — is this
// person real, are they in the right field, is this the field's settled view.
// Three cases take turns. Only one gets to the end, and that one is not a
// fallacy at all; it is how anybody sane uses expert testimony.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#authority-stage');
if (stage) {
  const W = 680, H = 292, LANE = 196;
  const GATE = [206, 366, 526];
  const ASK = ['มีตัวตนจริงไหม', 'อยู่ในสาขาที่ตรงไหม', 'เป็นฉันทามติไหม'];
  const CASES: { who: string; what: string; passes: number }[] = [
    { who: 'ตำแหน่งที่ค้นไม่พบในทะเบียน', what: 'อ้างว่ารักษาโรคตาได้', passes: 0 },
    { who: 'ดาราที่เราชอบ', what: 'พูดเรื่องโรคตับ', passes: 1 },
    { who: 'จักษุแพทย์ที่ตรวจทะเบียนได้', what: 'พูดเรื่องโรคตา ตามแนวปฏิบัติ', passes: 3 },
  ];
  const CYCLE = 5.0, RUN_T = 2.6;
  const RED = '#b3412d', OK = '#2f6d4f';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น การ์ดคำรับรองวิ่งผ่านด่านสามด่าน บางใบผ่านหมด บางใบติดตั้งแต่ด่านแรก',
  });
  const { filter } = inkDefs(svg, 'aa');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${LANE + 26} L${W} ${LANE + 26}`);

  const gates = GATE.map((gx, i) => {
    const g = el('g', {}, scene);
    pen(g, 1.3).setAttribute('d', `M${gx} ${LANE + 26} L${gx} ${LANE - 56}`);
    const bar = pen(g, 2.2);
    const cap = el('text', { x: gx, y: LANE - 70, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.72, class: 'aa-t' }, g);
    cap.textContent = ASK[i];
    const mark = el('text', { x: gx, y: LANE + 48, 'text-anchor': 'middle', 'font-size': 15, fill: RED, opacity: 0, class: 'aa-t' }, g);
    mark.textContent = '✕';
    return { bar, mark, gx };
  });

  const cardG = el('g', {}, scene);
  const card = shape(cardG, 1.15);
  card.setAttribute('d', 'M-74 -26 L74 -26 L74 20 L-74 20Z');
  const who = el('text', { x: 0, y: -8, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', class: 'aa-t' }, cardG);
  const what = el('text', { x: 0, y: 10, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'currentColor', opacity: 0.68, class: 'aa-t' }, cardG);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'aa-t' }, scene);
  const verdict = el('text', { x: 36, y: 272, 'font-size': 12.5, fill: 'currentColor', opacity: 0.78, class: 'aa-t' }, scene);

  let idx = 0, k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { idx = (idx + 1) % CASES.length; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { idx = (idx + 1) % CASES.length; k = 0; }
    const c = CASES[idx];
    who.textContent = c.who;
    what.textContent = c.what;

    // the card stops at the first gate it cannot pass
    const stopX = c.passes >= 3 ? W + 90 : GATE[c.passes] - 82;
    const u = ease(Math.min(1, k / RUN_T));
    const x = -90 + (stopX + 90) * u;
    cardG.setAttribute('transform', `translate(${f(x)} ${LANE})`);

    gates.forEach((g, i) => {
      const open = i < c.passes;
      // an open gate's bar is up against its post, a shut one lies across the lane
      g.bar.setAttribute('d', open
        ? `M${g.gx} ${LANE - 54} L${g.gx + 6} ${LANE - 22}`
        : `M${g.gx} ${LANE - 52} L${g.gx + 54} ${LANE - 52}`);
      g.bar.setAttribute('stroke', open ? OK : RED);
      g.mark.setAttribute('opacity', f(!open && i === c.passes && u > 0.92 ? 1 : 0));
    });

    headline.textContent = c.passes >= 3 ? 'ผ่านครบสามด่าน จึงเป็นเหตุผลที่ดี' : `ติดที่ด่าน ${c.passes + 1}`;
    verdict.textContent = c.passes >= 3
      ? 'การอ้างผู้เชี่ยวชาญไม่ใช่ตรรกวิบัติเมื่อผ่านครบ · คลิกเพื่อดูเคสถัดไป'
      : `${ASK[c.passes]} — ตอบไม่ได้ คำรับรองจึงยังใช้แทนหลักฐานไม่ได้ · คลิกเพื่อดูเคสถัดไป`;
  });
}
