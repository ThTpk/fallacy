// Gish gallop: the asymmetry is in the clock, so the clock is what this draws.
// Claims land every fraction of a second. The scanner that checks them takes
// seconds each. You watch it fall behind and never catch up.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#gallop-stage');
if (stage) {
  const W = 680, H = 300;
  const RED = '#b3412d', OK = '#2f6d4f';
  const N = 24, PER_ROW = 12;
  const DROP = 0.5;         // seconds between claims arriving, as the headline says
  const CHECK = 3.4;        // seconds to check one claim
  const CYCLE = N * DROP + 1.6;

  const slot = (i: number): [number, number] => [
    82 + (i % PER_ROW) * 44,
    132 + Math.floor(i / PER_ROW) * 52,
  ];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ข้ออ้างโผล่มาเรื่อย ๆ ขณะที่ตัวตรวจเดินตามทีละข้ออย่างช้า ๆ',
  });
  const { filter } = inkDefs(svg, 'gg');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'gg-t' }, scene);
  headline.textContent = 'ข้ออ้างมาถึงทุกครึ่งวินาที การตรวจหนึ่งข้อใช้เวลาหลายวินาที';

  // the clock, so the asymmetry is in a unit the reader already trusts
  const clockR = 20, CX = 606, CY = 56;
  pen(scene, 1.3).setAttribute('d',
    `M${CX - clockR} ${CY} a${clockR} ${clockR} 0 1 1 ${clockR * 2} 0 a${clockR} ${clockR} 0 1 1 ${-clockR * 2} 0Z`);
  const hand = pen(scene, 1.8);

  const marks = Array.from({ length: N }, (_, i) => {
    const [x, y] = slot(i);
    const c = el('circle', { cx: x, cy: y, r: 9, fill: 'none', stroke: 'currentColor', opacity: 0 }, scene);
    return c;
  });

  // the scanner: a bracket that sits over the claim it is working through
  const scan = el('g', { opacity: 0 }, scene);
  pen(scan, 2).setAttribute('d', 'M-17 -12 L-17 12 M17 -12 L17 12');
  const ring = el('circle', {
    cx: 0, cy: 0, r: 16, fill: 'none', stroke: OK, 'stroke-width': 2.8,
    'stroke-dasharray': `${2 * Math.PI * 16}`, 'stroke-dashoffset': `${2 * Math.PI * 16}`,
    transform: 'rotate(-90)',
  }, scan);

  const tally = el('text', { x: 36, y: 248, 'font-size': 13.5, fill: 'currentColor', class: 'gg-t' }, scene);
  const gap = el('text', { x: 36, y: 274, 'font-size': 12, fill: RED, class: 'gg-t' }, scene);

  const sx = spring(30, 8), sy = spring(30, 8);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const landed = Math.min(N, Math.floor(k / DROP) + 1);
    const checked = Math.min(landed, Math.floor(k / CHECK));

    marks.forEach((m, i) => {
      const since = k - i * DROP;
      if (since < 0) { m.setAttribute('opacity', '0'); return; }
      m.setAttribute('opacity', f(Math.min(1, since / 0.16)));
      const done = i < checked;
      m.setAttribute('fill', done ? 'var(--hl-bg)' : 'none');
      m.setAttribute('stroke', done ? 'var(--hl)' : 'currentColor');
      m.setAttribute('stroke-width', done ? '1.8' : '1.3');
      m.setAttribute('opacity', f(done ? 1 : Math.min(0.55, since / 0.16 * 0.55)));
    });

    // the scanner works on the first unchecked claim that has actually landed
    const at = Math.min(checked, N - 1);
    if (landed > at) {
      const [x, y] = slot(at);
      scan.setAttribute('opacity', '1');
      scan.setAttribute('transform', `translate(${f(sx.step(x, dt))} ${f(sy.step(y, dt))})`);
      const prog = ease(Math.min(1, (k - checked * CHECK) / CHECK));
      ring.setAttribute('stroke-dashoffset', f(2 * Math.PI * 16 * (1 - prog)));
    } else {
      scan.setAttribute('opacity', '0');
    }

    const a = (k / 6) * Math.PI * 2;
    hand.setAttribute('d', `M${CX} ${CY} L${f(CX + Math.sin(a) * 14)} ${f(CY - Math.cos(a) * 14)}`);

    tally.textContent = `ผ่านไป ${k.toFixed(1)} วินาที · ยกมาแล้ว ${landed} ข้อ · ตรวจเสร็จ ${checked} ข้อ`;
    gap.textContent = landed - checked > 0
      ? `ค้างอยู่ ${landed - checked} ข้อ ที่ยังไม่มีใครดู ซึ่งไม่เท่ากับผ่านการตรวจ`
      : 'ตรวจทันทุกข้อ';
  });
}
