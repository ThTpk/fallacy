// The archive, as a shelf. Decoration for the home page, not an explainer:
// a hanging lamp that swings when the pointer moves, a row of folders, dust in
// the light, and a cat asleep on the end that wakes up when you come near.
import { el, pen, shape, blot, inkDefs, run, f } from './lib/ink.ts';
import { pendulum, spring, seeded, wobble } from './lib/motion.ts';

const stage = document.querySelector('#home-shelf');
if (stage) {
  const W = 680, H = 182;
  const SHELF = 150;              // the top of the plank: everything stands here
  const PIVOT: [number, number] = [268, -6];
  const LAMP_LEN = 54;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ชั้นวางแฟ้มใต้โคมไฟแขวน มีแมวนอนอยู่ปลายชั้น',
  });
  const { filter, defs } = inkDefs(svg, 'hs');

  // light has to fade out, or it reads as spilled paint
  const grad = el('linearGradient', { id: 'hs-beam', x1: '0', y1: '0', x2: '0', y2: '1' });
  el('stop', { offset: '0', 'stop-color': 'var(--lamp)', 'stop-opacity': '0.30' }, grad);
  el('stop', { offset: '1', 'stop-color': 'var(--lamp)', 'stop-opacity': '0' }, grad);
  defs.appendChild(grad);
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const rnd = seeded(7);

  // --- the plank -------------------------------------------------------
  shape(scene, 1.3).setAttribute(
    'd', `M34 ${SHELF} L646 ${SHELF} L646 ${SHELF + 8} L34 ${SHELF + 8}Z`,
  );
  [78, 602].forEach((x) => {
    pen(scene, 1.2).setAttribute('d', `M${x} ${SHELF + 8} L${x} ${SHELF + 24}`);
  });

  // --- the folders -----------------------------------------------------
  // one of them leans, because a shelf where everything is upright looks drawn
  let x = 96;
  const LEAN_AT = 7;
  for (let i = 0; i < 13; i++) {
    const w = 15 + Math.round(rnd(0, 13));
    const h = 54 + Math.round(rnd(0, 46));
    const lean = i === LEAN_AT ? 7 : 0;
    const top = SHELF - h;
    shape(scene, 1.15).setAttribute(
      'd',
      `M${f(x)} ${SHELF} L${f(x + lean)} ${f(top)} L${f(x + lean + w)} ${f(top)} L${f(x + w)} ${SHELF}Z`,
    );
    // a label band near the top of the spine
    pen(scene, 0.9).setAttribute(
      'd', `M${f(x + lean + 3)} ${f(top + 14)} L${f(x + lean + w - 3)} ${f(top + 14)}`,
    );
    x += w + 2 + rnd(0, 3);
  }

  // --- the lamp, on a cord that swings ---------------------------------
  const lampG = el('g', {}, scene);
  const cord = pen(lampG, 1.1);
  const shade = shape(lampG, 1.3);
  const bulb = pen(lampG, 1.0);
  // drawn over the folders, not under them: the folders are filled with paper,
  // so a beam behind them only shows in the gaps and reads as a spill
  const cone = el('path', { fill: 'url(#hs-beam)', stroke: 'none' }, scene);

  const motes = Array.from({ length: 8 }, () => ({
    u: rnd(0, 1), s: rnd(0.22, 0.55), o: rnd(-1, 1),
    node: el('circle', { r: f(rnd(0.9, 1.9)), fill: 'var(--lamp)', opacity: 0.75 }, scene),
  }));

  // --- the cat ---------------------------------------------------------
  const catG = el('g', {}, scene);
  const body = shape(catG, 1.25);
  const head = shape(catG, 1.25);
  const earA = shape(catG, 1.1);
  const earB = shape(catG, 1.1);
  const tail = pen(catG, 1.35);
  const eye = pen(catG, 1.1);
  const CAT_X = 512;

  const pend = pendulum(9, 1.15);
  const wake = spring(22, 6);
  let pointer: [number, number] | null = null;
  let lastPx = 0;

  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    pointer = [px, py];
    pend.kick((px - lastPx) * 0.016);
    lastPx = px;
  });
  svg.addEventListener('pointerleave', () => { pointer = null; });

  run((t, dt) => {
    // the lamp
    const a = pend.step(0, dt) + wobble(t * 0.35) * 0.012;
    const bx = PIVOT[0] + Math.sin(a) * LAMP_LEN;
    const by = PIVOT[1] + Math.cos(a) * LAMP_LEN;
    cord.setAttribute('d', `M${PIVOT[0]} ${PIVOT[1]} L${f(bx)} ${f(by)}`);

    const sw = 34, sh = 20;
    const nx = Math.sin(a), ny = Math.cos(a);          // down the cord
    const px2 = ny, py2 = -nx;                          // across it
    const sx = bx, sy = by;
    const tipL = [sx - px2 * 11 - nx * 0, sy - py2 * 11 - ny * 0];
    const basL = [sx + nx * sh - px2 * sw, sy + ny * sh - py2 * sw];
    const basR = [sx + nx * sh + px2 * sw, sy + ny * sh + py2 * sw];
    const tipR = [sx + px2 * 11, sy + py2 * 11];
    shade.setAttribute(
      'd',
      `M${f(tipL[0])} ${f(tipL[1])} L${f(basL[0])} ${f(basL[1])} L${f(basR[0])} ${f(basR[1])} L${f(tipR[0])} ${f(tipR[1])}Z`,
    );
    const bl = [sx + nx * (sh + 6), sy + ny * (sh + 6)];
    bulb.setAttribute(
      'd',
      `M${f(bl[0] - px2 * 5)} ${f(bl[1] - py2 * 5)} Q${f(bl[0] + nx * 7)} ${f(bl[1] + ny * 7)} ${f(bl[0] + px2 * 5)} ${f(bl[1] + py2 * 5)}`,
    );

    // the light it throws, widening as it falls to the shelf
    const spread = 128;
    const drop = SHELF + 6 - bl[1];
    const fx = bl[0] + nx * drop * 1.6;
    cone.setAttribute(
      'd',
      `M${f(bl[0] - px2 * 16)} ${f(bl[1] - py2 * 16)} L${f(fx - spread)} ${SHELF + 6} L${f(fx + spread)} ${SHELF + 6} L${f(bl[0] + px2 * 16)} ${f(bl[1] + py2 * 16)}Z`,
    );

    // dust, drifting up through the beam
    motes.forEach((m) => {
      m.u = (m.u + dt * m.s * 0.06) % 1;
      const y = SHELF - 4 - m.u * (SHELF - bl[1] - 10);
      // the beam is narrow at the bulb and wide at the shelf, so a mote low
      // down may sit far from the centre line and one near the bulb may not
      const down = (SHELF - y) / Math.max(1, drop);      // 1 at the shelf, 0 at the bulb
      const wide = 16 + (1 - down) * spread * 0.9;
      m.node.setAttribute('cx', f(fx + m.o * wide + wobble(t * 0.5 + m.o * 9) * 6));
      m.node.setAttribute('cy', f(y));
      m.node.setAttribute('opacity', f(0.15 + 0.55 * Math.sin(Math.PI * m.u)));
    });

    // the cat: asleep until something comes near the right end of the shelf
    const near = pointer && pointer[0] > CAT_X - 120 && pointer[1] > 40 ? 1 : 0;
    const w2 = wake.step(near, dt);
    const breath = Math.sin(t * 1.5) * 0.7 * (1 - w2 * 0.6);

    const bw = 74, bh = 20 + w2 * 5;
    const bx0 = CAT_X, by0 = SHELF;
    const lift = w2 * 9;                        // the head and shoulders come up
    body.setAttribute(
      'd',
      `M${f(bx0)} ${f(by0)}
       C${f(bx0 - 4)} ${f(by0 - bh - breath - lift * 0.95)} ${f(bx0 + 18)} ${f(by0 - bh - 6 - breath - lift * 0.8)} ${f(bx0 + 34)} ${f(by0 - bh - 4 - breath - lift * 0.5)}
       C${f(bx0 + 52)} ${f(by0 - bh - 2 - breath - lift * 0.5)} ${f(bx0 + bw)} ${f(by0 - bh + 2 - breath)} ${f(bx0 + bw)} ${f(by0)}Z`,
    );

    const hx = bx0 + 12, hy = by0 - bh - 7 - breath - lift;
    const hr = 12.5;
    head.setAttribute(
      'd',
      `M${f(hx - hr)} ${f(hy)} a${hr} ${hr * 0.92} 0 1 1 ${hr * 2} 0 a${hr} ${hr * 0.92} 0 1 1 ${-hr * 2} 0Z`,
    );
    earA.setAttribute('d', `M${f(hx - 9)} ${f(hy - 8)} L${f(hx - 11)} ${f(hy - 18)} L${f(hx - 2)} ${f(hy - 12)}Z`);
    earB.setAttribute('d', `M${f(hx + 9)} ${f(hy - 8)} L${f(hx + 11)} ${f(hy - 18)} L${f(hx + 2)} ${f(hy - 12)}Z`);

    // closed while asleep, a dot once awake
    eye.setAttribute('stroke-width', f(1.1 + w2 * 1.1));
    eye.setAttribute(
      'd',
      w2 > 0.5
        ? `M${f(hx - 5)} ${f(hy - 1)} L${f(hx - 4.4)} ${f(hy - 1)}`
        : `M${f(hx - 8)} ${f(hy - 1)} Q${f(hx - 5)} ${f(hy + 2)} ${f(hx - 2)} ${f(hy - 1)}`,
    );

    // the tail curls around the body, and flicks when awake
    const flick = w2 * Math.sin(t * 4.2) * 14;
    tail.setAttribute(
      'd',
      `M${f(bx0 + bw - 2)} ${f(by0 - 3)}
       C${f(bx0 + bw + 22)} ${f(by0 - 2)} ${f(bx0 + bw + 30)} ${f(by0 - 20 - flick)} ${f(bx0 + bw + 12)} ${f(by0 - 26 - flick * 1.4)}`,
    );
  });

  // a dot of ink in the corner, the way a drawing gets signed
  blot(scene).setAttribute('d', `M640 ${SHELF + 16} a2 2 0 1 0 0.1 0Z`);
}
