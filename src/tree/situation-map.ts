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
//
// On a narrow screen the component's CSS hides the map and shows the nested
// list instead. This file never reads that breakpoint: it asks the svg whether
// it is being displayed. A hidden element measures as zero, and every column
// width here comes from measured text, so laying out while hidden would set
// every column to nothing. Keeping the question to "am I visible" leaves the
// breakpoint in exactly one place, the stylesheet.
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

/** vertical pitch between siblings */
const ROW = 26;
/** clear space between the end of one column's longest label and the next
 *  column's dots. Below about 18px the curve of the link has nowhere to go */
const GAP = 28;
const PAD = 14;

function draw(wrap: HTMLElement) {
  const host = wrap.querySelector<HTMLElement>('.sitmap-host');
  const raw = wrap.querySelector<HTMLScriptElement>('script[type="application/json"]');
  if (!host || !raw) return;

  const data: SNode = JSON.parse(raw.textContent || '{}');

  const svg = select(host)
    .append('svg')
    .attr('class', 'sitmap')
    .attr('role', 'img')
    .attr('aria-label', wrap.dataset.sitmap || 'แผนผังตรรกวิบัติในสถานการณ์นี้');
  const svgEl = svg.node()!;
  const gLink = svg.append('g').attr('class', 'links');
  const gNode = svg.append('g').attr('class', 'nodes');

  // there is an svg to show now, so the stylesheet may prefer it to the list
  // where there is room. Until this class lands, the list stands on its own,
  // which is what a browser running no script keeps at every width.
  wrap.classList.add('has-svg');

  const root = hierarchy<SNode>(data) as Node;
  // only the vertical positions come from the layout. The horizontal ones are
  // set below from the measured text, because a fixed pitch cannot know how
  // wide a Thai sentence is and a group title here is a sentence.
  clusterLayout<SNode>().nodeSize([ROW, 1])(root);

  const nodes = root.descendants() as Node[];
  const links = root.links() as unknown as Array<{ source: Node; target: Node }>;
  const maxDepth = Math.max(...nodes.map((d) => d.depth));

  const link = linkHorizontal<unknown, Node>().x((d) => d.y).y((d) => d.x);
  const path = gLink.selectAll<SVGPathElement, { source: Node; target: Node }>('path')
    .data(links)
    .enter()
    .append('path');

  const node = gNode
    .selectAll<SVGGElement, Node>('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', (d) => (d.children ? 'n' : 'n leaf'));

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
   *  text instead, and remember the total so the column can hold it. */
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

  /** Each column is as wide as its own widest label. A single pitch for every
   *  depth is what put a branch title on top of the leaf beside it: the group
   *  titles on these pages are long, and no constant fits both them and the
   *  short root. */
  function columns() {
    const widest: number[] = new Array(maxDepth + 1).fill(0);
    for (const d of nodes) widest[d.depth] = Math.max(widest[d.depth], d.lw ?? 0);
    let at = 0;
    const left: number[] = [];
    for (let i = 0; i <= maxDepth; i++) {
      left[i] = at;
      at += widest[i] + GAP;
    }
    for (const d of nodes) d.y = left[d.depth];
  }

  function place() {
    node.attr('transform', (d) => `translate(${d.y} ${d.x})`);
    path.attr('d', (d) => link(d)!);
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

  /** a hidden svg measures as zero, and the columns are built from those
   *  measurements, so there is nothing to compute until it is on screen */
  const shown = () => svgEl.getBoundingClientRect().width > 0;

  let laid = false;
  function relayout() {
    if (!shown()) return;
    fit();
    columns();
    place();
    resize();
    laid = true;
  }

  relayout();

  // the first measurement runs against whatever font happens to be up; once
  // Noto Sans Thai arrives every label is a different width, and so is every
  // column, so the whole pass has to run again rather than just the resize
  document.fonts?.ready.then(relayout);

  // a phone turned to landscape, or a window dragged wider, can cross the
  // breakpoint and reveal a map that was never measured. Once it has been laid
  // out the column widths come from the text alone and no longer depend on the
  // viewport, so this listener has nothing left to do and stops.
  let queued = false;
  window.addEventListener('resize', () => {
    if (laid || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      relayout();
    });
  });
}

document.querySelectorAll<HTMLElement>('[data-sitmap]').forEach(draw);
