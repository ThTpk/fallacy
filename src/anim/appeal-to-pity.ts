// Appeal to pity: a scale that weighs one thing. Marking criteria land on the
// pan and move the needle. The hardship is real and heavy, and it falls
// straight through, because it is not the kind of weight this scale takes.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, minJerk } from './lib/motion.ts';

const stage = document.querySelector('#pity-stage');
if (stage) {
  const W = 680, H = 318;
  const RED = '#b3412d', OK = '#2f6d4f';
  const PAN: [number, number] = [238, 176];
  const PANW = 184;
  const CHIPW = 132;        // narrower than the pan, so the pan still shows
  const ITEMS = [
    { t: 'คำตอบถูกต้อง', w: 0.42, fits: true },
    { t: 'อ้างอิงครบ', w: 0.26, fits: true },
    { t: 'ผมลำบากมากครับ', w: 0, fits: false },
  ];
  const EVERY = 2.6, FALL = 0.8;
  const CYCLE = ITEMS.length * EVERY + 2.4;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ของที่เข้าเกณฑ์ลงบนตาชั่งแล้วเข็มขยับ ส่วนความลำบากร่วงทะลุถาดลงไป',
  });
  const { filter } = inkDefs(svg, 'pi');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'pi-t' }, scene);

  // the stand; the pan itself is drawn last, over everything
  pen(scene, 1.6).setAttribute('d', `M${PAN[0]} ${PAN[1] + 14} L${PAN[0]} ${PAN[1] + 92} M${PAN[0] - 48} ${PAN[1] + 92} L${PAN[0] + 48} ${PAN[1] + 92}`);

  // the dial it drives
  const DC: [number, number] = [500, 198], R = 78;
  const rad = (d: number) => (d * Math.PI) / 180;
  const on = (d: number, r: number): [number, number] => [DC[0] + r * Math.cos(rad(d)), DC[1] + r * Math.sin(rad(d))];
  const A0 = -172, A1 = -8;
  pen(scene, 1.3).setAttribute('d',
    `M${f(on(A0, R)[0])} ${f(on(A0, R)[1])} A${R} ${R} 0 0 1 ${f(on(A1, R)[0])} ${f(on(A1, R)[1])}`);
  for (let i = 0; i <= 4; i++) {
    const a = A0 + ((A1 - A0) * i) / 4;
    const p1 = on(a, R - 9), p2 = on(a, R);
    pen(scene, 1).setAttribute('d', `M${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])}`);
  }
  const needle = pen(scene, 2.4);
  el('circle', { cx: DC[0], cy: DC[1], r: 4.5, fill: 'currentColor' }, scene);
  const dialT = el('text', { x: DC[0], y: DC[1] + 34, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', opacity: 0.7, class: 'pi-t' }, scene);
  dialT.textContent = 'คะแนนตามเกณฑ์';

  const chip = el('g', { opacity: 0 }, scene);
  const chipBox = shape(chip, 1.3);
  chipBox.setAttribute('d', `M${-CHIPW / 2} -18 L${CHIPW / 2} -18 L${CHIPW / 2} 18 L${-CHIPW / 2} 18Z`);
  const chipT = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor', class: 'pi-t' }, chip);

  // the ones that landed stay stacked on the pan
  const stack = ITEMS.map(() => {
    const g = el('g', { opacity: 0 }, scene);
    shape(g, 1.2).setAttribute(`d`, `M${-CHIPW / 2} -14 L${CHIPW / 2} -14 L${CHIPW / 2} 14 L${-CHIPW / 2} 14Z`);
    const t = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'currentColor', class: 'pi-t' }, g);
    return { g, t };
  });

  // the pan, on top, so anything falling through it is seen to cross it
  const pan = pen(scene, 2.4);
  pan.setAttribute('d', `M${PAN[0] - PANW / 2} ${PAN[1]} L${PAN[0] + PANW / 2} ${PAN[1]}`);
  pen(scene, 1.3).setAttribute('d', `M${PAN[0] - PANW / 2} ${PAN[1]} L${PAN[0]} ${PAN[1] + 14} L${PAN[0] + PANW / 2} ${PAN[1]}`);

  const note = el('text', { x: 36, y: 288, 'font-size': 12.5, fill: 'currentColor', class: 'pi-t' }, scene);
  const sub = el('text', { x: 36, y: 308, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'pi-t' }, scene);

  const sp = spring(18, 6);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const i = Math.floor(k / EVERY);
    const u = Math.min(1, (k - i * EVERY) / FALL);
    const cur = ITEMS[Math.min(i, ITEMS.length - 1)];

    // how much is actually sitting on the pan
    let load = 0, placed = 0;
    ITEMS.forEach((it, j) => {
      const done = j < i || (j === i && u >= 1);
      if (done && it.fits) { load += it.w; placed++; }
    });

    stack.forEach((s, j) => {
      const done = (j < i || (j === i && u >= 1)) && ITEMS[j].fits;
      if (!done) { s.g.setAttribute('opacity', '0'); return; }
      const idx = ITEMS.slice(0, j).filter((x) => x.fits).length;
      // dim while something is dropping through, so the fall stays readable
      s.g.setAttribute('opacity', f(!cur.fits && u < 1.4 ? 0.4 : 1));
      s.t.textContent = ITEMS[j].t;
      s.g.setAttribute('transform', `translate(${PAN[0]} ${PAN[1] - 16 - idx * 30})`);
    });

    if (i < ITEMS.length) {
      chip.setAttribute('opacity', u < 1 || !cur.fits ? '1' : '0');
      chipT.textContent = cur.t;
      chipBox.setAttribute('stroke', cur.fits ? 'currentColor' : RED);
      if (cur.fits) {
        const y = 24 + (PAN[1] - 16 - placed * 30 - 24) * minJerk(u);
        chip.setAttribute('transform', `translate(${PAN[0]} ${f(y)})`);
      } else {
        // it is not refused at the pan; it goes straight through it
        const fall = Math.min(1, (k - i * EVERY) / 1.5);
        const y = 24 + (330 - 24) * minJerk(fall);
        chip.setAttribute('transform', `translate(${PAN[0]} ${f(y)})`);
        chip.setAttribute('opacity', f(Math.max(0, 1 - Math.max(0, fall - 0.72) / 0.28)));
      }
    } else {
      chip.setAttribute('opacity', '0');
    }

    const a = A0 + (A1 - A0) * sp.step(load, dt);
    const tip = on(a, R - 14);
    needle.setAttribute('d', `M${DC[0]} ${DC[1]} L${f(tip[0])} ${f(tip[1])}`);

    const last = i >= ITEMS.length - 1;
    headline.textContent = !last
      ? 'ของที่เข้าเกณฑ์ลงถาด เข็มขยับตาม'
      : 'ของชิ้นนี้ร่วงทะลุถาดลงไป';
    note.textContent = last
      ? 'เรื่องนี้เป็นความจริงและหนักจริงสำหรับคนพูด แต่ไม่ใช่ของที่ชั่งบนตาชั่งอันนี้'
      : 'ตาชั่งอันนี้ชั่งอย่างเดียว คือคำตอบตรงตามเกณฑ์หรือไม่';
    sub.textContent = last
      ? 'ถ้าเกณฑ์ควรรวมความลำบากด้วย ก็ต้องเปลี่ยนตาชั่ง ไม่ใช่แอบวางของผิดประเภทลงไป · คลิกเพื่อดูใหม่'
      : 'คลิกเพื่อเริ่มใหม่';
  });
}
