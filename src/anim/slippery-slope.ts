// Slippery slope: five steps down a staircase whose treads get fainter and more
// broken the further you go, with the running chance of ever arriving printed
// beside them. Each link is a generous 80%, and four of them leave 41%. The
// argument is not wrong because it is a chain; it is weak because the
// uncertainty compounds and nobody shows you the multiplication.
import { el, pen, shape, blot, limb, shoe, place, inkDefs, run, f, PEN, PAPER, type Vec, type Limb } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#slope-stage');
if (stage) {
  const W = 680, H = 344;
  const STEP_T = 0.95, HOLD = 1.5, LINK = 0.8;

  const STEPS = [
    'อนุญาตให้ทำงานที่บ้านสัปดาห์ละวัน',
    'คนจะขอเพิ่มเป็นสองวัน',
    'จะไม่มีใครเข้าออฟฟิศอีกเลย',
    'ทีมจะคุยกันน้อยลงเรื่อย ๆ',
    'วัฒนธรรมองค์กรจะพังทั้งหมด',
  ];
  const X0 = (i: number) => 30 + i * 126;
  const Y0 = (i: number) => 92 + i * 48;
  const PW = 106;
  const chance = (i: number) => Math.pow(LINK, i);

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คนเดินลงบันไดห้าขั้นที่จางลงทุกขั้น พร้อมโอกาสที่จะไปถึงแต่ละขั้น',
  });
  const { filter } = inkDefs(svg, 'sl');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // --- the staircase: every tread fainter and more broken than the last -----
  STEPS.forEach((text, i) => {
    const o = Math.pow(0.78, i);
    const g = el('g', { opacity: f(o) }, scene);
    const tread = pen(g, 1.4);
    tread.setAttribute('d', `M${X0(i)} ${Y0(i)} L${X0(i) + PW} ${Y0(i)}`);
    if (i > 0) tread.setAttribute('stroke-dasharray', `${f(12 - i * 2.4)} ${f(1 + i * 2.6)}`);
    if (i < STEPS.length - 1) {
      const riser = pen(g, 1.0);
      riser.setAttribute('d', `M${X0(i) + PW} ${Y0(i)} L${X0(i + 1)} ${Y0(i + 1)}`);
      riser.setAttribute('stroke-dasharray', `${f(8 - i * 1.2)} ${f(3 + i * 2.4)}`);
    }
    const label = el('text', { x: X0(i), y: Y0(i) + 17, 'font-size': 11.5, fill: 'currentColor', class: 'sl-t' }, g);
    label.textContent = text;
    const pct = el('text', { x: X0(i) + PW, y: Y0(i) - 7, 'text-anchor': 'end', 'font-size': 12.5, fill: 'currentColor', opacity: 0.75, class: 'sl-t sl-n' }, g);
    pct.textContent = `${Math.round(chance(i) * 100)}%`;
  });

  // --- the readout ----------------------------------------------------------
  const big = el('text', { x: 648, y: 44, 'text-anchor': 'end', 'font-size': 30, fill: 'currentColor', class: 'sl-t sl-n' }, scene);
  const smallT = el('text', { x: 648, y: 62, 'text-anchor': 'end', 'font-size': 11.5, fill: 'currentColor', opacity: 0.68, class: 'sl-t' }, scene);

  // --- the walker -----------------------------------------------------------
  const fig = el('g', {}, scene);
  const backArm = limb(fig, 3.4);
  const legs: [Limb, Limb] = [limb(fig, 4.2), limb(fig, 4.2)];
  const shoes: [SVGPathElement, SVGPathElement] = [blot(fig), blot(fig)];
  const coat = shape(fig);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, fig);
  const hat = blot(fig);
  const frontArm = limb(fig, 3.4);
  hat.setAttribute('d', 'M35.4 28.6 L49.6 28.6 Q46.6 26.8 46.2 23.6 Q42.4 20.8 38.8 23.6 Q38.4 26.8 35.4 28.6Z');

  const walk = gait({ kind: 'walk', period: 0.82 });
  const SCALE = 0.46;
  let at = 0, k = 0, moving = false, phase = 0;

  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (!moving) { k = HOLD; } });

  run((_t, dt) => {
    k += dt;
    if (!moving && k >= HOLD) { moving = true; k = 0; }
    if (moving && k >= STEP_T) { moving = false; k = 0; at = (at + 1) % STEPS.length; }

    const u = moving ? ease(k / STEP_T) : 0;
    const from = at, to = (at + 1) % STEPS.length;
    // going back to the top after the last step reads as a reset, not a step
    const reset = moving && to === 0;
    const cx = X0(from) + 53 + (X0(to) + 53 - (X0(from) + 53)) * u;
    const cy = Y0(from) + (Y0(to) - Y0(from)) * u - (reset ? 0 : Math.sin(Math.PI * u) * 7);

    fig.setAttribute('opacity', reset ? f(Math.abs(0.5 - u) * 2) : '1');
    place(fig, cx, cy, 1, SCALE);

    phase += moving ? dt / walk.period : 0;
    const pose = walk.pose(phase, moving ? 1 : 0);
    const b = pose.bob;
    pose.feet.forEach((fo, i) => { legs[i].draw([pose.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
    fig.insertBefore(legs[pose.front].g, coat);
    fig.insertBefore(shoes[pose.front], coat);

    const kF = pose.feet[pose.front].knee, aF = pose.feet[pose.front].ankle;
    const sh: Vec = [41, 41 + b];
    const fx = Math.max(kF[0] + 2.2, 46);
    coat.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.6)} ${f(70 + b)} Q${f(fx)} ${f(80 + b * 0.5)} ${f(Math.max(fx, aF[0] - 4))} 90 L31 91 L${f(33.2)} ${f(70 + b)}Z`);
    head.setAttribute('cx', '42.4'); head.setAttribute('cy', f(31.4 + b));

    const sw = moving ? Math.sin(phase * Math.PI * 2) * 0.34 : 0.12;
    ([[frontArm, sw, 3.0], [backArm, -sw, -2.2]] as const).forEach(([arm, a, off]) => {
      const s: Vec = [sh[0] + off, sh[1] + 2.2];
      const e: Vec = [s[0] + 17 * Math.sin(a), s[1] + 17 * Math.cos(a)];
      arm.draw([s, e, [e[0] + 16 * Math.sin(a + 0.2), e[1] + 16 * Math.cos(a + 0.2)]], [0.2, 0.5]);
    });

    const shown = reset ? 0 : (moving ? to : from);
    big.textContent = `${Math.round(chance(shown) * 100)}%`;
    smallT.textContent = shown === 0
      ? 'โอกาสที่จะอยู่ตรงขั้นแรก'
      : `โอกาสไปถึงขั้นนี้ · ${Array.from({ length: shown }, () => '80%').join(' × ')}`;
  });
}
