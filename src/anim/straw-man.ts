// Straw man: someone builds a straw figure of the argument and knocks it down,
// over and over, while the person who actually made the argument stands a few
// paces away and is never touched. Click to knock it down again — the counter
// goes up, and the real proposal is exactly where it was.
import { el, pen, shape, blot, limb, shoe, place, inkDefs, run, f, PEN, PAPER, type Vec, type Limb } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#strawman-stage');
if (stage) {
  const W = 680, H = 290, GROUND = 238;
  const LOOP = 7.6, WIND = 1.3, HIT = 1.95, FALL_END = 2.9, UP0 = 4.9, UP1 = 5.9;
  const STRAW = '#b8893f';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คนทุบหุ่นฟางล้มซ้ำ ๆ ขณะที่คนที่เสนอจริงยืนอยู่อีกฝั่งโดยไม่ถูกแตะ',
  });
  const { filter } = inkDefs(svg, 'sm');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);
  pen(scene, 0.5).setAttribute('d', Array.from({ length: 13 }, (_, i) => `M${i * 54 + 16} ${GROUND + 7} l16 0`).join(' '));

  // --- a standing figure, reused for both people with different headgear -----
  const rest = gait({ kind: 'walk' });
  interface Person { g: SVGGElement; legs: [Limb, Limb]; shoes: [SVGPathElement, SVGPathElement]; coat: SVGPathElement; head: SVGEllipseElement; hat: SVGPathElement; arm: Limb; back: Limb }
  const person = (): Person => {
    const g = el('g', {}, scene);
    const back = limb(g, 3.4);
    const legs: [Limb, Limb] = [limb(g, 4.2), limb(g, 4.2)];
    const shoes: [SVGPathElement, SVGPathElement] = [blot(g), blot(g)];
    const coat = shape(g);
    const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
    const hat = blot(g);
    const arm = limb(g, 3.4);
    return { g, legs, shoes, coat, head, hat, arm, back };
  };
  const drawBody = (p: Person) => {
    const pose = rest.pose(0.25, 0);
    pose.feet.forEach((fo, i) => { p.legs[i].draw([pose.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(p.shoes[i], fo.ankle, 0); });
    const sh: Vec = [41, 41];
    p.coat.setAttribute('d', `M35 42.5 Q40 39.1 46 42.5 L48 72 Q49 82 48 90 L31 91 L33 72Z`);
    p.head.setAttribute('cx', '42.4'); p.head.setAttribute('cy', '31.4');
    return sh;
  };

  const speaker = person();      // the one who actually made the argument
  const arguer = person();       // the one swinging
  speaker.hat.setAttribute('d', 'M35 28.4 L50 28.4 Q46.8 26.6 46.4 23.2 Q42.4 20.2 38.6 23.2 Q38.2 26.6 35 28.4Z');
  arguer.hat.setAttribute('d', 'M38.2 28.8 Q42.4 22.8 46.6 28.8 L50.4 29.8 L38.2 30Z');

  // --- the straw figure, on its own stake, rotating about its feet ----------
  const strawG = el('g', {}, scene);
  const SB: Vec = [474, GROUND];                     // the base it pivots on
  const strawStroke = (w = 1.3) => el('path', { fill: 'none', stroke: STRAW, 'stroke-width': w, 'stroke-linecap': 'round' }, strawG);
  const sBody = strawStroke(1.5), sHead = strawStroke(1.4), sArms = strawStroke(1.3), sLegs = strawStroke(1.4), sTuft = strawStroke(1.0);
  sBody.setAttribute('d', 'M474 196 L470 152 M474 196 L478 152 M472 174 L476 174 M471 186 L477 185');
  sHead.setAttribute('d', 'M474 152 m-9 -9 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0');
  sArms.setAttribute('d', 'M452 166 L496 162 M452 166 L448 158 M496 162 L500 155');
  sLegs.setAttribute('d', `M474 196 L464 ${GROUND} M474 196 L485 ${GROUND}`);
  sTuft.setAttribute('d', 'M468 136 l-4 -8 M474 134 l0 -9 M480 136 l4 -8');

  // straw that flies off on impact
  const bits = Array.from({ length: 6 }, () => el('path', { fill: 'none', stroke: STRAW, 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0 }, scene));
  const BIT: Vec[] = [[1.4, -1.1], [1.1, -1.6], [1.7, -0.5], [0.8, -1.8], [1.5, -1.4], [1.2, -0.8]];

  // --- labels ---------------------------------------------------------------
  const plaque = (x: number, y: number, w: number, head: string, body: string, colour: string) => {
    shape(scene, 0.8).setAttribute('d', `M${x} ${y} L${x + w} ${y} L${x + w} ${y + 40} L${x} ${y + 40}Z`);
    const a = el('text', { x: x + w / 2, y: y + 16, 'text-anchor': 'middle', 'font-size': 11.5, fill: colour, opacity: 0.85, class: 'sm-t' }, scene);
    const b = el('text', { x: x + w / 2, y: y + 32, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'currentColor', class: 'sm-t' }, scene);
    a.textContent = head; b.textContent = body;
  };
  plaque(40, 96, 168, 'ข้อเสนอจริง', 'ควรลดงบส่วนนี้บ้าง', 'currentColor');
  plaque(396, 70, 168, 'รูปที่ถูกบิด', 'ยกเลิกทั้งหมด', STRAW);

  const tally = el('text', { x: 40, y: 272, 'font-size': 12.5, fill: 'currentColor', opacity: 0.68, class: 'sm-t' }, scene);

  // the stick lives inside the arguer so it places and scales with them.
  // It must exist before run(), which draws immediately in ?debug.
  const stick = pen(arguer.g, PEN * 0.9);

  let k = 0, hits = 0, fired = false;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (k > FALL_END || k < WIND) { k = WIND; fired = false; } });

  run((t, dt) => {
    k += dt;
    if (k > LOOP) { k -= LOOP; fired = false; }

    // the straw figure: upright, toppling, down, then set up again
    let ang = 0;
    if (k >= HIT && k < FALL_END) ang = 84 * ease((k - HIT) / (FALL_END - HIT));
    else if (k >= FALL_END && k < UP0) ang = 84;
    else if (k >= UP0 && k < UP1) ang = 84 * (1 - ease((k - UP0) / (UP1 - UP0)));
    strawG.setAttribute('transform', `rotate(${f(ang)} ${f(SB[0])} ${f(SB[1])})`);
    strawG.setAttribute('opacity', k >= UP0 && k < UP1 ? f(0.45 + 0.55 * ease((k - UP0) / (UP1 - UP0))) : '1');

    if (k >= HIT && !fired) { fired = true; hits += 1; }
    tally.textContent = `ทุบหุ่นฟางไปแล้ว ${hits.toLocaleString('th-TH')} ครั้ง · ข้อเสนอจริงยังไม่ถูกแตะเลยสักครั้ง`;

    // straw flying off, for about half a second after the hit
    const fly = k >= HIT && k < HIT + 0.6 ? (k - HIT) / 0.6 : -1;
    bits.forEach((b, i) => {
      if (fly < 0) { b.setAttribute('opacity', '0'); return; }
      const [vx, vy] = BIT[i];
      const x = 486 + vx * 54 * fly, y = 168 + vy * 46 * fly + 70 * fly * fly;
      b.setAttribute('opacity', f(0.9 * (1 - fly)));
      b.setAttribute('d', `M${f(x)} ${f(y)} l${f(5 + i)} ${f(2 - i * 0.6)}`);
    });

    // --- the two people ----------------------------------------------------
    place(speaker.g, 118, GROUND, 1, 0.95);
    drawBody(speaker);
    speaker.arm.draw([[42.6, 43.4], [45, 60], [46, 77]], [0.2, 0.5]);
    speaker.back.draw([[40, 43.2], [37.6, 60], [36.6, 77]], [0.2, 0.5]);

    place(arguer.g, 362, GROUND, 1, 0.95);
    drawBody(arguer);
    // wind up, swing through the straw figure, drop back
    const sw = k < WIND ? 0
      : k < HIT ? -0.85 * ease((k - WIND) / (HIT - WIND))
        : k < HIT + 0.22 ? -0.85 + 2.0 * ease((k - HIT) / 0.22)
          : k < HIT + 0.9 ? 1.15 - 1.15 * ease((k - HIT - 0.22) / 0.68) : 0;
    const s: Vec = [44, 43.4];
    const e: Vec = [s[0] + 17 * Math.sin(sw + 0.2), s[1] + 17 * Math.cos(sw + 0.2)];
    const hand: Vec = [e[0] + 16 * Math.sin(sw + 0.5), e[1] + 16 * Math.cos(sw + 0.5)];
    arguer.arm.draw([s, e, hand], [0.2, 0.5]);
    arguer.back.draw([[40, 43.2], [37.6, 60], [36.6, 77]], [0.2, 0.5]);
    // the stick carries on past the hand
    stick.setAttribute('d', `M${f(hand[0])} ${f(hand[1])} L${f(hand[0] + 30 * Math.sin(sw + 0.6))} ${f(hand[1] + 30 * Math.cos(sw + 0.6))}`);
  });
}
