// Cherry picking: forty results on the tree, a hand that only ever reaches
// for the ones pointing the right way, and a slide that fills up with them.
// The ones left on the tree are drawn the whole time.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { minJerk, seeded } from './lib/motion.ts';

const stage = document.querySelector('#cherry-stage');
if (stage) {
  const W = 680, H = 330;
  const RED = '#b3412d', OK = '#2f6d4f';
  const COLS = 10, ROWS = 4, N = COLS * ROWS;
  const GX = 62, GY = 108, STEP = 32;
  const SLIDE = { x: 410, y: 214, w: 236, h: 84 };
  const PICK_EVERY = 0.72, TAKE = 0.5;

  const rnd = seeded(31);
  // a third of the results happen to point the way the author wants
  const good = Array.from({ length: N }, () => rnd(0, 1) < 0.33);
  const picks: number[] = [];
  good.forEach((g, i) => { if (g) picks.push(i); });
  const CYCLE = picks.length * PICK_EVERY + 3.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ผลทั้งหมดอยู่บนตาราง มีแต่ผลที่เข้าทางเท่านั้นที่ถูกหยิบไปใส่สไลด์',
  });
  const { filter } = inkDefs(svg, 'ch');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'ch-t' }, scene);
  const gridT = el('text', { x: GX, y: 86, 'font-size': 11.5, fill: 'currentColor', opacity: 0.62, class: 'ch-t' }, scene);
  gridT.textContent = `ผลทั้งหมดที่เก็บมา ${N} ชิ้น`;

  const at = (i: number): [number, number] => [GX + (i % COLS) * STEP, GY + Math.floor(i / COLS) * STEP];
  const dots = good.map((g, i) => {
    const [x, y] = at(i);
    return el('circle', {
      cx: x, cy: y, r: 7,
      fill: g ? 'var(--hl-bg)' : 'none',
      stroke: g ? 'var(--hl)' : 'currentColor',
      'stroke-width': 1.3, opacity: g ? 1 : 0.45,
    }, scene);
  });

  // the slide the picked ones end up on
  shape(scene, 1.3).setAttribute(
    'd', `M${SLIDE.x} ${SLIDE.y} L${SLIDE.x + SLIDE.w} ${SLIDE.y} L${SLIDE.x + SLIDE.w} ${SLIDE.y + SLIDE.h} L${SLIDE.x} ${SLIDE.y + SLIDE.h}Z`);
  const slideT = el('text', { x: SLIDE.x + 12, y: SLIDE.y - 10, 'font-size': 12, fill: 'currentColor', opacity: 0.7, class: 'ch-t' }, scene);
  slideT.textContent = 'สไลด์ที่เอาไปนำเสนอ';

  const flying = el('circle', { r: 7, fill: 'var(--hl-bg)', stroke: 'var(--hl)', 'stroke-width': 1.5, opacity: 0 }, scene);

  const tally = el('text', { x: 36, y: 282, 'font-size': 13, fill: 'currentColor', class: 'ch-t' }, scene);
  const left = el('text', { x: 36, y: 306, 'font-size': 12, fill: RED, class: 'ch-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const done = Math.min(picks.length, Math.floor(k / PICK_EVERY));
    const cur = done < picks.length ? picks[done] : -1;
    const u = cur >= 0 ? minJerk(Math.min(1, (k - done * PICK_EVERY) / TAKE)) : 1;

    dots.forEach((d, i) => {
      const taken = picks.indexOf(i) >= 0 && picks.indexOf(i) < done;
      const inFlight = i === cur;
      d.setAttribute('opacity', f(taken || (inFlight && u > 0.1) ? 0 : good[i] ? 1 : 0.45));
    });

    if (cur >= 0) {
      const [sx, sy] = at(cur);
      const slot = done;
      const tx = SLIDE.x + 22 + (slot % 7) * 30;
      const ty = SLIDE.y + 26 + Math.floor(slot / 7) * 30;
      flying.setAttribute('cx', f(sx + (tx - sx) * u));
      flying.setAttribute('cy', f(sy + (ty - sy) * u));
      flying.setAttribute('opacity', f(u > 0.1 ? 1 : 0));
    } else {
      flying.setAttribute('opacity', '0');
    }

    // the ones already delivered sit on the slide
    for (let s = 0; s < done; s++) {
      const id = `ch-s${s}`;
      let c = document.getElementById(id) as unknown as SVGCircleElement | null;
      if (!c) {
        c = el('circle', {
          id, r: 7, fill: 'var(--hl-bg)', stroke: 'var(--hl)', 'stroke-width': 1.3,
        }, scene) as SVGCircleElement;
      }
      c.setAttribute('cx', f(SLIDE.x + 22 + (s % 7) * 30));
      c.setAttribute('cy', f(SLIDE.y + 26 + Math.floor(s / 7) * 30));
      c.setAttribute('opacity', '1');
    }
    for (let s = done; s < picks.length; s++) {
      const c = document.getElementById(`ch-s${s}`);
      if (c) c.setAttribute('opacity', '0');
    }

    const finished = done >= picks.length;
    headline.textContent = finished
      ? `สไลด์มี ${picks.length} ชิ้น จากผลทั้งหมด ${N} ชิ้น`
      : 'หยิบเฉพาะชิ้นที่เข้าทางไปใส่สไลด์';
    tally.textContent = `เล่าไปแล้ว ${done} ชิ้น · ยังอยู่บนตาราง ${N - done} ชิ้น`;
    left.textContent = finished
      ? `${N - picks.length} ชิ้นที่เหลือเป็นชิ้นที่ขัดกับข้อสรุป และไม่ได้ถูกเอ่ยถึงเลย · คลิกเพื่อดูใหม่`
      : 'วงจาง ๆ คือผลที่ไม่เข้าทาง ซึ่งไม่ถูกหยิบ';
  });
}
