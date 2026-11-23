// Cum hoc: ice cream sales and drownings rise and fall together all summer, and
// a dashed arrow between them claims one causes the other. The sun above drives
// both. Click the sun and the heat drops — and both numbers fall at once, which
// is what a shared cause looks like from the inside.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';

const stage = document.querySelector('#cumhoc-stage');
if (stage) {
  const W = 680, H = 310;
  const RED = '#b3412d';
  const BAR_X = [96, 500], BAR_Y = 266, BAR_W = 86, BAR_MAX = 104;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ยอดขายไอศกรีมกับจำนวนคนจมน้ำขึ้นลงพร้อมกัน คลิกดวงอาทิตย์เพื่อลดความร้อน',
  });
  const { filter } = inkDefs(svg, 'ch');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${BAR_Y} L${W} ${BAR_Y}`);

  // --- the sun, the thing neither column mentions ---------------------------
  const sunG = el('g', { style: 'cursor:pointer' }, scene);
  const sunDisc = el('circle', { cx: 340, cy: 64, r: 26, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, sunG);
  const sunRays = pen(sunG, 1.0);
  const sunCap = el('text', { x: 340, y: 116, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'ch-t' }, scene);
  sunCap.textContent = 'อากาศร้อน · คลิกเพื่อลดความร้อน';

  // --- two columns, each with a drawing, a label and a bar ------------------
  const cone = pen(scene, 1.15);
  cone.setAttribute('d', 'M78 176 L112 176 L95 214Z M80 176 a16 11 0 0 1 30 0 M86 170 a9 7 0 0 1 17 0');
  const wave = pen(scene, 1.15);
  wave.setAttribute('d', 'M470 198 q14 -9 28 0 q14 9 28 0 q14 -9 28 0 M470 210 q14 -9 28 0 q14 9 28 0 q14 -9 28 0');
  const head1 = el('circle', { cx: 498, cy: 186, r: 5.4, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.15 }, scene);
  const head2 = el('circle', { cx: 540, cy: 190, r: 4.2, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.15 }, scene);
  const arms = pen(scene, 1.0);
  arms.setAttribute('d', 'M492 180 l-7 -8 M504 180 l7 -8');

  const cap = (x: number, text: string) => {
    const n = el('text', { x, y: 150, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', opacity: 0.75, class: 'ch-t' }, scene);
    n.textContent = text;
  };
  cap(139, 'ยอดขายไอศกรีม');
  cap(543, 'จำนวนคนจมน้ำ');

  const bars = BAR_X.map((x) => {
    const b = shape(scene, 1.0);
    const v = el('text', { x: x + BAR_W / 2, y: BAR_Y + 20, 'text-anchor': 'middle', 'font-size': 14, fill: 'currentColor', class: 'ch-t ch-n' }, scene);
    return { b, v };
  });

  // --- the claim ------------------------------------------------------------
  const am = el('marker', { id: 'ch-ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, svg.querySelector('defs')!);
  el('path', { d: 'M2 1L8 5L2 9', fill: 'none', stroke: RED, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, am);
  const claim = el('path', { d: 'M212 196 L452 196', fill: 'none', stroke: RED, 'stroke-width': 1.6, 'stroke-dasharray': '6 5', 'marker-end': 'url(#ch-ah)' }, scene);
  const claimCap = el('text', { x: 332, y: 184, 'text-anchor': 'middle', 'font-size': 12, fill: RED, class: 'ch-t' }, scene);
  claimCap.textContent = 'ข้ออ้าง ไอศกรีมทำให้คนจมน้ำ';

  // real arrows from the sun down to each column, only drawn once dimmed
  const real = el('path', { d: 'M322 96 L168 150 M358 96 L512 150', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3, opacity: 0 }, scene);
  const realCap = el('text', { x: 340, y: 136, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0, class: 'ch-t' }, scene);
  realCap.textContent = 'ลูกศรจริงมาจากข้างบน';

  let dim = 0, target = 0;
  sunG.addEventListener('pointerdown', () => { target = target > 0.5 ? 0 : 1; });

  run((t, dt) => {
    dim += (target - dim) * Math.min(1, dt * 3.2);
    // summer heat drifts on its own; dimming the sun pulls it down hard
    const heat = (0.62 + 0.3 * Math.sin(t * 0.55) + 0.08 * Math.sin(t * 1.7)) * (1 - 0.82 * dim);

    const r = 20 + heat * 10;
    sunDisc.setAttribute('r', f(r));
    sunDisc.setAttribute('opacity', f(0.35 + 0.65 * (1 - dim)));
    sunRays.setAttribute('opacity', f(0.3 + 0.7 * (1 - dim)));
    sunRays.setAttribute('d', Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + t * 0.12, c = Math.cos(a), s = Math.sin(a);
      return `M${f(340 + c * (r + 6))} ${f(64 + s * (r + 6))} L${f(340 + c * (r + 6 + 8 * heat))} ${f(64 + s * (r + 6 + 8 * heat))}`;
    }).join(' '));

    const vals = [Math.round(240 + heat * 520), Math.round(1 + heat * 11)];
    bars.forEach(({ b, v }, i) => {
      const h = 10 + heat * BAR_MAX;
      b.setAttribute('d', `M${BAR_X[i]} ${BAR_Y} L${BAR_X[i]} ${f(BAR_Y - h)} L${BAR_X[i] + BAR_W} ${f(BAR_Y - h)} L${BAR_X[i] + BAR_W} ${BAR_Y}Z`);
      v.textContent = i ? `${vals[i]} คน` : `${vals[i].toLocaleString('th-TH')} แท่ง`;
    });

    claim.setAttribute('opacity', f(1 - dim));
    claimCap.setAttribute('opacity', f(1 - dim));
    real.setAttribute('opacity', f(dim * 0.85));
    realCap.setAttribute('opacity', f(dim * 0.85));
  });
}
