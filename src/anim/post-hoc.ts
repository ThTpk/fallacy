// Post hoc: a rooster crows, then the sun rises, and the claim is that the first
// caused the second. Clicking the rooster makes it crow at any hour — and the sun
// carries on exactly as before. The reader falsifies the causal claim themselves.
import { el, pen, shape, blot, paint, place, inkDefs, run, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { palette, applyPalette, rgb, nightTint } from './lib/daynight.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#posthoc-stage');
if (stage) {
  const W = 680, H = 320, GROUND = 262, POST_TOP = 176, SCALE = 0.9;
  const LOOP = 16, CROW_AT = 5.2;          // seconds; the scheduled crow, just before dawn
  const TAU0 = 0.14, TAU1 = 0.40;          // night through to mid-morning
  const RED = '#b3412d';

  const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ไก่ขันแล้วดวงอาทิตย์ขึ้น คลิกที่ไก่เพื่อให้มันขันนอกเวลา',
  });
  const { filter } = inkDefs(svg, 'ph');
  stage.appendChild(svg);

  // paper for the whole card, then sky over the top part. Both sit behind the
  // wobble filter so the gradient stays smooth and only the drawing shivers.
  el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER }, svg);
  const grad = el('linearGradient', { id: 'ph-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, svg.querySelector('defs')!);
  const g0 = el('stop', { offset: 0 }, grad), g1 = el('stop', { offset: 1 }, grad);
  el('rect', { x: 0, y: 0, width: W, height: GROUND, fill: 'url(#ph-sky)' }, svg);

  const scene = el('g', { filter }, svg);

  // --- sky furniture -------------------------------------------------------
  const STARS: Vec[] = [[70, 48], [128, 92], [196, 36], [262, 74], [338, 50], [410, 96], [466, 40], [560, 86], [618, 58]];
  const stars = STARS.map(([x, y]) => el('circle', { cx: x, cy: y, r: 1.3, fill: 'currentColor' }, scene));
  const moon = pen(scene, 1.1);
  moon.setAttribute('d', 'M126 60 A15 15 0 1 1 126 30 A12 12 0 1 0 126 60Z');
  const sunG = el('g', {}, scene);
  const sun = el('circle', { cx: 0, cy: 0, r: 21, fill: PAPER, stroke: 'currentColor', 'stroke-width': 1.1 }, sunG);
  const rays = pen(sunG, 0.8);
  rays.setAttribute('d', Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return `M${f(c * 26)} ${f(s * 26)} L${f(c * 32)} ${f(s * 32)}`;
  }).join(' '));

  // --- land ----------------------------------------------------------------
  const hill = shape(scene, 1.0);
  hill.setAttribute('d', `M392 ${GROUND} Q470 205 540 214 Q610 222 ${W} 200 L${W} ${GROUND}Z`);
  pen(scene, 1.0).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);
  pen(scene, 0.5).setAttribute('d', Array.from({ length: 11 }, (_, i) => `M${30 + i * 58} ${GROUND + 5} q4 -5 8 0`).join(' '));

  // fence post the rooster stands on
  shape(scene, 1.0).setAttribute('d', `M154 ${POST_TOP} L182 ${POST_TOP} L179 ${GROUND} L157 ${GROUND}Z`);
  pen(scene, 0.5).setAttribute('d', `M162 ${POST_TOP + 12} L161 ${GROUND - 8} M173 ${POST_TOP + 18} L174 ${GROUND - 12}`);
  pen(scene, 0.9).setAttribute('d', `M104 ${POST_TOP + 30} L154 ${POST_TOP + 25} M182 ${POST_TOP + 25} L252 ${POST_TOP + 31}`);

  // --- the rooster, in figure space: feet on y 120, facing +x --------------
  const fig = el('g', { style: 'cursor:pointer' }, scene);
  const tail = pen(fig, PEN);
  const legs = pen(fig, PEN * 0.9);
  const feet = [blot(fig), blot(fig)];
  const body = shape(fig, PEN);
  const wing = pen(fig, PEN * 0.8);
  const neck = shape(fig, PEN);
  const head = el('ellipse', { rx: 6.4, ry: 5.8, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, fig);
  const comb = paint(fig, RED, PEN * 0.8);
  const wattle = paint(fig, RED, PEN * 0.8);
  const beakUp = blot(fig), beakLo = blot(fig);
  const eye = el('circle', { r: 0.9, fill: 'currentColor' }, fig);
  const sound = pen(scene, 1.0);

  // --- the claim ------------------------------------------------------------
  const claim = el('g', { opacity: 0 }, scene);
  const arrowDefs = el('marker', { id: 'ph-ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, svg.querySelector('defs')!);
  el('path', { d: 'M2 1L8 5L2 9', fill: 'none', stroke: RED, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, arrowDefs);
  const arrow = el('path', { fill: 'none', stroke: RED, 'stroke-width': 1.6, 'stroke-dasharray': '6 5', 'marker-end': 'url(#ph-ah)' }, claim);
  arrow.setAttribute('d', 'M244 104 Q368 58 486 118');
  const label = el('text', { x: 368, y: 44, 'text-anchor': 'middle', 'font-size': 14, fill: RED, class: 'ph-t' }, claim);
  label.textContent = 'ไก่ขันทำให้ดวงอาทิตย์ขึ้น';

  const bodyBob = spring(40, 7);
  let crowT = -1, lastLoop = -1;
  fig.addEventListener('pointerdown', () => { if (crowT < 0) crowT = 0; });

  run((t, dt) => {
    const loopT = t % LOOP;
    const loopN = Math.floor(t / LOOP);
    if (loopN !== lastLoop && loopT >= CROW_AT) { lastLoop = loopN; if (crowT < 0) crowT = 0; }

    const tau = TAU0 + (loopT / LOOP) * (TAU1 - TAU0);
    const P = palette(tau);
    applyPalette(svg, P);
    g0.setAttribute('stop-color', rgb(P.top));
    g1.setAttribute('stop-color', rgb(P.bottom));
    const red = nightTint(RED, P);
    comb.setAttribute('fill', red); wattle.setAttribute('fill', red);

    stars.forEach((s, i) => s.setAttribute('opacity', f(P.night * (0.55 + 0.45 * Math.sin(t * 1.7 + i * 2.1)))));
    moon.setAttribute('opacity', f(P.night * 0.9));

    // the sun keeps its own schedule, whatever the rooster does
    const alt = smooth(0.233, 0.345, tau);
    sunG.setAttribute('transform', `translate(540 ${f(250 - alt * 136)})`);
    sunG.setAttribute('opacity', f(smooth(0.225, 0.26, tau)));

    // crow envelope: throw the head back, hold, settle
    if (crowT >= 0) { crowT += dt; if (crowT > 1.9) crowT = -1; }
    const c = crowT < 0 ? 0 : crowT < 0.22 ? ease(crowT / 0.22) : crowT < 1.0 ? 1 : 1 - ease((crowT - 1.0) / 0.6);
    const bob = bodyBob.step(-c * 3, dt);

    place(fig, 168, POST_TOP + 1, 1, SCALE);

    // body: one fat closed paper shape, heavy breast at the front, tail end lighter
    const by = 104 + bob;                       // where the body meets the legs
    body.setAttribute('d', `M18 ${f(by - 36)} Q22 ${f(by - 49 - c)} 38 ${f(by - 45 - c)} Q54 ${f(by - 41)} 57 ${f(by - 26)} Q60 ${f(by - 11)} 46 ${f(by - 4)} Q31 ${f(by + 1)} 22 ${f(by - 11)} Q14 ${f(by - 24)} 18 ${f(by - 36)}Z`);
    wing.setAttribute('d', `M25 ${f(by - 33)} Q39 ${f(by - 28)} 47 ${f(by - 15)} M27 ${f(by - 26)} Q38 ${f(by - 22)} 44 ${f(by - 12)}`);
    // tail: three curved feathers leaving the back of the body, lifting as it crows
    tail.setAttribute('d', [
      `M19 ${f(by - 34)} Q4 ${f(by - 48 - c * 3)} 1 ${f(by - 70 - c * 5)}`,
      `M18 ${f(by - 29)} Q1 ${f(by - 40 - c * 2)} -2 ${f(by - 58 - c * 4)}`,
      `M19 ${f(by - 24)} Q6 ${f(by - 30)} 0 ${f(by - 44 - c * 2)}`,
    ].join(' '));

    // short legs down to fat ink feet gripping the post
    legs.setAttribute('d', `M33 ${f(by - 3)} L32 116 M43 ${f(by - 4)} L44 116`);
    feet.forEach((n, i) => {
      const x = i ? 44 : 32;
      n.setAttribute('d', `M${x - 4.5} 115 Q${x} 113 ${x + 4.5} 115 Q${x + 5.5} 120 ${x} 120.5 Q${x - 5.5} 120 ${x - 4.5} 115Z`);
    });

    // head arcs up and back as it crows, on a short thick neck
    const hx = 58 - c * 6, hy = 46 - bob * 0.3 - c * 16;
    head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
    neck.setAttribute('d', `M44 ${f(by - 40)} Q${f(hx - 8)} ${f(hy + 15)} ${f(hx - 5.5)} ${f(hy + 4)} L${f(hx + 3)} ${f(hy + 5)} Q${f(hx + 1)} ${f(hy + 17)} 55 ${f(by - 33)}Z`);
    comb.setAttribute('d', `M${f(hx - 5)} ${f(hy - 5)} q2 -5 4 -1 q2 -5 4 -1 q2 -4 3 1 Q${f(hx + 2)} ${f(hy - 7)} ${f(hx - 5)} ${f(hy - 5)}Z`);
    wattle.setAttribute('d', `M${f(hx + 3)} ${f(hy + 4)} q3 1 3 4 q-2 2 -4 0Z`);
    eye.setAttribute('cx', f(hx + 1.5)); eye.setAttribute('cy', f(hy - 1));
    // beak opens with the crow
    const open = c * 7;
    beakUp.setAttribute('d', `M${f(hx + 5)} ${f(hy - 1)} L${f(hx + 15)} ${f(hy - 2 - open * 0.5)} L${f(hx + 5)} ${f(hy + 1.5)}Z`);
    beakLo.setAttribute('d', `M${f(hx + 5)} ${f(hy + 1)} L${f(hx + 13)} ${f(hy + 3 + open)} L${f(hx + 5)} ${f(hy + 3)}Z`);

    // three arcs of sound leaving the beak
    if (c > 0.02) {
      const bx = 168 + SCALE * (hx + 16 - 40), byy = POST_TOP + 1 + SCALE * (hy - 120);
      sound.setAttribute('opacity', f(c * 0.9));
      sound.setAttribute('d', [0, 1, 2].map((i) => {
        const r = (8 + i * 7) * (0.7 + 0.3 * c);
        return `M${f(bx + r * 0.5)} ${f(byy - r * 0.72)} Q${f(bx + r * 1.15)} ${f(byy)} ${f(bx + r * 0.5)} ${f(byy + r * 0.72)}`;
      }).join(' '));
    } else sound.setAttribute('opacity', '0');

    // the claim only appears once the sun is clearly up
    claim.setAttribute('opacity', f(smooth(0.5, 0.95, alt) * 0.95));
  });
}
