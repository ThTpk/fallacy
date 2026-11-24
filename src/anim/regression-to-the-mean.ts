// Regression to the mean, with the control group the entry asks for. Two
// tracks get the same bad week. One is treated, one is left alone, and both
// come back up by about the same amount.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';

const stage = document.querySelector('#regression-stage');
if (stage) {
  const W = 680, H = 330;
  const RED = '#b3412d', OK = '#2f6d4f';
  // the same slump in both groups, then the same recovery in both
  const TREATED = [62, 55, 68, 59, 31, 57, 64, 58, 66, 60];
  const LEFT_ALONE = [59, 66, 57, 63, 33, 61, 56, 65, 59, 63];
  const DIP = 4;                       // the week everyone is at their worst
  const X0 = 96, X1 = 566, YT = 104, YB = 214;
  const PER = 0.72;                    // seconds per week
  const CYCLE = TREATED.length * PER + 3.4;

  const all = [...TREATED, ...LEFT_ALONE];
  const lo = Math.min(...all), hi = Math.max(...all);
  const px = (i: number) => X0 + ((X1 - X0) * i) / (TREATED.length - 1);
  const py = (v: number) => YB - ((v - lo) / (hi - lo)) * (YB - YT);
  const mean = all.reduce((a, b) => a + b, 0) / all.length;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น สองกลุ่มที่ตกลงพร้อมกัน กลุ่มหนึ่งได้รับการรักษา อีกกลุ่มไม่ได้ทำอะไร แล้วขึ้นมาพอกัน',
  });
  const { filter } = inkDefs(svg, 'rg');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'rg-t' }, scene);

  const meanY = py(mean);
  pen(scene, 1.1).setAttribute('d', `M${X0 - 14} ${f(meanY)} L${X1 + 14} ${f(meanY)}`);
  const meanT = el('text', { x: X1 + 18, y: f(meanY + 4), 'font-size': 11.5, fill: 'currentColor', opacity: 0.6, class: 'rg-t' }, scene);
  meanT.textContent = 'ค่าปกติ';

  // a fixed legend, because two labels that follow their own last point end
  // up on top of each other exactly when both lines converge
  const track = (series: number[], colour: string, label: string, dash: string, row: number) => {
    const line = pen(scene, 2);
    line.setAttribute('stroke', colour);
    if (dash) line.setAttribute('stroke-dasharray', dash);
    const dots = series.map((v, i) =>
      el('circle', {
        cx: f(px(i)), cy: f(py(v)), r: 3.6, fill: 'var(--surface)',
        stroke: colour, 'stroke-width': 1.4, opacity: 0, class: 'pp',
      }, scene));
    const ly = 68 + row * 18;
    const swatch = pen(scene, 2);
    swatch.setAttribute('stroke', colour);
    if (dash) swatch.setAttribute('stroke-dasharray', dash);
    swatch.setAttribute('d', `M360 ${ly - 4} L392 ${ly - 4}`);
    const tag = el('text', { x: 400, y: ly, 'font-size': 11.5, fill: colour, class: 'rg-t' }, scene);
    tag.textContent = label;
    return { line, dots, series, colour };
  };

  const a = track(TREATED, 'var(--hl)', 'กลุ่มที่ได้รับการรักษา', '', 0);
  const b = track(LEFT_ALONE, OK, 'กลุ่มที่ไม่ได้ทำอะไรเลย', '5 4', 1);

  const mark = pen(scene, 2);
  mark.setAttribute('stroke', RED);
  mark.setAttribute('stroke-dasharray', '4 4');
  const markT = el('text', {
    x: f(px(DIP)), y: YB + 34, 'text-anchor': 'middle', 'font-size': 12, fill: RED, opacity: 0, class: 'rg-t',
  }, scene);
  markT.textContent = 'สัปดาห์ที่แย่ที่สุด · ลงมือตรงนี้';

  const verdict = el('text', { x: 36, y: 292, 'font-size': 13, fill: 'currentColor', class: 'rg-t' }, scene);
  const sub = el('text', { x: 36, y: 314, 'font-size': 12, fill: 'currentColor', opacity: 0.72, class: 'rg-t' }, scene);

  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const shown = Math.min(TREATED.length, Math.floor(k / PER) + 1);

    [a, b].forEach((t) => {
      t.line.setAttribute(
        'd',
        t.series.slice(0, shown).map((v, i) => `${i ? 'L' : 'M'}${f(px(i))} ${f(py(v))}`).join(' '),
      );
      t.dots.forEach((d, i) => d.setAttribute('opacity', f(i < shown ? 1 : 0)));
    });

    const marked = shown > DIP;
    mark.setAttribute('opacity', f(marked ? 1 : 0));
    mark.setAttribute('d', `M${f(px(DIP))} ${f(py(Math.min(TREATED[DIP], LEFT_ALONE[DIP])) + 12)} L${f(px(DIP))} ${YB + 18}`);
    markT.setAttribute('opacity', f(marked ? 1 : 0));

    const done = shown >= TREATED.length;
    const upA = TREATED[TREATED.length - 1] - TREATED[DIP];
    const upB = LEFT_ALONE[LEFT_ALONE.length - 1] - LEFT_ALONE[DIP];

    headline.textContent = !marked
      ? 'สองกลุ่มที่เริ่มต้นเหมือนกัน'
      : done ? 'ทั้งสองกลุ่มขึ้นมาพอกัน'
        : 'ลงมือกับกลุ่มเดียว ตอนที่ค่าต่ำที่สุด';
    verdict.textContent = done
      ? `กลุ่มที่รักษาขึ้น ${upA} หน่วย · กลุ่มที่ไม่ได้ทำอะไรขึ้น ${upB} หน่วย`
      : 'กลุ่มเส้นประไม่ได้รับอะไรเลย มีไว้เทียบอย่างเดียว';
    sub.textContent = done
      ? 'ส่วนที่การรักษาอธิบายได้ คือส่วนที่เกินกว่ากลุ่มเทียบเท่านั้น ซึ่งที่นี่แทบไม่มี · คลิกเพื่อดูใหม่'
      : 'คลิกเพื่อเริ่มใหม่';
  });
}
