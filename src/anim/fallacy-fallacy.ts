// The fallacy fallacy: catching a bad argument moves the needle exactly one
// notch, from "true" to "we do not know". Push it the rest of the way to
// "false" and it springs back, because nothing has been shown about the
// conclusion itself — only about one argument for it.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring } from './lib/motion.ts';

const stage = document.querySelector('#fallacyfallacy-stage');
if (stage) {
  const W = 680, H = 284;
  const DC: [number, number] = [470, 226], R = 112;
  const A_TRUE = -168, A_UNK = -90, A_FALSE = -12;      // degrees
  const RED = '#b3412d', OK = '#2f6d4f';
  const rad = (d: number) => (d * Math.PI) / 180;
  const on = (d: number, r: number): [number, number] => [DC[0] + r * Math.cos(rad(d)), DC[1] + r * Math.sin(rad(d))];

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น เข็มชี้สามช่อง จริง ยังไม่รู้ เท็จ การจับตรรกวิบัติเลื่อนเข็มได้แค่ช่องกลาง',
  });
  const { filter } = inkDefs(svg, 'ff');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  // the argument being criticised
  shape(scene, 1.15).setAttribute('d', 'M36 86 L292 86 L292 182 L36 182Z');
  const aTag = el('text', { x: 52, y: 110, 'font-size': 11, fill: 'currentColor', opacity: 0.66, class: 'ff-t' }, scene);
  aTag.textContent = 'เหตุผลที่ยกมาสนับสนุนข้อสรุป';
  const aBody = el('text', { x: 52, y: 136, 'font-size': 13, fill: 'currentColor', class: 'ff-t' }, scene);
  aBody.textContent = 'แม่ผมบอกว่าสูบบุหรี่อันตราย';
  const aMark = el('text', { x: 52, y: 164, 'font-size': 12.5, fill: RED, class: 'ff-t' }, scene);
  aMark.textContent = '✕ อ้างผู้มีอำนาจ · เหตุผลนี้อ่อนจริง';

  // the dial
  const arc = pen(scene, 1.2);
  arc.setAttribute('d', `M${f(on(A_TRUE, R)[0])} ${f(on(A_TRUE, R)[1])} A${R} ${R} 0 0 1 ${f(on(A_FALSE, R)[0])} ${f(on(A_FALSE, R)[1])}`);
  ([[A_TRUE, 'จริง'], [A_UNK, 'ยังไม่รู้'], [A_FALSE, 'เท็จ']] as const).forEach(([a, label]) => {
    const p1 = on(a, R - 10), p2 = on(a, R);
    pen(scene, 1.0).setAttribute('d', `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])}`);
    const lp = on(a, R + 20);
    const t = el('text', {
      x: f(lp[0]), y: f(lp[1]), 'text-anchor': a === A_UNK ? 'middle' : a === A_TRUE ? 'start' : 'end',
      'font-size': 12.5, fill: a === A_UNK ? OK : 'currentColor', opacity: a === A_UNK ? 1 : 0.7, class: 'ff-t',
    }, scene);
    t.textContent = label;
  });
  const needle = pen(scene, 2.4);
  el('circle', { cx: DC[0], cy: DC[1], r: 5, fill: 'currentColor' }, scene);

  const headline = el('text', { x: 36, y: 44, 'font-size': 14.5, fill: 'currentColor', class: 'ff-t' }, scene);
  const note = el('text', { x: 36, y: 212, 'font-size': 11.5, fill: 'currentColor', opacity: 0.72, class: 'ff-t' }, scene);
  const push = el('text', { x: 36, y: 232, 'font-size': 11.5, fill: RED, opacity: 0, class: 'ff-t' }, scene);
  push.textContent = 'ดันต่อไม่ได้ ข้อสรุปยังไม่ถูกแสดงว่าเป็นเท็จ';

  const sp = spring(26, 7);
  let angle = A_TRUE, target = A_TRUE, k = 0, shoved = -1;

  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { if (target === A_UNK) shoved = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > 2.2 && target === A_TRUE) target = A_UNK;     // the fallacy is spotted
    if (k > 11) { k = 0; target = A_TRUE; shoved = -1; }

    // a shove toward "false" is allowed to start and then refused
    let aim = target;
    if (shoved >= 0) {
      shoved += dt;
      aim = shoved < 0.3 ? A_UNK + 26 : A_UNK;
      if (shoved > 1.9) shoved = -1;
    }
    angle = sp.step(aim, dt);
    const tip = on(angle, R - 18);
    needle.setAttribute('d', `M${DC[0]} ${DC[1]} L${f(tip[0])} ${f(tip[1])}`);

    headline.textContent = target === A_TRUE ? 'ตอนแรกเขาเสนอว่าข้อสรุปนี้จริง' : 'จับตรรกวิบัติได้แล้ว เข็มเลื่อนได้หนึ่งช่อง';
    note.textContent = target === A_TRUE
      ? 'เข็มอยู่ที่ จริง เพราะเชื่อตามเหตุผลที่เขาให้มา'
      : 'สิ่งที่ได้คือ ยังไม่รู้ ไม่ใช่ เท็จ · ลองคลิกเพื่อดันเข็มไปต่อ';
    push.setAttribute('opacity', f(shoved >= 0 ? 1 : 0));
  });
}
