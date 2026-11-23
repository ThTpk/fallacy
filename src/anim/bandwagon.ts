// Bandwagon: a crowd walks one way past a counter that tallies them. Click any
// walker and they stop, turn, and walk back — and the tally drops by one. The
// number is something the viewer can move with a finger, which is the point:
// it counts people, and never touches whether the way is any good.
import { el, pen, shape, blot, limb, shoe, place, inkDefs, run, f, PEN, PAPER, type Vec, type Limb } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#bandwagon-stage');
if (stage) {
  const W = 680, H = 270, GROUND = 224;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ฝูงคนเดินไปทางเดียวกันใต้ตัวนับจำนวน คลิกคนเดินเพื่อให้เขากลับตัว',
  });
  const { filter } = inkDefs(svg, 'bw');
  svg.style.color = '';                      // let the card's CSS own ink and paper
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // --- road -----------------------------------------------------------------
  pen(scene, 1.0).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);
  pen(scene, 0.5).setAttribute('d', Array.from({ length: 17 }, (_, i) => `M${i * 42 + 12} ${GROUND + 7} l14 0`).join(' '));

  // a signpost the crowd is heading for: it says nothing about where it goes
  shape(scene, 0.9).setAttribute('d', `M636 ${GROUND} L644 ${GROUND} L643 118 L637 118Z`);
  shape(scene, 0.9).setAttribute('d', 'M600 104 L676 106 L672 124 L598 122Z');
  pen(scene, 0.55).setAttribute('d', 'M608 112 L660 113 M608 117 L644 118');

  // --- the tally ------------------------------------------------------------
  const tally = el('text', { x: 40, y: 44, 'font-size': 26, fill: 'currentColor', class: 'bw-t bw-n' }, scene);
  const tallyLabel = el('text', { x: 40, y: 64, 'font-size': 12.5, fill: 'currentColor', opacity: 0.62, class: 'bw-t' }, scene);
  tallyLabel.textContent = 'คนที่เลือกเดินทางนี้';
  let count = 1284500;

  // --- walkers --------------------------------------------------------------
  type Hat = 'none' | 'cap' | 'bun' | 'brim';
  interface Person {
    g: SVGGElement; legs: [Limb, Limb]; shoes: [SVGPathElement, SVGPathElement];
    coat: SVGPathElement; head: SVGEllipseElement; hat: SVGPathElement | null; hatKind: Hat;
    arms: [Limb, Limb]; swing: [ReturnType<typeof spring>, ReturnType<typeof spring>];
    walk: ReturnType<typeof gait>; phase: number; x: number; scale: number;
    dir: 1 | -1; turnT: number; counted: boolean;
  }

  const make = (x: number, scale: number, hat: Hat, speedK: number): Person => {
    const g = el('g', { style: 'cursor:pointer' }, scene);
    const farArm = limb(g, 3.4);
    const legs: [Limb, Limb] = [limb(g, 4.2), limb(g, 4.2)];
    const shoes: [SVGPathElement, SVGPathElement] = [blot(g), blot(g)];
    const coat = shape(g);
    const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
    const hatN = hat === 'none' ? null : blot(g);
    const nearArm = limb(g, 3.4);
    return {
      g, legs, shoes, coat, head, hat: hatN, hatKind: hat, arms: [farArm, nearArm],
      swing: [spring(60, 9), spring(60, 9)],
      walk: gait({ kind: 'walk', period: 1.0 / speedK }),
      phase: Math.random(), x, scale, dir: 1, turnT: -1, counted: false,
    };
  };

  // five distinct silhouettes so the crowd does not read as one shape repeated
  const crowd: Person[] = [
    make(40, 0.98, 'brim', 1.0),
    make(190, 0.72, 'cap', 1.2),    // a child: smaller, quicker steps
    make(300, 1.02, 'none', 0.94),
    make(430, 0.94, 'bun', 1.06),
    make(560, 1.0, 'cap', 0.98),
  ];
  const HATS: Record<Hat, (hx: number, hy: number) => string> = {
    none: () => '',
    cap: (hx, hy) => `M${f(hx - 4.2)} ${f(hy - 2.6)} Q${f(hx)} ${f(hy - 8.6)} ${f(hx + 4.2)} ${f(hy - 2.6)} L${f(hx + 8)} ${f(hy - 1.6)} L${f(hx - 4.2)} ${f(hy - 1.4)}Z`,
    bun: (hx, hy) => `M${f(hx - 4.4)} ${f(hy - 3)} Q${f(hx)} ${f(hy - 8)} ${f(hx + 4.4)} ${f(hy - 3)}Z M${f(hx - 7)} ${f(hy - 4)} a2.6 2.6 0 1 0 0.1 0Z`,
    brim: (hx, hy) => `M${f(hx - 7.4)} ${f(hy - 3.2)} L${f(hx + 7.6)} ${f(hy - 3.2)} Q${f(hx + 4.4)} ${f(hy - 5)} ${f(hx + 4)} ${f(hy - 8.4)} Q${f(hx)} ${f(hy - 11.4)} ${f(hx - 3.8)} ${f(hy - 8.4)} Q${f(hx - 4.2)} ${f(hy - 5)} ${f(hx - 7.4)} ${f(hy - 3.2)}Z`,
  };

  crowd.forEach((p) => p.g.addEventListener('pointerdown', () => { if (p.turnT < 0) p.turnT = 0; }));

  run((t, dt) => {
    tally.textContent = count.toLocaleString('th-TH');

    for (const p of crowd) {
      // turning round: slow to a stop, flip, walk away the other way
      let go = 1;
      if (p.turnT >= 0) {
        p.turnT += dt;
        if (p.turnT < 0.4) go = 1 - ease(p.turnT / 0.4);
        else if (p.turnT < 0.75) { go = 0; if (p.dir === 1) { p.dir = -1; count -= 1; p.counted = true; } }
        else { go = ease((p.turnT - 0.75) / 0.4); if (p.turnT > 1.15) p.turnT = -1; }
      }

      p.phase += (dt / p.walk.period) * go;
      p.x += p.dir * p.walk.speed * p.scale * dt * go;
      // leaving the right edge counts as one more who went that way
      if (p.x > W + 40) { p.x = -40; if (p.dir === 1 && !p.counted) count += 1; p.counted = false; }
      if (p.x < -40) { p.x = W + 40; p.dir = 1; p.counted = false; }
      place(p.g, p.x, GROUND, p.dir, p.scale);

      const pose = p.walk.pose(p.phase, go);
      const b = pose.bob;
      pose.feet.forEach((fo, i) => { p.legs[i].draw([pose.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(p.shoes[i], fo.ankle, fo.pitch); });
      p.g.insertBefore(p.legs[pose.front].g, p.coat);
      p.g.insertBefore(p.shoes[pose.front], p.coat);

      // coat drawn around the forward knee so the hem opens with the stride
      const kF = pose.feet[pose.front].knee, aF = pose.feet[pose.front].ankle;
      const sh: Vec = [41, 41 + b], hemY = 90;
      const fx = Math.max(kF[0] + 2.2, 46);
      p.coat.setAttribute('d', `M${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 2.4)} ${f(sh[0] + 5)} ${f(sh[1] + 1)} L${f(fx - 0.6)} ${f(70 + b)} Q${f(fx)} ${f(80 + b * 0.5)} ${f(Math.max(fx, aF[0] - 4))} ${hemY} L31 ${hemY + 1} L${f(33.2)} ${f(70 + b)}Z`);

      const hc: Vec = [42.4, 31.4 + b];
      p.head.setAttribute('cx', f(hc[0])); p.head.setAttribute('cy', f(hc[1]));
      if (p.hat) p.hat.setAttribute('d', HATS[p.hatKind](hc[0], hc[1]));

      const legSwing = (pose.feet[0].ankle[0] - 40) / (p.walk.stride / 2);
      // arms swing wide enough to clear the coat, or they vanish into it at this size
      const a0 = p.swing[0].step(-legSwing * 24 * go, dt) * Math.PI / 180;
      const a1 = p.swing[1].step(legSwing * 21 * go, dt) * Math.PI / 180;
      ([[p.arms[0], a0, -2.4], [p.arms[1], a1, 3.2]] as const).forEach(([arm, a, off]) => {
        const s: Vec = [sh[0] + off, sh[1] + 2.2];
        const e: Vec = [s[0] + 17 * Math.sin(a), s[1] + 17 * Math.cos(a)];
        arm.draw([s, e, [e[0] + 16 * Math.sin(a + 0.2), e[1] + 16 * Math.cos(a + 0.2)]], [0.2, 0.5]);
      });
    }
  });
}
