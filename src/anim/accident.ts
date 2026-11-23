// Fallacy of accident: a rule written for ordinary traffic comes down as a
// stamp on everything that passes, including the ambulance the rule was never
// written for. Click and the exception the rule itself grants is attached, and
// the stamp lifts over it.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#accident-stage');
if (stage) {
  const W = 680, H = 280, ROAD = 214, STAMP_X = 392;
  const SPEED = 92, SPAN = 980;
  const RED = '#b3412d';

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ตรายางกฎจราจรปั๊มรถทุกคันที่ผ่าน รวมถึงรถพยาบาล คลิกเพื่อติดข้อยกเว้น',
  });
  const { filter } = inkDefs(svg, 'ac');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${ROAD} L${W} ${ROAD}`);
  pen(scene, 0.6).setAttribute('d', Array.from({ length: 14 }, (_, i) => `M${i * 50 + 8} ${ROAD + 8} l22 0`).join(' '));

  // the rule, on a sign
  shape(scene, 1.0).setAttribute('d', 'M40 40 L250 40 L250 78 L40 78Z');
  const rule = el('text', { x: 145, y: 64, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'ac-t' }, scene);
  rule.textContent = 'กฎ ห้ามฝ่าไฟแดง';

  // the stamp
  const stampG = el('g', {}, scene);
  const stampBody = shape(stampG, 1.2);
  stampBody.setAttribute('d', `M${STAMP_X - 34} 96 L${STAMP_X + 34} 96 L${STAMP_X + 26} 126 L${STAMP_X - 26} 126Z M${STAMP_X - 8} 96 L${STAMP_X - 8} 70 L${STAMP_X + 8} 70 L${STAMP_X + 8} 96`);
  const stampCap = el('text', { x: STAMP_X, y: 118, 'text-anchor': 'middle', 'font-size': 13, fill: RED, class: 'ac-t' }, stampG);
  stampCap.textContent = 'ผิด';

  type Car = { g: SVGGElement; mark: SVGGElement; x0: number; amb: boolean; tag: SVGGElement | null };
  const make = (x0: number, amb: boolean): Car => {
    const g = el('g', {}, scene);
    const b = shape(g, 1.15);
    b.setAttribute('d', amb
      ? `M-34 ${ROAD} L-34 ${ROAD - 30} L2 ${ROAD - 30} L2 ${ROAD - 44} L30 ${ROAD - 44} L38 ${ROAD - 30} L38 ${ROAD}Z`
      : `M-30 ${ROAD} L-30 ${ROAD - 16} L-12 ${ROAD - 30} L14 ${ROAD - 30} L30 ${ROAD - 16} L30 ${ROAD}Z`);
    el('circle', { cx: -16, cy: ROAD, r: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, g);
    el('circle', { cx: 16, cy: ROAD, r: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, g);
    if (amb) {
      const cross = pen(g, 1.6);
      cross.setAttribute('stroke', RED);
      cross.setAttribute('d', `M8 ${ROAD - 22} l0 12 M2 ${ROAD - 16} l12 0`);
      const lamp = el('circle', { cx: 16, cy: ROAD - 48, r: 4, fill: RED }, g);
      void lamp;
    }
    const mark = el('g', { opacity: 0 }, g);
    const m = pen(mark, 2.0);
    m.setAttribute('stroke', RED);
    m.setAttribute('d', `M-16 ${ROAD - 24} l32 18 M16 ${ROAD - 24} l-32 18`);
    let tag: SVGGElement | null = null;
    if (amb) {
      tag = el('g', { opacity: 0 }, g);
      shape(tag, 0.9).setAttribute('d', `M-44 ${ROAD - 76} L44 ${ROAD - 76} L44 ${ROAD - 54} L-44 ${ROAD - 54}Z`);
      const tt = el('text', { x: 0, y: ROAD - 61, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', class: 'ac-t' }, tag);
      tt.textContent = 'ข้อยกเว้นที่กฎเขียนไว้เอง';
    }
    return { g, mark, x0, amb, tag };
  };

  const cars = [make(0, false), make(250, false), make(500, true), make(740, false)];

  const headline = el('text', { x: 40, y: 258, 'font-size': 12.5, fill: 'currentColor', opacity: 0.74, class: 'ac-t' }, scene);
  let exempt = false;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { exempt = !exempt; });

  run((t, dt) => {
    void dt;
    let press = 0;
    cars.forEach((c) => {
      const x = ((c.x0 + t * SPEED) % SPAN) - 150;
      c.g.setAttribute('transform', `translate(${f(x)} 0)`);
      const under = Math.abs(x - STAMP_X) < 26;
      const skip = c.amb && exempt;
      if (under && !skip) press = Math.max(press, 1 - Math.abs(x - STAMP_X) / 26);
      c.mark.setAttribute('opacity', x > STAMP_X && !skip ? '1' : '0');
      if (c.tag) c.tag.setAttribute('opacity', exempt ? '1' : '0');
    });
    stampG.setAttribute('transform', `translate(0 ${f(ease(press) * 58)})`);

    headline.textContent = exempt
      ? 'กฎข้อนี้เขียนขึ้นโดยคิดถึงรถทั่วไป และเขียนข้อยกเว้นไว้เองด้วย'
      : 'ตรายางลงทุกคันที่ผ่าน รวมถึงคันที่กฎไม่ได้เขียนถึง · คลิกเพื่อติดข้อยกเว้น';
  });
}
