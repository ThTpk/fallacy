// Appeal to novelty: the version number only ever goes up. The thing the
// version number is supposed to stand for does not.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#novelty-stage');
if (stage) {
  const W = 680, H = 316;
  const RED = '#b3412d', OK = '#2f6d4f';
  // measured quality of each release, which is not a function of its number
  const SCORE = [52, 71, 64, 78, 49, 66, 58];
  const X0 = 96, X1 = 596, BASE = 226, TOP = 104;
  const PER = 0.9, HOLD = 3.0;
  const CYCLE = SCORE.length * PER + HOLD;

  const bw = (X1 - X0) / SCORE.length - 14;
  const bx = (i: number) => X0 + i * ((X1 - X0) / SCORE.length) + 7;
  const by = (v: number) => BASE - ((BASE - TOP) * v) / 100;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เลขรุ่นเพิ่มขึ้นทุกครั้ง แต่คะแนนคุณภาพขึ้นลงไม่เป็นระเบียบ',
  });
  const { filter } = inkDefs(svg, 'nv');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'nv-t' }, scene);

  pen(scene, 1.3).setAttribute('d', `M${X0 - 12} ${BASE} L${X1 + 6} ${BASE}`);
  const axis = el('text', { x: 36, y: 96, 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'nv-t' }, scene);
  axis.textContent = 'คะแนนที่วัดได้จริง';

  const bars = SCORE.map((v, i) => {
    const r = shape(scene, 1.2);
    const tag = el('text', {
      x: bx(i) + bw / 2, y: BASE + 22, 'text-anchor': 'middle',
      'font-size': 12, fill: 'currentColor', opacity: 0, class: 'nv-t',
    }, scene);
    tag.textContent = `รุ่น ${i + 1}`;
    const num = el('text', {
      x: bx(i) + bw / 2, 'text-anchor': 'middle', 'font-size': 11.5,
      fill: 'currentColor', opacity: 0, class: 'nv-t',
    }, scene);
    return { r, tag, num, v, i };
  });

  const best = el('text', { x: 36, y: 268, 'font-size': 13, fill: OK, opacity: 0, class: 'nv-t' }, scene);
  const note = el('text', { x: 36, y: 292, 'font-size': 12.5, fill: 'currentColor', class: 'nv-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const shown = Math.min(SCORE.length, Math.floor(k / PER) + 1);
    let topI = 0;
    bars.forEach((b) => {
      if (b.i >= shown) {
        b.r.setAttribute('d', '');
        b.tag.setAttribute('opacity', '0');
        b.num.setAttribute('opacity', '0');
        return;
      }
      const u = ease(Math.min(1, (k - b.i * PER) / 0.45));
      const y = BASE - (BASE - by(b.v)) * u;
      b.r.setAttribute('d', `M${f(bx(b.i))} ${f(y)} L${f(bx(b.i) + bw)} ${f(y)} L${f(bx(b.i) + bw)} ${BASE} L${f(bx(b.i))} ${BASE}Z`);
      b.tag.setAttribute('opacity', f(u));
      b.num.setAttribute('y', f(y - 8));
      b.num.setAttribute('opacity', f(u * 0.85));
      b.num.textContent = String(b.v);
      if (b.v > SCORE[topI]) topI = b.i;
    });

    const latest = shown - 1;
    const done = shown >= SCORE.length;
    bars.forEach((b) => {
      b.r.setAttribute('stroke', b.i === topI && done ? OK : b.i === latest ? 'var(--hl)' : 'var(--line)');
    });

    best.setAttribute('opacity', f(done ? 1 : 0));
    best.textContent = `รุ่นที่ดีที่สุดคือรุ่น ${topI + 1} ไม่ใช่รุ่น ${SCORE.length}`;

    headline.textContent = done
      ? 'เลขรุ่นขึ้นทุกครั้ง คะแนนไม่ได้ขึ้นตาม'
      : `ออกรุ่นที่ ${shown} แล้ว`;
    note.textContent = done
      ? 'ความใหม่เป็นลำดับที่เพิ่มขึ้นเสมอโดยนิยาม จึงไม่มีทางเป็นหลักฐานเรื่องคุณภาพ · คลิกเพื่อดูใหม่'
      : 'แท่งสีเข้มคือรุ่นล่าสุด';
  });
}
