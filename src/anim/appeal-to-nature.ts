// Appeal to nature: everything that falls down this chute is natural, and the
// chute sorts into two bins by what it does to you. Both bins fill.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { minJerk } from './lib/motion.ts';

const stage = document.querySelector('#nature-stage');
if (stage) {
  const W = 680, H = 320;
  const RED = '#b3412d', OK = '#2f6d4f';
  const ITEMS = [
    { t: 'ขิง', safe: true }, { t: 'เห็ดระโงกหิน', safe: false },
    { t: 'ใบบัวบก', safe: true }, { t: 'พิษงูเห่า', safe: false },
    { t: 'ขมิ้น', safe: true }, { t: 'สารหนู', safe: false },
  ];
  const CHUTE_Y = 108, BIN_Y = 198, BIN_H = 86;
  const LBIN = 170, RBIN = 470, BW = 180;
  const EVERY = 1.5, FALL = 0.9;
  const CYCLE = ITEMS.length * EVERY + 2.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ของจากธรรมชาติร่วงลงถังสองใบ ถังปลอดภัยกับถังเป็นพิษเต็มพอกัน',
  });
  const { filter } = inkDefs(svg, 'nt');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'nt-t' }, scene);

  // the chute everything comes out of
  shape(scene, 1.4).setAttribute('d', `M258 62 L422 62 L392 ${CHUTE_Y} L288 ${CHUTE_Y}Z`);
  const chuteT = el('text', { x: 340, y: 88, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'nt-t' }, scene);
  chuteT.textContent = 'มาจากธรรมชาติ';

  const bin = (x: number, label: string, colour: string) => {
    pen(scene, 1.6).setAttribute(
      'd', `M${x - BW / 2} ${BIN_Y} L${x - BW / 2} ${BIN_Y + BIN_H} L${x + BW / 2} ${BIN_Y + BIN_H} L${x + BW / 2} ${BIN_Y}`);
    const t = el('text', { x, y: BIN_Y - 12, 'text-anchor': 'middle', 'font-size': 13, fill: colour, class: 'nt-t' }, scene);
    t.textContent = label;
    const n = el('text', { x, y: BIN_Y + BIN_H + 22, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', opacity: 0.7, class: 'nt-t' }, scene);
    return n;
  };
  const lCount = bin(LBIN, 'ปลอดภัย', OK);
  const rCount = bin(RBIN, 'เป็นพิษ', RED);

  const chips = ITEMS.map((it) => {
    const g = el('g', { opacity: 0 }, scene);
    const r = shape(g, 1.2);
    r.setAttribute('d', 'M-62 -13 L62 -13 L62 13 L-62 13Z');
    r.setAttribute('stroke', it.safe ? OK : RED);
    const t = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'nt-t' }, g);
    t.textContent = it.t;
    return g;
  });

  const note = el('text', { x: 36, y: 304, 'font-size': 12.5, fill: 'currentColor', class: 'nt-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    let nSafe = 0, nBad = 0;
    chips.forEach((g, i) => {
      const since = k - i * EVERY;
      if (since < 0) { g.setAttribute('opacity', '0'); return; }
      const it = ITEMS[i];
      const u = minJerk(Math.min(1, since / FALL));
      const slot = it.safe ? nSafe : nBad;
      const x = 340 + ((it.safe ? LBIN : RBIN) - 340) * u;
      const y = CHUTE_Y + 6 + (BIN_Y + BIN_H - 16 - slot * 28 - (CHUTE_Y + 6)) * u;
      g.setAttribute('transform', `translate(${f(x)} ${f(y)})`);
      g.setAttribute('opacity', f(Math.min(1, since / 0.2)));
      if (u >= 1) { if (it.safe) nSafe++; else nBad++; }
    });

    lCount.textContent = `${nSafe} อย่าง`;
    rCount.textContent = `${nBad} อย่าง`;

    const done = k > ITEMS.length * EVERY;
    headline.textContent = done
      ? 'ทุกอย่างในภาพนี้มาจากธรรมชาติทั้งหมด'
      : 'ของทุกชิ้นลงมาจากช่องเดียวกัน';
    note.textContent = done
      ? 'คำว่าธรรมชาติบอกว่าของมาจากไหน ไม่ได้บอกว่ามันทำอะไรกับร่างกาย · คลิกเพื่อดูใหม่'
      : 'ถังที่มันจะตกลงไป ไม่ได้ถูกกำหนดโดยช่องที่มันออกมา';
  });
}
