// Amphiboly: one set of words, two sentence structures. The modifier at the
// end of the sentence is tied back to whichever noun it modifies, and the tie
// swings between the two candidates. The other tie is always drawn, faintly:
// the whole point is that both readings stay available.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#amphiboly-stage');
if (stage) {
  const W = 680, H = 300;
  const BASE = 152;                 // baseline of the sentence
  const HL = '#a9741a', MUTED = 0.6;

  const TOK: { t: string; head?: 0 | 1; mod?: true }[] = [
    { t: 'จะตรวจสอบ' },
    { t: 'บริษัท', head: 0 },
    { t: 'ที่รับงานจาก' },
    { t: 'หน่วยงานรัฐ', head: 1 },
    { t: 'ทุกแห่ง', mod: true },
  ];

  const READ = [
    {
      title: 'นับคำว่า ทุกแห่ง ที่คำว่า บริษัท',
      body: 'บริษัทที่รับงานจากรัฐ ถูกตรวจทุกแห่ง แม้หน่วยงานที่ให้งานจะมีไม่กี่แห่ง',
    },
    {
      title: 'นับคำว่า ทุกแห่ง ที่คำว่า หน่วยงานรัฐ',
      body: 'ไล่ดูสัญญาจากหน่วยงานรัฐครบทุกแห่ง แต่ไม่ได้แปลว่าบริษัททุกแห่งจะถูกตรวจ',
    },
  ];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ประโยคเดียวที่คำขยายท้ายประโยคผูกกลับไปได้สองคำ',
  });
  const { filter } = inkDefs(svg, 'am');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'am-t' }, scene);
  headline.textContent = 'ถ้อยคำชุดเดียวกัน วางคำขยายไว้ท้ายประโยค';

  // the two ties, drawn before the words so the words sit on top
  const ghost = pen(scene, 1.2);
  ghost.setAttribute('stroke-dasharray', '4 4');
  ghost.setAttribute('opacity', '0.3');
  const tie = pen(scene, 1.9);
  tie.setAttribute('stroke', HL);
  const head = pen(scene, 1.9);
  head.setAttribute('stroke', HL);
  const rule = pen(scene, 2.2);
  rule.setAttribute('stroke', HL);

  // the words
  const nodes = TOK.map((k) => {
    const t = el('text', {
      y: BASE, 'font-size': 16, fill: 'currentColor', class: 'am-t',
      opacity: k.mod ? 1 : 0.92,
    }, scene);
    t.textContent = k.t;
    return t;
  });

  const box = shape(scene, 1.15);
  box.setAttribute('d', `M60 196 L620 196 L620 272 L60 272Z`);
  const title = el('text', { x: 84, y: 224, 'font-size': 12.5, fill: HL, class: 'am-t' }, scene);
  const bodyT = el('text', { x: 84, y: 252, 'font-size': 13.5, fill: 'currentColor', class: 'am-t' }, scene);

  // --- layout ----------------------------------------------------------
  const GAP = 12;
  let headX: [number, number] = [0, 0];
  let headW: [number, number] = [0, 0];
  let modX = 0;

  function layout() {
    const w = nodes.map((n) => n.getBBox().width);
    const total = w.reduce((a, b) => a + b, 0) + GAP * (w.length - 1);
    let x = (W - total) / 2;
    nodes.forEach((n, i) => {
      n.setAttribute('x', f(x));
      const k = TOK[i];
      if (k.head !== undefined) { headX[k.head] = x + w[i] / 2; headW[k.head] = w[i]; }
      if (k.mod) modX = x + w[i] / 2;
      x += w[i] + GAP;
    });
  }
  layout();
  document.fonts?.ready.then(layout);

  const arc = (from: number, to: number) =>
    `M${f(from)} ${BASE - 22} C${f(from)} ${BASE - 86} ${f(to)} ${BASE - 86} ${f(to)} ${BASE - 24}`;

  const sx = spring(28, 7.5);
  const sw = spring(28, 7.5);
  let which = 0, k = 0;

  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { which = 1 - which; k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > 4.6) { which = 1 - which; k = 0; }

    const x = sx.step(headX[which], dt);
    const w = sw.step(headW[which], dt);

    tie.setAttribute('d', arc(modX, x));
    ghost.setAttribute('d', arc(modX, headX[1 - which]));
    head.setAttribute('d', `M${f(x - 4.5)} ${BASE - 31} L${f(x)} ${BASE - 23} L${f(x + 4.5)} ${BASE - 31}`);
    rule.setAttribute('d', `M${f(x - w / 2)} ${BASE + 9} L${f(x + w / 2)} ${BASE + 9}`);

    title.textContent = READ[which].title;
    bodyT.textContent = READ[which].body;
  });

  // the sentence never changes; only what it is taken to mean does
  const foot = el('text', { x: 36, y: BASE + 30, 'font-size': 11.5, fill: 'currentColor', opacity: MUTED, class: 'am-t' }, scene);
  foot.textContent = 'เส้นประคือการอ่านอีกแบบ ซึ่งยังอ่านได้อยู่ตลอด · คลิกเพื่อสลับ';
}
