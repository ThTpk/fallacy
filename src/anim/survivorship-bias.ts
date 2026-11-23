// Survivorship bias, after Abraham Wald. Three aircraft come home with holes in
// the wings and tail — all the data anyone has. The ones that never came home
// fade in above, hit through the engine and the cockpit, which is precisely
// where the survivors have no holes at all. Click to call them up again.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#survivorship-stage');
if (stage) {
  const W = 680, H = 300, HORIZON = 268;
  const LOOP = 13, SHOW = 4.2, HIDE = 10.2, FADE = 1.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เครื่องบินที่กลับฐานมีรอยกระสุนที่ปีกและหาง คลิกเพื่อให้ลำที่ไม่ได้กลับมาปรากฏขึ้น',
  });
  const { filter } = inkDefs(svg, 'sv');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 0.9).setAttribute('d', `M0 ${HORIZON} L${W} ${HORIZON}`);
  pen(scene, 0.8).setAttribute('d', `M60 ${HORIZON} q44 -16 92 -2 q38 -12 76 2 M420 ${HORIZON} q52 -20 104 -3 q36 -10 68 3`);

  // --- one aircraft, side on, nose to the right, in its own 92 × 34 space ----
  // holes: [x, y] in that space. Survivors are hit on the wing and tail; the
  // ones that did not come back are hit on the engine and the cockpit.
  const HITS_HOME: [number, number][] = [[30, 24], [41, 27], [52, 23], [16, 9], [22, 12], [36, 14], [58, 17]];
  const HITS_LOST: [number, number][] = [[80, 15], [84, 11], [63, 9], [68, 7], [76, 18]];

  const plane = (ghost: boolean) => {
    const g = el('g', {}, scene);
    const w = ghost ? 0.8 : 1.15;
    const fus = ghost ? pen(g, w) : shape(g, w);
    fus.setAttribute('d', 'M4 17 Q14 9 42 8 L66 9 Q82 11 88 17 Q80 23 62 24 L28 25 Q10 24 4 17Z');
    const fin = ghost ? pen(g, w) : shape(g, w);
    fin.setAttribute('d', 'M6 16 L1 1 L13 3 L18 15Z');
    const wing = ghost ? pen(g, w) : shape(g, w);
    wing.setAttribute('d', 'M30 20 L58 19 L70 33 L40 34Z');
    const glass = pen(g, w * 0.7);
    glass.setAttribute('d', 'M58 10 Q66 4 74 11');
    const prop = pen(g, w * 0.8);
    prop.setAttribute('d', 'M90 4 L90 30');
    const holes = (ghost ? HITS_LOST : HITS_HOME).map(([hx, hy]) => {
      const c = el('circle', { cx: hx, cy: hy, r: 1.9, fill: ghost ? 'none' : 'currentColor', stroke: 'currentColor', 'stroke-width': 0.8 }, g);
      return c;
    });
    return { g, holes };
  };

  // three that came back, low and in formation
  const home = [0, 1, 2].map(() => plane(false));
  const HOME_AT: [number, number, number][] = [[-30, 206, 0.0], [190, 182, 0.8], [410, 214, 1.6]];
  // seven that did not, higher up and slower
  const lost = Array.from({ length: 7 }, () => plane(true));
  const LOST_AT: [number, number, number][] = [
    [40, 92, 0.3], [170, 64, 1.1], [300, 104, 0.6], [430, 72, 1.8],
    [540, 118, 0.2], [96, 134, 1.4], [600, 56, 0.9],
  ];

  const headline = el('text', { x: 36, y: 44, 'font-size': 15, fill: 'currentColor', class: 'sv-t' }, scene);
  const sub = el('text', { x: 36, y: 64, 'font-size': 12.5, fill: 'currentColor', opacity: 0.7, class: 'sv-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (k < SHOW || k > HIDE) k = SHOW; });

  run((t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;

    const reveal = k < SHOW ? 0
      : k < SHOW + FADE ? ease((k - SHOW) / FADE)
        : k < HIDE ? 1
          : k < HIDE + FADE ? 1 - ease((k - HIDE) / FADE) : 0;

    headline.textContent = reveal > 0.5 ? 'ลำที่ไม่ได้กลับมา' : 'ลำที่กลับมา';
    sub.textContent = reveal > 0.5
      ? 'โดนตรงเครื่องยนต์และห้องนักบิน ซึ่งเป็นที่ที่ลำที่กลับมาไม่มีรอยเลย'
      : 'รอยกระสุนกระจุกอยู่ที่ปีกและหาง นี่คือข้อมูลทั้งหมดที่เรามี';

    home.forEach((p, i) => {
      const [x0, y, ph] = HOME_AT[i];
      const x = ((x0 + t * 26) % (W + 160)) - 120;
      const bob = Math.sin(t * 1.3 + ph) * 2.6;
      p.g.setAttribute('transform', `translate(${f(x)} ${f(y + bob)})`);
    });

    lost.forEach((p, i) => {
      const [x0, y, ph] = LOST_AT[i];
      const x = ((x0 + t * 13) % (W + 180)) - 130;
      const bob = Math.sin(t * 0.9 + ph) * 3.4;
      p.g.setAttribute('transform', `translate(${f(x)} ${f(y + bob)}) scale(0.84)`);
      p.g.setAttribute('opacity', f(reveal * 0.42));
    });
  });
}
