// Nirvana fallacy: the proposal is the same height throughout. Only the line
// it is measured against moves, and against the one that does not exist it
// fails, while against the one that does it wins.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#nirvana-stage');
if (stage) {
  const W = 680, H = 326;
  const RED = '#b3412d', OK = '#2f6d4f';
  const BASE = 240, TOP = 92;
  const STATUS = 22, PROPOSAL = 52, PERFECT = 100;   // percent of the problem solved
  const BX = [150, 320], BW = 104;
  const CYCLE = 9.0;
  const hy = (v: number) => BASE - ((BASE - TOP) * v) / 100;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ข้อเสนอสูงเท่าเดิมตลอด เปลี่ยนแค่เส้นที่เอาไปเทียบ',
  });
  const { filter } = inkDefs(svg, 'nir');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'nir-t' }, scene);

  pen(scene, 1.3).setAttribute('d', `M110 ${BASE} L640 ${BASE}`);

  const bar = (x: number, v: number, label: string, dashed: boolean) => {
    const r = dashed ? pen(scene, 1.4) : shape(scene, 1.3);
    r.setAttribute('d', `M${x} ${f(hy(v))} L${x + BW} ${f(hy(v))} L${x + BW} ${BASE} L${x} ${BASE}Z`);
    if (dashed) r.setAttribute('stroke-dasharray', '6 5');
    const t = el('text', { x: x + BW / 2, y: BASE + 22, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', class: 'nir-t' }, scene);
    t.textContent = label;
    const n = el('text', { x: x + BW / 2, y: f(hy(v) - 9), 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', opacity: 0.8, class: 'nir-t' }, scene);
    n.textContent = `${v}%`;
    return r;
  };
  bar(BX[0], STATUS, 'ไม่ทำอะไรเลย', false);
  bar(BX[1], PROPOSAL, 'ข้อเสนอนี้', false);

  // the perfect solution: drawn only when it is being used as the yardstick
  const ghost = pen(scene, 1.4);
  ghost.setAttribute('stroke-dasharray', '6 5');
  ghost.setAttribute('d', `M490 ${f(hy(PERFECT))} L${490 + BW} ${f(hy(PERFECT))} L${490 + BW} ${BASE} L490 ${BASE}Z`);
  const ghostT = el('text', { x: 490 + BW / 2, y: BASE + 22, 'text-anchor': 'middle', 'font-size': 12, fill: RED, class: 'nir-t' }, scene);
  ghostT.textContent = 'ทางแก้สมบูรณ์แบบ';
  const ghostN = el('text', { x: 490 + BW / 2, y: f(hy(PERFECT) - 9), 'text-anchor': 'middle', 'font-size': 11.5, fill: RED, class: 'nir-t' }, scene);
  ghostN.textContent = 'ยังไม่มีใครเสนอ';

  // the line the proposal is judged against
  const rule = pen(scene, 2.2);
  // on the left, clear of the ghost bar's own two labels
  const ruleT = el('text', { x: 118, 'font-size': 12, class: 'nir-t' }, scene);

  const verdict = el('text', { x: 36, y: 288, 'font-size': 13.5, fill: 'currentColor', class: 'nir-t' }, scene);
  const note = el('text', { x: 36, y: 310, 'font-size': 12, fill: 'currentColor', opacity: 0.74, class: 'nir-t' }, scene);

  const sy = spring(14, 6, PERFECT);
  let k = 0, against = 0;        // 0 = the perfect one, 1 = doing nothing
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { against = 1 - against; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { against = 1 - against; k = 0; }

    const target = against === 0 ? PERFECT : STATUS;
    const v = sy.step(target, dt);
    const y = hy(v);
    rule.setAttribute('d', `M120 ${f(y)} L636 ${f(y)}`);
    rule.setAttribute('stroke', against === 0 ? RED : OK);
    rule.setAttribute('stroke-dasharray', against === 0 ? '7 5' : '');
    ruleT.setAttribute('y', f(y - 8));
    ruleT.setAttribute('fill', against === 0 ? RED : OK);
    ruleT.textContent = against === 0 ? 'เส้นที่เอามาเทียบ' : 'เส้นที่ควรเทียบ';

    ghost.setAttribute('opacity', f(against === 0 ? 1 : 0.18));
    ghostT.setAttribute('opacity', f(against === 0 ? 1 : 0.3));
    ghostN.setAttribute('opacity', f(against === 0 ? 1 : 0.3));

    headline.textContent = against === 0
      ? 'เทียบข้อเสนอกับทางแก้สมบูรณ์แบบ'
      : 'เทียบข้อเสนอกับการไม่ทำอะไรเลย';
    verdict.textContent = against === 0
      ? `ข้อเสนอได้ ${PROPOSAL}% ซึ่งต่ำกว่าเส้น จึงถูกปัดทิ้ง`
      : `ข้อเสนอได้ ${PROPOSAL}% ซึ่งสูงกว่าเส้น ${PROPOSAL - STATUS} หน่วย จึงคุ้มที่จะทำ`;
    note.textContent = 'แท่งข้อเสนอสูงเท่าเดิมทั้งสองภาพ สิ่งที่เปลี่ยนคือเส้น · คลิกเพื่อสลับ';
  });
}
