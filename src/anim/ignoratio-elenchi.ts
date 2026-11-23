// Irrelevant conclusion: the archer is a very good shot. Every arrow lands dead
// centre — in the target nobody asked about. The target that was at issue keeps
// its clean face, and the applause keeps coming.
import { el, pen, shape, blot, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#elenchi-stage');
if (stage) {
  const W = 680, H = 290, GROUND = 250;
  const ASK: [number, number] = [318, 150];     // the target at issue
  const HIT: [number, number] = [566, 150];     // the one actually hit
  const BOW: [number, number] = [118, 170];
  const CYCLE = 3.4, FLY = 0.75;
  const RED = '#b3412d';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น นักธนูยิงเข้ากลางเป้าทางขวาทุกครั้ง ส่วนเป้าที่ต้องยิงยังสะอาด',
  });
  const { filter } = inkDefs(svg, 'ie');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);
  pen(scene, 1.0).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);

  const target = (c: [number, number], label: string, sub: string, dim: boolean) => {
    const g = el('g', {}, scene);
    [34, 23, 12].forEach((r, i) => {
      el('circle', { cx: c[0], cy: c[1], r, fill: i === 2 ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': 1.1 }, g);
    });
    pen(g, 1.0).setAttribute('d', `M${c[0]} ${c[1] + 34} L${c[0]} ${GROUND} M${c[0] - 14} ${GROUND} L${c[0]} ${GROUND - 22} L${c[0] + 14} ${GROUND}`);
    const t1 = el('text', { x: c[0], y: c[1] - 48, 'text-anchor': 'middle', 'font-size': 12.5, fill: dim ? 'currentColor' : RED, class: 'ie-t' }, g);
    t1.textContent = label;
    const t2 = el('text', { x: c[0], y: c[1] - 32, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.68, class: 'ie-t' }, g);
    t2.textContent = sub;
    return g;
  };
  target(ASK, 'ข้อที่ต้องพิสูจน์', 'มาตรการนี้จะได้ผลไหม', false);
  target(HIT, 'ข้อที่พิสูจน์จริง', 'ปัญหานี้ร้ายแรงแค่ไหน', true);

  // the archer: one arm out, a bow, no walking
  const fig = el('g', {}, scene);
  const body = shape(fig, 1.15);
  body.setAttribute('d', `M${BOW[0] - 32} ${GROUND} L${BOW[0] - 30} ${GROUND - 54} q10 -8 20 0 L${BOW[0] - 8} ${GROUND}Z`);
  el('ellipse', { cx: BOW[0] - 20, cy: GROUND - 68, rx: 7.4, ry: 8.8, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.15 }, fig);
  const arm = pen(fig, 2.6);
  arm.setAttribute('d', `M${BOW[0] - 24} ${GROUND - 50} L${BOW[0]} ${BOW[1]}`);
  const bow = pen(fig, 1.4);
  bow.setAttribute('d', `M${BOW[0]} ${BOW[1] - 26} q16 26 0 52`);
  const stringLine = pen(fig, 0.7);

  const arrow = pen(scene, 1.5);
  const stuck = Array.from({ length: 5 }, () => { const p = pen(scene, 1.4); p.setAttribute('opacity', '0'); return p; });
  const cheer = el('text', { x: HIT[0], y: GROUND - 6, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', opacity: 0, class: 'ie-t' }, scene);
  cheer.textContent = 'เข้ากลางเป้าพอดี';

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'ie-t' }, scene);
  headline.textContent = 'ยิงแม่นมาก แต่คนละเป้า';
  const tally = el('text', { x: 36, y: 278, 'font-size': 12, fill: 'currentColor', opacity: 0.7, class: 'ie-t' }, scene);

  let k = 0, shots = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) { k = 0; shots = Math.min(5, shots + 1); }

    const u = Math.min(1, k / FLY);
    const e = ease(u);
    const x = BOW[0] + (HIT[0] - BOW[0]) * e;
    const y = BOW[1] + (HIT[1] - BOW[1]) * e - Math.sin(Math.PI * e) * 46;
    if (k < FLY) {
      arrow.setAttribute('opacity', '1');
      arrow.setAttribute('d', `M${f(x - 16)} ${f(y + 4)} L${f(x)} ${f(y)}`);
      stringLine.setAttribute('d', `M${BOW[0]} ${BOW[1] - 26} L${BOW[0]} ${BOW[1] + 26}`);
    } else {
      arrow.setAttribute('opacity', '0');
      stringLine.setAttribute('d', `M${BOW[0]} ${BOW[1] - 26} L${BOW[0] - 7} ${BOW[1]} L${BOW[0]} ${BOW[1] + 26}`);
    }

    stuck.forEach((p, i) => {
      const on = i < shots || (i === shots && k >= FLY);
      p.setAttribute('opacity', on ? '1' : '0');
      if (on) p.setAttribute('d', `M${HIT[0] - 20 + i * 3} ${HIT[1] - 8 + i * 4} L${HIT[0] - 2} ${HIT[1] + i * 1.5}`);
    });

    cheer.setAttribute('opacity', f(k >= FLY && k < FLY + 1.2 ? 1 - (k - FLY) / 1.2 : 0));
    const n = shots + (k >= FLY ? 1 : 0);
    tally.textContent = `เข้ากลางเป้าไปแล้ว ${Math.min(6, n)} ครั้ง · เป้าที่ต้องยิงยังไม่โดนเลยสักดอก`;
  });
}
