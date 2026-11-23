// Division: the company is rich, so the people in it are rich. The profit bar
// breaks apart and falls to the twelve of them, and the pieces are nothing like
// each other. The mean is a property of the whole; nobody is paid the mean.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#division-stage');
if (stage) {
  const W = 680, H = 300, BASE = 248;
  const BAR_X = 56, BAR_Y = 92, BAR_W = 568, BAR_H = 34;
  const SHARE = [300, 80, 40, 20, 14, 10, 8, 7, 6, 5, 5, 5];   // ล้านบาท
  const TOTAL = SHARE.reduce((a, b) => a + b, 0);
  const sorted = [...SHARE].sort((a, b) => a - b);
  const MEDIAN = (sorted[5] + sorted[6]) / 2;
  const MEAN = TOTAL / SHARE.length;
  const LOOP = 11, SPLIT = 3.4, FALL = 1.5, BACK = 8.6;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น แท่งกำไรของบริษัทแตกออกเป็นส่วนไม่เท่ากันแล้วตกลงไปหาพนักงานสิบสองคน',
  });
  const { filter } = inkDefs(svg, 'dv');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  pen(scene, 1.0).setAttribute('d', `M0 ${BASE} L${W} ${BASE}`);

  const folk = SHARE.map((_, i) => {
    const x = 74 + i * 48;
    const g = el('g', {}, scene);
    const body = shape(g, 1.0);
    body.setAttribute('d', `M${x - 8} ${BASE} L${x - 7} ${BASE - 24} q7 -5 14 0 L${x + 8} ${BASE}Z`);
    el('ellipse', { cx: x, cy: BASE - 32, rx: 5, ry: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.0 }, g);
    return x;
  });

  // each slice starts inside the bar and ends standing on its own person
  let acc = 0;
  const slices = SHARE.map((s, i) => {
    const w = (s / TOTAL) * BAR_W;
    const x0 = BAR_X + acc; acc += w;
    const g = el('g', {}, scene);
    const p = shape(g, 1.0);
    p.setAttribute('d', `M0 0 L${f(w)} 0 L${f(w)} ${BAR_H} L0 ${BAR_H}Z`);
    const lab = el('text', { x: f(w / 2), y: BAR_H + 14, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'currentColor', opacity: 0, class: 'dv-t dv-n' }, g);
    lab.textContent = String(s);
    // the slices keep their real widths and simply open gaps — the 300 share is
    // 341 px wide, so centring it over one person would run off the card and
    // say nothing true about the split
    return { g, lab, x0, w, from: [x0, BAR_Y] as [number, number], to: [x0 + i * 4, BAR_Y + 58] as [number, number] };
  });

  // a thread from each slice down to the person it belongs to
  const leads = SHARE.map(() => {
    const p = pen(scene, 0.7);
    p.setAttribute('opacity', '0');
    return p;
  });

  const barCap = el('text', { x: BAR_X, y: BAR_Y - 12, 'font-size': 12.5, fill: 'currentColor', opacity: 0.72, class: 'dv-t' }, scene);
  barCap.textContent = `กำไรบริษัท ${TOTAL} ล้านบาท`;
  const headline = el('text', { x: BAR_X, y: 36, 'font-size': 14.5, fill: 'currentColor', class: 'dv-t' }, scene);
  const sub = el('text', { x: BAR_X, y: 56, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'dv-t' }, scene);
  const foot = el('text', { x: BAR_X, y: 288, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'dv-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = (k > SPLIT + FALL && k < BACK) ? BACK : SPLIT; });

  run((_t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;
    const u = k < SPLIT ? 0
      : k < SPLIT + FALL ? ease((k - SPLIT) / FALL)
        : k < BACK ? 1
          : k < BACK + FALL ? 1 - ease((k - BACK) / FALL) : 0;

    slices.forEach(({ g, lab, from, to, w }, i) => {
      const x = from[0] + (to[0] - from[0]) * u;
      const y = from[1] + (to[1] - from[1]) * u;
      g.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
      lab.setAttribute('opacity', f(u));
      leads[i].setAttribute('opacity', f(u * 0.55));
      leads[i].setAttribute('d', `M${f(x + w / 2)} ${f(y + BAR_H + 18)} L${f(folk[i])} ${f(BASE - 44)}`);
    });

    headline.textContent = u > 0.5 ? 'พอแบ่งจริง หน้าตาเป็นแบบนี้' : 'ข้ออ้าง บริษัทรวย พนักงานจึงรวย';
    sub.textContent = u > 0.5
      ? `เฉลี่ยคนละ ${MEAN.toFixed(1)} ล้าน แต่คนตรงกลางได้ ${MEDIAN} ล้าน`
      : 'ตัวเลขของทั้งก้อนยังไม่บอกอะไรเกี่ยวกับใครสักคน';
    foot.textContent = u > 0.5
      ? 'ค่าเฉลี่ยเป็นคุณสมบัติของส่วนรวม ไม่ใช่ของใครคนใดคนหนึ่ง'
      : 'ตัวเลขบนแท่งคือหน่วยล้านบาท';
  });
}
