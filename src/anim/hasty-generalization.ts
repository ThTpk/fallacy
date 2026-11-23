// Hasty generalization: the whole population is on screen the entire time and
// nothing is hidden. A small sampling window sits over three of them who all
// happen to be the same, and the conclusion reads 100%. Widen the window over
// everyone and the real figure appears. Nothing was concealed — the sample was
// just small, and taken from one corner.
import { el, inkDefs, run, f } from './lib/ink.ts';
import { ease } from './lib/motion.ts';

const stage = document.querySelector('#hasty-stage');
if (stage) {
  const W = 680, H = 300;
  const COLS = 12, ROWS = 5, GX = 66, GY = 118, DX = 48, DY = 31;
  const LOOP = 11.5, SHOW = 4.0, HIDE = 9.0, FADE = 1.1;

  // a fixed pattern, then the first three forced the same so the small sample
  // is unanimous — which is exactly how a bad sample flatters itself
  const isA = Array.from({ length: COLS * ROWS }, (_, i) => ((i * 37 + 11) % 100) < 38);
  isA[0] = isA[1] = isA[2] = true;
  const total = isA.length;
  const countA = isA.filter(Boolean).length;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ประชากรหกสิบคนอยู่ครบบนจอ กรอบตัวอย่างเล็ก ๆ ครอบสามคน แล้วขยายครอบทั้งหมด',
  });
  const { filter } = inkDefs(svg, 'hg');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // the population: filled marks are type A, hollow are type B
  isA.forEach((a, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const x = GX + c * DX, y = GY + r * DY;
    el('circle', {
      cx: x, cy: y, r: a ? 5.6 : 5.2,
      fill: a ? 'currentColor' : 'none',
      stroke: 'currentColor', 'stroke-width': a ? 0 : 1.15,
    }, scene);
  });

  const frame = el('rect', { rx: 9, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-dasharray': '7 5' }, scene);

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'hg-t' }, scene);
  const sub = el('text', { x: 36, y: 66, 'font-size': 11.5, fill: 'currentColor', opacity: 0.7, class: 'hg-t' }, scene);
  const big = el('text', { x: 644, y: 50, 'text-anchor': 'end', 'font-size': 28, fill: 'currentColor', class: 'hg-t hg-n' }, scene);
  const legend = el('text', { x: 36, y: 290, 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'hg-t' }, scene);
  legend.textContent = 'วงทึบคือแบบ A · วงกลวงคือแบบ B · ทุกคนอยู่บนจอตั้งแต่ต้น ไม่มีใครถูกซ่อน';

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (k < SHOW || k > HIDE) k = SHOW; });

  run((_t, dt) => {
    k += dt;
    if (k > LOOP) k -= LOOP;
    const wide = k < SHOW ? 0
      : k < SHOW + FADE ? ease((k - SHOW) / FADE)
        : k < HIDE ? 1
          : k < HIDE + FADE ? 1 - ease((k - HIDE) / FADE) : 0;

    // the window grows from three marks to the whole grid
    const x0 = GX - 14, y0 = GY - 14;
    const wNarrow = 2 * DX + 28, hNarrow = 28;
    const wWide = (COLS - 1) * DX + 28, hWide = (ROWS - 1) * DY + 28;
    frame.setAttribute('x', f(x0));
    frame.setAttribute('y', f(y0));
    frame.setAttribute('width', f(wNarrow + (wWide - wNarrow) * wide));
    frame.setAttribute('height', f(hNarrow + (hWide - hNarrow) * wide));

    const n = Math.round(3 + (total - 3) * wide);
    const pct = wide < 0.5 ? 100 : Math.round((countA / total) * 100);
    big.textContent = `${pct}%`;
    headline.textContent = wide > 0.5 ? `ดูทั้งหมด ${total} คน` : 'ดูจากตัวอย่าง 3 คน';
    sub.textContent = wide > 0.5
      ? `เป็นแบบ A ${countA} คน · ข้อสรุปเดิมผิดไปไกล`
      : 'ทั้งสามคนเป็นแบบ A จึงสรุปว่าทุกคนเป็นแบบ A';
    if (wide > 0.02 && wide < 0.98) {
      headline.textContent = `กำลังขยายตัวอย่าง ${n} คน`;
      sub.textContent = 'ยิ่งดูมาก ตัวเลขยิ่งเข้าใกล้ของจริง';
    }
  });
}
