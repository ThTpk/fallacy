// Denying the antecedent, as a parallel circuit. P closes one branch, so P is
// enough to light the lamp. Opening P alone leaves the other branch closed and
// the lamp still on — which is exactly what the fallacy forgets.
import { el, pen, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#antecedent-stage');
if (stage) {
  const W = 680, H = 312;
  const RED = '#b3412d', OK = '#2f6d4f';
  const LEFT = 76, RIGHT = 548;
  const TOP = 112, BOT = 236;
  const SW_X = 232, SW_W = 68;
  const LY = (TOP + BOT) / 2, LR = 22;        // the lamp, sitting in the wire
  const CYCLE = 9.6;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น วงจรที่มีสวิตช์สองตัวขนานกัน ตัดตัวเดียวหลอดก็ยังติด',
  });
  const { filter } = inkDefs(svg, 'dta');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'dta-t' }, scene);

  // left spine, the two rails, and the right side with the lamp in line
  pen(scene, 1.5).setAttribute('d', `M${LEFT} ${TOP} L${LEFT} ${BOT}`);
  pen(scene, 1.5).setAttribute('d', `M${LEFT} ${TOP} L${SW_X} ${TOP}`);
  pen(scene, 1.5).setAttribute('d', `M${SW_X + SW_W} ${TOP} L${RIGHT} ${TOP} L${RIGHT} ${LY - LR}`);
  pen(scene, 1.5).setAttribute('d', `M${LEFT} ${BOT} L${SW_X} ${BOT}`);
  pen(scene, 1.5).setAttribute('d', `M${SW_X + SW_W} ${BOT} L${RIGHT} ${BOT} L${RIGHT} ${LY + LR}`);

  const glow = el('circle', { cx: RIGHT, cy: LY, r: 34, fill: 'var(--lamp)', opacity: 0 }, scene);
  const bulb = pen(scene, 1.8);
  bulb.setAttribute('d', `M${RIGHT - LR} ${LY} a${LR} ${LR} 0 1 1 ${LR * 2} 0 a${LR} ${LR} 0 1 1 ${-LR * 2} 0Z`);
  pen(scene, 1.2).setAttribute('d', `M${RIGHT - 9} ${LY + 7} L${RIGHT} ${LY - 8} L${RIGHT + 9} ${LY + 7}`);
  const lampT = el('text', { x: RIGHT + 42, y: LY + 5, 'font-size': 13, fill: 'currentColor', class: 'dta-t' }, scene);
  lampT.textContent = 'ถนนเปียก';

  const branch = (y: number, label: string, above: boolean) => {
    const blade = pen(scene, 2.6);
    el('circle', { cx: SW_X, cy: y, r: 3.6, fill: 'currentColor' }, scene);
    el('circle', { cx: SW_X + SW_W, cy: y, r: 3.6, fill: 'currentColor' }, scene);
    const t = el('text', {
      x: SW_X + SW_W / 2, y: above ? y - 40 : y + 30, 'text-anchor': 'middle',
      'font-size': 13.5, fill: 'currentColor', class: 'dta-t',
    }, scene);
    t.textContent = label;
    const state = el('text', {
      x: SW_X + SW_W + 18, y: y + 5, 'font-size': 12, class: 'dta-t',
    }, scene);
    return { blade, state, y };
  };

  const a = branch(TOP, 'ฝนตก', true);
  const b = branch(BOT, 'รถน้ำผ่าน', false);

  const note = el('text', { x: 36, y: 294, 'font-size': 12.5, fill: 'currentColor', class: 'dta-t' }, scene);

  const openA = spring(30, 8, 0), openB = spring(30, 8, 0);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = k < 3.2 ? 3.2 : k < 6.6 ? 6.6 : 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    // 0–3.2 both closed · 3.2–6.6 only P opened · 6.6– both opened
    const oa = openA.step(k > 3.2 ? 1 : 0, dt);
    const ob = openB.step(k > 6.6 ? 1 : 0, dt);

    const blade = (s: { blade: SVGPathElement; state: SVGTextElement; y: number }, o: number, up: boolean) => {
      const ang = (up ? -1 : 1) * o * 0.62;
      const ex = SW_X + Math.cos(ang) * SW_W, ey = s.y + Math.sin(ang) * SW_W;
      s.blade.setAttribute('d', `M${SW_X} ${s.y} L${f(ex)} ${f(ey)}`);
      s.blade.setAttribute('stroke', o > 0.5 ? RED : OK);
      s.state.textContent = o > 0.5 ? 'เปิดวงจร' : 'ต่ออยู่';
      s.state.setAttribute('fill', o > 0.5 ? RED : OK);
    };
    // both blades swing into the empty middle of the loop, where there is
    // nothing to collide with; swinging outwards puts them through the labels
    blade(a, oa, false);
    blade(b, ob, true);

    const lit = Math.max(0, 1 - Math.min(oa, ob) * 1.2);
    glow.setAttribute('opacity', f(lit * 0.4));
    bulb.setAttribute('stroke', lit > 0.5 ? 'var(--hl)' : 'currentColor');

    if (k < 3.2) {
      headline.textContent = 'ทั้งสองทางต่ออยู่ หลอดจึงติด';
      note.textContent = 'ข้ออ้างบอกว่าฝนตกพอจะทำให้ถนนเปียก ไม่ได้บอกว่ามีแต่ฝนเท่านั้นที่ทำได้';
    } else if (k < 6.6) {
      headline.textContent = 'ตัดสวิตช์ ฝนตก ออกทางเดียว แต่หลอดยังติดอยู่';
      note.textContent = 'นี่คือจุดที่ตรรกวิบัติพลาด การที่ฝนไม่ตกไม่ได้แปลว่าถนนจะไม่เปียก';
    } else {
      headline.textContent = 'ต้องตัดให้ครบทุกทาง หลอดถึงจะดับ';
      note.textContent = 'ข้อสรุปจะตามมาได้ก็ต่อเมื่อข้ออ้างเป็น เฉพาะเมื่อฝนตกเท่านั้น ซึ่งแข็งกว่าที่พูดไว้มาก';
    }
  });
}
