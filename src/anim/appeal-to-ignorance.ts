// Appeal to ignorance: someone searches the pool of light around their own
// lantern, finds nothing, and concludes there is nothing. Widen the light and
// the thing is sitting just outside the circle that was searched. Not finding
// is only evidence when you looked where the thing would be.
import { el, pen, shape, blot, limb, shoe, place, inkDefs, run, f, PEN, PAPER, type Vec, type Limb } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#ignorance-stage');
if (stage) {
  const W = 680, H = 290, FLOOR = 244;
  const LAMP: Vec = [112, 178];
  const R0 = 128, R1 = 620;
  const LOOP = 12, SHOW = 4.2, HIDE = 9.6, FADE = 1.3;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คนถือตะเกียงค้นหาในวงแสงเล็ก ๆ คลิกเพื่อขยายวงแสงแล้วเห็นสิ่งที่อยู่นอกวง',
  });
  const { filter } = inkDefs(svg, 'ai');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${FLOOR} L${W} ${FLOOR}`);

  // the edge of the pool of light: the boundary of what was actually searched
  const ring = el('circle', { cx: LAMP[0], cy: LAMP[1], r: R0, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1, 'stroke-dasharray': '7 6', opacity: 0.5 }, scene);

  // --- things in the room, each at its own distance from the lamp ----------
  const things: { g: SVGGElement; at: Vec; sought: boolean }[] = [];
  const thing = (x: number, y: number, d: string, sought = false) => {
    const g = el('g', {}, scene);
    const p = pen(g, 1.15);
    p.setAttribute('d', d);
    things.push({ g, at: [x, y], sought });
    return g;
  };
  thing(214, 222, `M190 ${FLOOR} L190 206 L238 206 L238 ${FLOOR} M190 220 L238 220`);           // a crate
  thing(338, 214, `M322 ${FLOOR} L322 200 L326 200 L326 ${FLOOR} M350 ${FLOOR} L350 200 M320 216 L352 216 L352 222 L320 222Z`); // a stool
  thing(470, 224, `M452 ${FLOOR} q4 -28 18 -28 q14 0 18 28Z M456 224 L484 224`);                 // a barrel
  // the thing being looked for, sitting outside the circle the whole time
  thing(602, 228, `M584 ${FLOOR} q2 -22 18 -22 q16 0 18 22 M590 212 l-4 -10 l9 5 M614 212 l4 -10 l-9 5 M596 220 a2 2 0 1 0 0.1 0 M610 220 a2 2 0 1 0 0.1 0 M603 226 l0 6 M598 232 q5 4 10 0`, true);

  // --- the searcher with a lantern -----------------------------------------
  const fig = el('g', {}, scene);
  const backArm = limb(fig, 3.4);
  const legs: [Limb, Limb] = [limb(fig, 4.2), limb(fig, 4.2)];
  const shoes: [SVGPathElement, SVGPathElement] = [blot(fig), blot(fig)];
  const coat = shape(fig);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, fig);
  const hat = blot(fig);
  hat.setAttribute('d', 'M35.4 28.6 L49.6 28.6 Q46.6 26.8 46.2 23.6 Q42.4 20.8 38.8 23.6 Q38.4 26.8 35.4 28.6Z');
  const armUp = limb(fig, 3.4);
  const lampG = el('g', {}, fig);
  const lamp = shape(lampG, 0.9);
  const lampWire = pen(lampG, 0.7);

  const stand = gait({ kind: 'walk' });
  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'ai-t' }, scene);
  const sub = el('text', { x: 36, y: 64, 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'ai-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (k < SHOW || k > HIDE) k = SHOW; });

  run((t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;
    const wide = k < SHOW ? 0
      : k < SHOW + FADE ? ease((k - SHOW) / FADE)
        : k < HIDE ? 1
          : k < HIDE + FADE ? 1 - ease((k - HIDE) / FADE) : 0;

    const R = R0 + (R1 - R0) * wide;
    ring.setAttribute('r', f(R));
    ring.setAttribute('opacity', f(0.5 * (1 - wide * 0.7)));

    things.forEach(({ g, at }) => {
      const d = Math.hypot(at[0] - LAMP[0], at[1] - LAMP[1]);
      const lit = 1 - Math.min(1, Math.max(0, (d - R + 40) / 80));
      g.setAttribute('opacity', f(0.13 + 0.87 * lit));
    });

    headline.textContent = wide > 0.5 ? 'มันอยู่ตรงนั้นมาตลอด' : 'ค้นแล้วไม่เจอ';
    sub.textContent = wide > 0.5
      ? 'แสงไปไม่ถึงตรงนั้น การไม่เจอจึงไม่ได้บอกอะไรเลย'
      : 'จึงสรุปว่าไม่มี · วงประคือขอบเขตที่ค้นจริง';

    // the searcher sways and lifts the lantern a little; nothing travels
    const pose = stand.pose(0.25, 0);
    const b = Math.sin(t * 1.1) * 1.1;
    place(fig, 112, FLOOR, 1, 0.78);
    pose.feet.forEach((fo, i) => { legs[i].draw([pose.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, 0); });
    const sh: Vec = [41, 41 + b];
    coat.setAttribute('d', `M35 ${f(42.5 + b)} Q40 ${f(39.1 + b)} 46 ${f(42.5 + b)} L48 ${f(72 + b)} Q49 ${f(82 + b)} 48 90 L31 91 L33 ${f(72 + b)}Z`);
    head.setAttribute('cx', '42.4'); head.setAttribute('cy', f(31.4 + b));

    const a = -1.05 + Math.sin(t * 0.9) * 0.08;
    const s: Vec = [sh[0] + 2.6, sh[1] + 2.2];
    const e: Vec = [s[0] + 16 * Math.sin(a), s[1] + 16 * Math.cos(a)];
    const hand: Vec = [e[0] + 15 * Math.sin(a - 0.3), e[1] + 15 * Math.cos(a - 0.3)];
    armUp.draw([s, e, hand], [0.2, 0.5]);
    backArm.draw([[sh[0] - 2.2, sh[1] + 2.2], [36, 60], [35, 76]], [0.2, 0.5]);
    lampWire.setAttribute('d', `M${f(hand[0])} ${f(hand[1])} L${f(hand[0])} ${f(hand[1] + 5)}`);
    lamp.setAttribute('d', `M${f(hand[0] - 5)} ${f(hand[1] + 5)} L${f(hand[0] + 5)} ${f(hand[1] + 5)} L${f(hand[0] + 4)} ${f(hand[1] + 15)} L${f(hand[0] - 4)} ${f(hand[1] + 15)}Z`);
  });
}
