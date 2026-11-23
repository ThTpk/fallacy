// Begging the question: the two claims hold each other up, so you can walk
// between them forever. The lap counter is the whole criticism — the argument
// is perfectly valid and it never takes you anywhere you were not already.
import { el, pen, shape, blot, limb, shoe, place, inkDefs, run, f, PEN, PAPER, type Vec, type Limb } from './lib/ink.ts';
import { gait } from './lib/gait.ts';

const stage = document.querySelector('#begging-stage');
if (stage) {
  const W = 680, H = 290;
  const CX = 340, CY = 176, RX = 214, RY = 62;
  const SCALE = 0.5;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คนเดินวนรอบข้อความสองข้อที่อ้างอิงกันเอง พร้อมตัวนับรอบ',
  });
  const { filter } = inkDefs(svg, 'bq');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // the track they go round
  el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.0, 'stroke-dasharray': '7 7', opacity: 0.45 }, scene);

  const card = (cx: number, head: string, body: string) => {
    const g = el('g', {}, scene);
    shape(g, 1.1).setAttribute('d', `M${cx - 118} ${CY - 34} L${cx + 118} ${CY - 34} L${cx + 118} ${CY + 24} L${cx - 118} ${CY + 24}Z`);
    const a = el('text', { x: cx, y: CY - 14, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.66, class: 'bq-t' }, g);
    a.textContent = head;
    const b = el('text', { x: cx, y: CY + 10, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'currentColor', class: 'bq-t' }, g);
    b.textContent = body;
  };
  card(CX - RX + 6, 'ทำไมถึงเชื่อว่า X', 'เพราะ Y เป็นจริง');
  card(CX + RX - 6, 'แล้วทำไมถึงเชื่อว่า Y', 'เพราะ X เป็นจริง');

  // --- the walker ----------------------------------------------------------
  const fig = el('g', {}, scene);
  const backArm = limb(fig, 3.4);
  const legs: [Limb, Limb] = [limb(fig, 4.2), limb(fig, 4.2)];
  const shoes: [SVGPathElement, SVGPathElement] = [blot(fig), blot(fig)];
  const coat = shape(fig);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, fig);
  const hat = blot(fig);
  hat.setAttribute('d', 'M35.4 28.6 L49.6 28.6 Q46.6 26.8 46.2 23.6 Q42.4 20.8 38.8 23.6 Q38.4 26.8 35.4 28.6Z');
  const frontArm = limb(fig, 3.4);

  const walk = gait({ kind: 'walk', period: 0.95 });
  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'bq-t' }, scene);
  headline.textContent = 'ข้อโต้แย้งนี้สมเหตุสมผลทุกขั้น';
  const tally = el('text', { x: 36, y: 276, 'font-size': 12.5, fill: 'currentColor', opacity: 0.72, class: 'bq-t' }, scene);

  let th = Math.PI, phase = 0, laps = 0;

  run((_t, dt) => {
    const before = th;
    th += dt * 0.62;
    if (Math.floor(th / (Math.PI * 2)) > Math.floor(before / (Math.PI * 2))) laps += 1;
    phase += dt / walk.period;

    const x = CX + RX * Math.cos(th);
    const y = CY + RY * Math.sin(th);
    const dir: 1 | -1 = Math.sin(th) > 0 ? -1 : 1;   // bottom of the loop goes left
    place(fig, x, y + 26, dir, SCALE);

    const pose = walk.pose(phase);
    const b = pose.bob;
    pose.feet.forEach((fo, i) => { legs[i].draw([pose.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
    fig.insertBefore(legs[pose.front].g, coat);
    fig.insertBefore(shoes[pose.front], coat);

    const kF = pose.feet[pose.front].knee, aF = pose.feet[pose.front].ankle;
    const sh: Vec = [41, 41 + b];
    const fx = Math.max(kF[0] + 2.2, 46);
    coat.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.6)} ${f(70 + b)} Q${f(fx)} ${f(80 + b * 0.5)} ${f(Math.max(fx, aF[0] - 4))} 90 L31 91 L${f(33.2)} ${f(70 + b)}Z`);
    head.setAttribute('cx', '42.4'); head.setAttribute('cy', f(31.4 + b));

    const sw = Math.sin(phase * Math.PI * 2) * 0.3;
    ([[frontArm, sw, 3.0], [backArm, -sw, -2.2]] as const).forEach(([arm, a, off]) => {
      const s: Vec = [sh[0] + off, sh[1] + 2.2];
      const e: Vec = [s[0] + 17 * Math.sin(a), s[1] + 17 * Math.cos(a)];
      arm.draw([s, e, [e[0] + 16 * Math.sin(a + 0.2), e[1] + 16 * Math.cos(a + 0.2)]], [0.2, 0.5]);
    });

    tally.textContent = `เดินครบ ${laps} รอบ · ยังอยู่ที่เดิม และยังไม่ได้หลักฐานใหม่สักชิ้น`;
  });
}
