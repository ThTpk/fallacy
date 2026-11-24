// Moving the goalposts, drawn as goalposts. The ball is kicked at the line
// that was set, it gets there, and only then does the line move. Three rounds,
// three clean shots, nothing ever counted.
import { el, pen, shape, inkDefs, run, f } from './lib/ink.ts';
import { spring, minJerk } from './lib/motion.ts';

const stage = document.querySelector('#goalposts-stage');
if (stage) {
  const W = 680, H = 290;
  const RED = '#b3412d', OK = '#2f6d4f';
  const GROUND = 214, KICK = 84;
  const MARKS = [262, 386, 510];      // where the line is set, round by round
  const FINAL = 614;                  // and where it goes after the last shot
  const ROUND = 4.0, FLY = 1.1, PAUSE = 0.9;
  const CYCLE = MARKS.length * ROUND + 2.0;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'ภาพวาดเส้น ลูกบอลถึงเส้นประตูทุกครั้ง แต่ประตูถูกเลื่อนออกไปทุกครั้งเช่นกัน',
  });
  const { filter } = inkDefs(svg, 'gp');
  svg.style.color = '';
  stage.appendChild(svg);
  const scene = el('g', { filter }, svg);

  const headline = el('text', { x: 36, y: 42, 'font-size': 14.5, fill: 'currentColor', class: 'gp-t' }, scene);

  pen(scene, 1.3).setAttribute('d', `M30 ${GROUND} L650 ${GROUND}`);

  // where previous balls came to rest, left on the pitch as a record
  const rests = MARKS.map(() => el('circle', { r: 7, fill: 'none', stroke: 'currentColor', opacity: 0 }, scene));

  const goal = el('g', {}, scene);
  const posts = pen(goal, 2.2);
  posts.setAttribute('d', `M0 ${GROUND} L0 ${GROUND - 70} L30 ${GROUND - 70} L30 ${GROUND}`);
  const net = pen(goal, 0.8);
  net.setAttribute('opacity', '0.45');
  net.setAttribute('d',
    [0, 10, 20, 30].map((x) => `M${x} ${GROUND - 70} L${x} ${GROUND}`).join(' ') +
    ' ' + [-70, -46, -23, 0].map((y) => `M0 ${GROUND + y} L30 ${GROUND + y}`).join(' '));

  const ball = el('circle', { r: 8, fill: 'var(--surface)', stroke: 'currentColor', 'stroke-width': 1.6, class: 'pp' }, scene);
  const kicker = pen(scene, 2);
  kicker.setAttribute('d', `M${KICK - 10} ${GROUND} L${KICK - 10} ${GROUND - 34}`);

  const tally = el('text', { x: 36, y: 254, 'font-size': 13.5, fill: 'currentColor', class: 'gp-t' }, scene);
  const never = el('text', { x: 36, y: 278, 'font-size': 12, fill: RED, class: 'gp-t' }, scene);

  const gx = spring(24, 6.5, MARKS[0]);
  let k = 0;
  svg.style.cursor = 'pointer';
  svg.addEventListener('pointerdown', () => { k = 0; });

  run((_t, dt) => {
    k += dt;
    if (k > CYCLE) k = 0;

    const round = Math.min(MARKS.length - 1, Math.floor(k / ROUND));
    const inRound = k - round * ROUND;
    const done = k >= MARKS.length * ROUND;

    // the line only moves once the ball has already reached the old one
    const moved = inRound > FLY + PAUSE;
    const aim = MARKS[round];
    const next = round + 1 < MARKS.length ? MARKS[round + 1] : FINAL;
    // the line moves after every shot, the last one included, or the ball
    // would be left sitting in the goal while the text says nothing counted
    const lineAt = gx.step(done ? FINAL : moved ? next : aim, dt);
    goal.setAttribute('transform', `translate(${f(lineAt - 15)} 0)`);

    // the ball flies to where the line was when it was kicked
    const u = minJerk(Math.min(1, inRound / FLY));
    const bx = KICK + (aim - KICK) * u;
    const by = GROUND - 8 - Math.sin(Math.PI * u) * 72;
    ball.setAttribute('cx', f(bx));
    ball.setAttribute('cy', f(by));
    ball.setAttribute('opacity', f(done ? 0 : 1));

    rests.forEach((r, i) => {
      const landed = done || i < round;
      r.setAttribute('opacity', f(landed ? 0.45 : 0));
      r.setAttribute('cx', f(MARKS[i]));
      r.setAttribute('cy', f(GROUND - 8));
    });

    if (done) {
      headline.textContent = 'ยิงเข้าเส้นที่ตั้งไว้ครบทั้งสามรอบ';
      tally.textContent = 'ถึงเส้นทุกครั้ง · นับให้ผ่าน 0 ครั้ง';
      never.textContent = 'ไม่มีรอบไหนที่บอกไว้ล่วงหน้าว่าเส้นจะหยุดอยู่ตรงไหน · คลิกเพื่อดูอีกรอบ';
    } else if (inRound < FLY) {
      headline.textContent = `รอบที่ ${round + 1} ยิงไปที่เส้นที่ตั้งไว้`;
      tally.textContent = `ถึงเส้นแล้ว ${round} ครั้ง · นับให้ผ่าน 0 ครั้ง`;
      never.textContent = '';
    } else if (!moved) {
      headline.textContent = `รอบที่ ${round + 1} ลูกถึงเส้นพอดี`;
      tally.textContent = `ถึงเส้นแล้ว ${round + 1} ครั้ง · นับให้ผ่าน 0 ครั้ง`;
      never.textContent = '';
    } else {
      headline.textContent = 'เส้นถูกเลื่อนออกไปอีก โดยไม่รับว่าของเดิมผ่าน';
      tally.textContent = `ถึงเส้นแล้ว ${round + 1} ครั้ง · นับให้ผ่าน 0 ครั้ง`;
      never.textContent = 'ลูกเดิมยังอยู่ที่เดิม สิ่งที่ขยับคือเส้น';
    }
  });
}
