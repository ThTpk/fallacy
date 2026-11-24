// Ecological fallacy: the average is drawn as a line through a cloud of
// people. A pointer picks one of them at random and reports how far that
// person is from the line, which is usually a long way.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { seeded, spring } from './lib/motion.ts';

const stage = document.querySelector('#ecological-stage');
if (stage) {
  const W = 680, H = 326;
  const RED = '#b3412d', OK = '#2f6d4f';
  const X0 = 86, X1 = 600, TOP = 96, BOT = 228;
  const N = 44;
  const PICK_EVERY = 2.0;

  const rnd = seeded(17);
  // a long tail: most people low, a few very high, which is what makes the
  // average unlike almost everybody
  const people = Array.from({ length: N }, () => {
    const r = rnd(0, 1);
    const v = r < 0.82 ? rnd(8, 34) : rnd(62, 100);
    return { v, x: X0 + 14 + rnd(0, X1 - X0 - 28) };
  });
  const mean = people.reduce((s, p) => s + p.v, 0) / N;
  const py = (v: number) => BOT - ((BOT - TOP) * v) / 100;
  const CYCLE = PICK_EVERY * 5 + 1.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เส้นค่าเฉลี่ยพาดผ่านกลุ่มคน และคนที่ถูกสุ่มหยิบมักอยู่ไกลจากเส้น',
  });
  const { filter } = inkDefs(svg, 'ec');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'ec-t' }, scene);

  pen(scene, 1.2).setAttribute('d', `M${X0} ${BOT + 8} L${X1} ${BOT + 8}`);
  const groupT = el('text', { x: X0, y: BOT + 28, 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'ec-t' }, scene);
  groupT.textContent = `คนในจังหวัดนี้ ${N} คน`;

  const meanY = py(mean);
  const meanLine = pen(scene, 2);
  meanLine.setAttribute('stroke', 'var(--hl)');
  meanLine.setAttribute('stroke-dasharray', '7 5');
  meanLine.setAttribute('d', `M${X0 - 10} ${f(meanY)} L${X1 + 10} ${f(meanY)}`);
  const meanT = el('text', { x: X1 + 14, y: f(meanY + 4), 'text-anchor': 'end', 'font-size': 11.5, fill: 'var(--hl)', class: 'ec-t' }, scene);
  meanT.textContent = `ค่าเฉลี่ย ${mean.toFixed(0)}`;

  const dots = people.map((p) =>
    el('circle', { cx: f(p.x), cy: f(py(p.v)), r: 4.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, opacity: 0.55 }, scene));

  const ring = el('circle', { r: 10, fill: 'none', stroke: RED, 'stroke-width': 2.4, opacity: 0 }, scene);
  const drop = pen(scene, 1.3);
  drop.setAttribute('stroke', RED);
  drop.setAttribute('stroke-dasharray', '4 4');

  const read = el('text', { x: 36, y: 286, 'font-size': 13, fill: 'currentColor', class: 'ec-t' }, scene);
  const note = el('text', { x: 36, y: 308, 'font-size': 12, fill: 'currentColor', opacity: 0.74, class: 'ec-t' }, scene);

  const rx = spring(22, 7, people[0].x), ry = spring(22, 7, py(people[0].v));
  let k = 0, idx = 0, below = 0;
  // how many of them are below the average, which is the whole point
  const under = people.filter((p) => p.v < mean).length;

  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { idx = (idx + 7) % N; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;
    const step = Math.floor(k / PICK_EVERY);
    const want = (idx + step * 9) % N;
    const p = people[want];

    const cx = rx.step(p.x, dt), cy = ry.step(py(p.v), dt);
    ring.setAttribute('cx', f(cx));
    ring.setAttribute('cy', f(cy));
    ring.setAttribute('opacity', '1');
    drop.setAttribute('d', `M${f(cx)} ${f(cy)} L${f(cx)} ${f(meanY)}`);

    dots.forEach((d, i) => d.setAttribute('opacity', f(i === want ? 1 : 0.4)));

    const diff = p.v - mean;
    read.textContent = `คนที่หยิบมาได้ ${p.v.toFixed(0)} · ค่าเฉลี่ย ${mean.toFixed(0)} · ห่างกัน ${Math.abs(diff).toFixed(0)}`;
    headline.textContent = diff < 0
      ? 'คนที่หยิบมาได้ อยู่ต่ำกว่าค่าเฉลี่ย'
      : 'คนที่หยิบมาได้ อยู่สูงกว่าค่าเฉลี่ย';
    note.textContent = `ในกลุ่มนี้ ${under} จาก ${N} คนอยู่ต่ำกว่าค่าเฉลี่ย · ค่าเฉลี่ยจึงไม่ใช่ค่าของใครสักคน · คลิกเพื่อหยิบใหม่`;
  });
}
