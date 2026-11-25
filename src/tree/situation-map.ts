// A situation drawn as one open map: situation -> groups -> entries.
//
// Deliberately not the collapsible tree the home page uses. That tree exists
// because 51 entries do not fit on a screen and the shape has to be readable
// before the leaves arrive. A situation holds four groups of three or four, so
// there is nothing to fold away, and folding would only hide the thing the page
// is for. This renderer therefore draws everything at once and never animates.
//
// Several maps can sit on one page, so each one is found through its own
// wrapper rather than by a fixed id.
import { cluster as clusterLayout, hierarchy, type HierarchyNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { linkHorizontal } from 'd3-shape';

interface SNode {
  name: string;
  /** present on entries that exist in the collection; absent on the ones the
   *  collection has no page for yet, which are drawn as plain text */
  href?: string;
  note?: string;
  count?: number;
  children?: SNode[];
}

type Node = HierarchyNode<SNode> & {
  x: number;
  y: number;
  /** measured width of the label plus its count, set on first draw */
  lw?: number;
};

const ROW = 26;
const PAD = 14;

function draw(wrap: HTMLElement) {
  const host = wrap.querySelector<HTMLElement>('.sitmap-host');
  const raw = wrap.querySelector<HTMLScriptElement>('script[type="application/json"]');
  if (!host || !raw) return;

  const data: SNode = JSON.parse(raw.textContent || '{}');
  // the no-script list has done its job once this runs
  host.querySelector('.fallback')?.remove();

  const depth = (n: SNode): number => 1 + Math.max(0, ...(n.children ?? []).map(depth));
  // three levels want more room per column than two
  const COL = depth(data) >= 3 ? 150 : 210;

  const svg = select(host)
    .append('svg')
    .attr('class', 'sitmap')
    .attr('role', 'img')
    .attr('aria-label', wrap.dataset.sitmap || 'แผนผังตรรกวิบัติในสถานการณ์นี้');
  const gLink = svg.append('g').attr('class', 'links');
  const gNode = svg.append('g').attr('class', 'nodes');

  const root = hierarchy<SNode>(data) as Node;
  clusterLayout<SNode>().nodeSize([ROW, COL])(root);

  const nodes = root.descendants() as Node[];
  const links = root.links() as unknown as Array<{ source: Node; target: Node }>;

  const link = linkHorizontal<unknown, Node>().x((d) => d.y).y((d) => d.x);
  gLink.selectAll('path').data(links).enter().append('path').attr('d', (d) => link(d)!);

  const node = gNode
    .selectAll<SVGGElement, Node>('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', (d) => (d.children ? 'n' : 'n leaf'))
    .attr('transform', (d) => `translate(${d.y} ${d.x})`);

  node.each(function (d) {
    const s = select(this);
    s.append('circle').attr('r', d.children ? 4.5 : 3.5);

    if (d.data.href) {
      const a = s.append('a').attr('href', d.data.href);
      a.append('text').attr('class', 'lbl').attr('x', 10).attr('dy', '0.32em').text(d.data.name);
    } else {
      s.append('text')
        .attr('class', d.children ? 'lbl branch' : 'lbl plain')
        .attr('x', 10)
        .attr('dy', '0.32em')
        .text(d.data.name);
      if (d.data.count) {
        s.append('text').attr('class', 'cnt').attr('dy', '0.32em').text(String(d.data.count));
      }
    }
    if (d.data.note) s.append('title').text(d.data.note);
  });

  /** Thai combining vowels and tone marks carry no width of their own, so a
   *  character count overstates a label by about a third. Measure the drawn
   *  text instead, and remember the total so the canvas can fit it. */
  function fit() {
    node.each(function (d) {
      const t = this.querySelector<SVGTextElement>('text.lbl');
      if (!t) return;
      const w = t.getComputedTextLength();
      const c = this.querySelector<SVGTextElement>('text.cnt');
      if (c) c.setAttribute('x', String(10 + w + 9));
      d.lw = 10 + w + (c ? 9 + c.getComputedTextLength() : 0);
    });
  }

  function resize() {
    let minX = Infinity;
    let maxX = -Infinity;
    let right = 0;
    for (const d of nodes) {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
      right = Math.max(right, d.y + (d.lw ?? 170));
    }
    const w = Math.ceil(right + PAD * 2);
    const h = Math.ceil(maxX - minX + PAD * 2);
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
    gLink.attr('transform', `translate(${PAD} ${PAD - minX})`);
    gNode.attr('transform', `translate(${PAD} ${PAD - minX})`);
  }

  fit();
  resize();

  // the first measurement runs against whatever font happens to be up; once
  // Noto Sans Thai arrives every label is a different width
  document.fonts?.ready.then(() => {
    fit();
    resize();
  });
}

document.querySelectorAll<HTMLElement>('[data-sitmap]').forEach(draw);
