// Self-selection: a crowd whose opinions sit on a bell, and a ballot box that
// only the people at the two ends bother to walk to. The histogram that comes
// out has two peaks, and the crowd it came from has one.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { ease, seeded, minJerk } from './lib/motion.ts';

const stage = document.querySelector('#selection-stage');
if (stage) {
  const W = 680, H = 330;
  const RED = '#b3412d', OK = '#2f6d4f';
  const N = 40;
  const STRONG = 0.38;                 // past this, people care enough to answer
  const LANE_Y = 150, BOX = { x: 376, y: 112, w: 100, h: 72 };
  const BINS = 7;
  const WALK = 2.6, CYCLE = 9.4;

  const rnd = seeded(23);
  // opinions bunched in the middle, the way most opinions are
  const people = Array.from({ length: N }, () => {
    const v = (rnd(-1, 1) + rnd(-1, 1) + rnd(-1, 1)) / 3;
    return { v, strong: Math.abs(v) > STRONG };
  });

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น คนส่วนใหญ่เฉย ๆ อยู่กับที่ เฉพาะคนที่รู้สึกแรงเดินไปหย่อนแบบสอบถาม',
  });
  const { filter } = inkDefs(svg, 'ss');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'ss-t' }, scene);

  // the opinion line the crowd stands on
  const LX = 48, LW = 300;
  pen(scene, 1.2).setAttribute('d', `M${LX} ${LANE_Y + 44} L${LX + LW} ${LANE_Y + 44}`);
  const endL = el('text', { x: LX, y: LANE_Y + 62, 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'ss-t' }, scene);
  endL.textContent = 'ไม่พอใจมาก';
  const endR = el('text', { x: LX + LW, y: LANE_Y + 62, 'text-anchor': 'end', 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'ss-t' }, scene);
  endR.textContent = 'พอใจมาก';
  const mid = el('text', { x: LX + LW / 2, y: LANE_Y + 62, 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor', opacity: 0.6, class: 'ss-t' }, scene);
  mid.textContent = 'เฉย ๆ';

  const homeX = (v: number) => LX + ((v + 1) / 2) * LW;
  const homeY = (i: number) => LANE_Y + 30 - (i % 5) * 15;
  const inBox = (): [number, number] => [BOX.x + BOX.w / 2, BOX.y + 26];

  const dots = people.map((p, i) =>
    el('circle', {
      cx: f(homeX(p.v)), cy: f(homeY(i)), r: 5,
      fill: p.strong ? 'var(--hl-bg)' : 'none',
      stroke: p.strong ? 'var(--hl)' : 'currentColor',
      'stroke-width': 1.3, opacity: 0.85,
    }, scene));

  // the ballot box, and the two-peaked picture that comes out of it
  shape(scene, 1.4).setAttribute('d', `M${BOX.x} ${BOX.y} L${BOX.x + BOX.w} ${BOX.y} L${BOX.x + BOX.w} ${BOX.y + BOX.h} L${BOX.x} ${BOX.y + BOX.h}Z`);
  pen(scene, 1.6).setAttribute('d', `M${BOX.x + 36} ${BOX.y + 10} L${BOX.x + BOX.w - 36} ${BOX.y + 10}`);
  const boxT = el('text', { x: BOX.x + BOX.w / 2, y: BOX.y - 12, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', class: 'ss-t' }, scene);
  boxT.textContent = 'กล่องรับแบบสอบถาม';

  const HX = 502, HW = 150, HB = 206;
  const bars = Array.from({ length: BINS }, (_, i) =>
    shape(scene, 1.1));
  bars.forEach((b) => b.setAttribute('opacity', '0'));
  const histT = el('text', { x: HX + HW / 2, y: 92, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'ss-t' }, scene);
  histT.textContent = 'ผลที่ได้จากคนที่ตอบ';

  const tally = el('text', { x: 36, y: 292, 'font-size': 13, fill: 'currentColor', class: 'ss-t' }, scene);
  const sub = el('text', { x: 36, y: 314, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'ss-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const u = ease(Math.min(1, Math.max(0, (k - 1.2) / WALK)));

    people.forEach((p, i) => {
      if (!p.strong) return;
      // they leave at staggered times, so it reads as people deciding one by one
      const off = ((i * 37) % 100) / 100;
      const uu = minJerk(Math.min(1, Math.max(0, (u - off * 0.5) / 0.5)));
      const hx = homeX(p.v), hy = homeY(i);
      const [tx, ty] = inBox();
      dots[i].setAttribute('cx', f(hx + (tx - hx) * uu));
      dots[i].setAttribute('cy', f(hy + (ty - hy) * uu));
      dots[i].setAttribute('opacity', f(0.85 * (1 - uu * 0.9)));
    });

    // the histogram counts only the ballots that arrived
    const arrived = people.filter((p, i) => p.strong && u > ((i * 37) % 100) / 100 * 0.5 + 0.5);
    const counts = Array.from({ length: BINS }, () => 0);
    arrived.forEach((p) => {
      const b = Math.min(BINS - 1, Math.floor(((p.v + 1) / 2) * BINS));
      counts[b]++;
    });
    const peak = Math.max(1, ...counts);
    bars.forEach((b, i) => {
      const h = (counts[i] / peak) * 88;
      const x = HX + (HW / BINS) * i + 2;
      const w = HW / BINS - 4;
      b.setAttribute('d', `M${f(x)} ${f(HB - h)} L${f(x + w)} ${f(HB - h)} L${f(x + w)} ${HB} L${f(x)} ${HB}Z`);
      b.setAttribute('opacity', f(counts[i] ? 1 : 0.12));
    });

    const answered = arrived.length;
    const strong = people.filter((p) => p.strong).length;
    headline.textContent = u < 0.1
      ? `คนทั้งหมด ${N} คน ส่วนใหญ่รู้สึกเฉย ๆ`
      : u < 1 ? 'เฉพาะคนที่รู้สึกแรงเท่านั้นที่เดินไปตอบ'
        : 'ผลที่ได้มีสองยอด ส่วนกลุ่มจริงมียอดเดียว';
    tally.textContent = `ถูกถาม ${N} คน · ตอบ ${answered} คน · อีก ${N - answered} คนไม่ได้อยู่ในข้อมูลเลย`;
    sub.textContent = u >= 1
      ? `ทั้ง ${strong} คนที่ตอบคือคนที่รู้สึกแรง รูปสองยอดจึงมาจากวิธีเก็บ ไม่ได้มาจากกลุ่ม · คลิกเพื่อดูใหม่`
      : 'คลิกเพื่อเริ่มใหม่';
  });
}
