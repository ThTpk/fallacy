// Sunk cost: the money already spent sits before the fork, so it is on both
// branches in exactly the same amount. Only the two numbers after the fork
// differ, and those are the ones the decision is made of.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, ease } from './lib/motion.ts';

const stage = document.querySelector('#sunk-stage');
if (stage) {
  const W = 680, H = 326;
  const RED = '#b3412d', OK = '#2f6d4f';
  const SPENT = 8;                     // million already gone
  const MORE = 5, GAIN = 3;            // to finish, and what finishing is worth
  const FORK = 290, Y = 150;
  const CYCLE = 9.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เงินที่จ่ายไปแล้วอยู่ก่อนทางแยก จึงเท่ากันทั้งสองทาง',
  });
  const { filter } = inkDefs(svg, 'sk');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'sk-t' }, scene);

  // the road up to the fork, with the spent money on it
  pen(scene, 2).setAttribute('d', `M70 ${Y} L${FORK} ${Y}`);
  const spentBox = shape(scene, 1.3);
  spentBox.setAttribute('d', `M84 ${Y - 24} L246 ${Y - 24} L246 ${Y + 24} L84 ${Y + 24}Z`);
  const spentT = el('text', { x: 165, y: Y - 2, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'currentColor', class: 'sk-t' }, scene);
  spentT.textContent = `จ่ายไปแล้ว ${SPENT} ล้าน`;
  const spentN = el('text', { x: 165, y: Y + 18, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'currentColor', opacity: 0.66, class: 'sk-t' }, scene);
  spentN.textContent = 'อยู่ก่อนทางแยก';

  el('circle', { cx: FORK, cy: Y, r: 6, fill: 'currentColor' }, scene);

  const branch = (dy: number, label: string, cost: string, net: string, colour: string) => {
    const p = pen(scene, 1.8);
    p.setAttribute('d', `M${FORK} ${Y} C${FORK + 50} ${Y} ${FORK + 50} ${Y + dy} ${FORK + 108} ${Y + dy}`);
    const b = shape(scene, 1.3);
    b.setAttribute('d', `M${FORK + 108} ${Y + dy - 28} L${FORK + 300} ${Y + dy - 28} L${FORK + 300} ${Y + dy + 28} L${FORK + 108} ${Y + dy + 28}Z`);
    const t = el('text', { x: FORK + 124, y: Y + dy - 6, 'font-size': 13, fill: 'currentColor', class: 'sk-t' }, scene);
    t.textContent = label;
    const c = el('text', { x: FORK + 124, y: Y + dy + 14, 'font-size': 11.5, fill: 'currentColor', opacity: 0.72, class: 'sk-t' }, scene);
    c.textContent = cost;
    const n = el('text', { x: FORK + 316, y: Y + dy + 5, 'font-size': 12.5, fill: colour, opacity: 0, class: 'sk-t' }, scene);
    n.textContent = net;
    return n;
  };
  const goNet = branch(-72, 'ทำต่อ', `จ่ายอีก ${MORE} ล้าน ได้กลับมา ${GAIN} ล้าน`, `−${MORE - GAIN}`, RED);
  const stopNet = branch(72, 'หยุดตอนนี้', 'ไม่จ่ายอีก ไม่ได้อะไรเพิ่ม', '0', OK);

  // the ghost of the spent money, which the argument tries to put on one branch
  const ghost = el('g', { opacity: 0 }, scene);
  const gb = pen(ghost, 1.3);
  gb.setAttribute('stroke', RED);
  gb.setAttribute('stroke-dasharray', '5 4');
  gb.setAttribute('d', `M-80 -20 L80 -20 L80 20 L-80 20Z`);
  const gt = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 12, fill: RED, class: 'sk-t' }, ghost);
  gt.textContent = `${SPENT} ล้านที่จ่ายไปแล้ว`;

  const note = el('text', { x: 36, y: 288, 'font-size': 13, fill: 'currentColor', class: 'sk-t' }, scene);
  const sub = el('text', { x: 36, y: 310, 'font-size': 12, fill: 'currentColor', opacity: 0.74, class: 'sk-t' }, scene);

  const gy = spring(16, 6, Y);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const shown = k > 2.0;
    goNet.setAttribute('opacity', f(shown ? 1 : 0));
    stopNet.setAttribute('opacity', f(shown ? 1 : 0));

    // the argument slides the sunk pile onto the "carry on" branch
    const slide = k > 4.0 && k < 7.4;
    const back = k >= 7.4;
    // just under the branch box, not on top of its own numbers
    const want = slide ? Y - 72 + 46 : Y;
    const y = gy.step(want, dt);
    ghost.setAttribute('transform', `translate(${FORK + 204} ${f(y)})`);
    ghost.setAttribute('opacity', f(k > 3.6 ? (back ? Math.max(0, 1 - (k - 7.4) / 0.8) : 1) : 0));

    headline.textContent = !shown
      ? 'ทางแยกมีสองทาง และเงินก้อนแรกอยู่ก่อนทางแยก'
      : slide ? 'ข้ออ้างย้ายเงินก้อนเก่ามาวางไว้บนทางเดียว'
        : 'เงินก้อนนั้นอยู่บนทั้งสองทางเท่ากัน จึงหักล้างกันหมด';
    note.textContent = shown
      ? `สิ่งที่ต่างกันจริงคือ −${MORE - GAIN} ล้าน กับ 0 ล้าน ซึ่งไม่มี ${SPENT} ล้านอยู่ในนั้นเลย`
      : 'ดูว่าตัวเลขของสองทางต่างกันตรงไหน';
    sub.textContent = 'คลิกเพื่อดูใหม่';
  });
}
