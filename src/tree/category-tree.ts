// Collapsible tree of the whole collection, drawn with d3.
//
// The data is baked into the page at build time as JSON; this file only lays
// it out and animates it. Fallacy leaves are real <a> elements so that
// middle-click, right-click and the keyboard all behave, and so the page is
// still a set of links to a crawler.
import { hierarchy, tree as treeLayout, type HierarchyNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { linkHorizontal } from 'd3-shape';
import 'd3-transition';

interface TNode {
  id: string;
  name: string;
  note?: string;
  count?: number;
  href?: string;
  level?: number;
  children?: TNode[];
}

type Node = HierarchyNode<TNode> & {
  x: number; y: number; x0?: number; y0?: number;
  _children?: Node[];
  children?: Node[];
  uid?: number;
  /** measured width of this node's label plus its count, set on first draw */
  lw?: number;
};

const host = document.querySelector<HTMLElement>('#category-tree');
const raw = document.querySelector<HTMLScriptElement>('#category-tree-data');

if (host && raw) {
  const data: TNode = JSON.parse(raw.textContent || '{}');

  // the no-script version of the same tree, which has done its job by now
  host.querySelector('.fallback')?.remove();
  document.querySelector('#tree-controls')?.removeAttribute('hidden');

  const ROW = 27;          // vertical pitch between siblings
  const COL = 176;         // horizontal pitch between depths
  const PAD = 16;
  // d3 animates attributes from JS, so a CSS media query cannot switch this off
  const DUR = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;

  const svg = select(host)
    .append('svg')
    .attr('class', 'tree')
    .attr('role', 'tree')
    .attr('aria-label', 'แผนผังหมวดหมู่ตรรกวิบัติ');
  const gLink = svg.append('g').attr('class', 'links');
  const gNode = svg.append('g').attr('class', 'nodes');

  const layout = treeLayout<TNode>().nodeSize([ROW, COL]);
  const link = linkHorizontal<unknown, Node>().x((d) => d.y).y((d) => d.x);

  const root = hierarchy<TNode>(data) as Node;
  let seq = 0;
  root.descendants().forEach((n) => {
    const d = n as Node;
    d.uid = seq++;
    d._children = d.children;
    // a category starts closed: the shape of the tree should be readable
    // before 29 leaves are poured into it
    if (d.children && d.children.some((c) => c.data.href)) d.children = undefined;
  });
  root.x0 = 0;
  root.y0 = 0;

  const isLeaf = (d: Node) => Boolean(d.data.href);
  const togglable = (d: Node) => !isLeaf(d) && Boolean(d._children && d._children.length);

  /** build a node's contents once, on enter */
  function build(g: SVGGElement, d: Node) {
    const s = select(g);
    s.append('circle').attr('r', 4.5);

    if (isLeaf(d)) {
      const a = s.append('a').attr('href', d.data.href!);
      // a <title> that is a child of the <a> becomes the link's accessible
      // name and replaces the visible label, so it has to carry that label
      if (d.data.level) {
        a.append('title').text(`${d.data.name} · ความยาก ${d.data.level} จาก 3`);
      }
      a.append('text').attr('class', 'lbl').attr('x', 11).attr('dy', '0.32em')
        .text(d.data.name);
    } else {
      s.append('text').attr('class', 'lbl branch').attr('x', 11).attr('dy', '0.32em')
        .text(d.data.name);
      if (d.data.count) {
        s.append('text').attr('class', 'cnt').attr('dy', '0.32em').text(String(d.data.count));
      }
      if (d.data.note) s.append('title').text(d.data.note);
    }
    fit(g, d);

    if (togglable(d)) {
      s.attr('role', 'button').attr('tabindex', 0).attr('class', 'n open');
      const hit = () => toggle(d);
      g.addEventListener('click', hit);
      g.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          hit();
        }
      });
    }
  }

  /** Thai combining vowels and tone marks take no width of their own, so a
   *  character count overstates a label by a third. Measure the real thing,
   *  put the count right after it, and remember the total for the canvas. */
  function fit(g: SVGGElement, d: Node) {
    const t = g.querySelector<SVGTextElement>('text.lbl');
    if (!t) return;
    const w = t.getComputedTextLength();
    const c = g.querySelector<SVGTextElement>('text.cnt');
    if (c) c.setAttribute('x', String(11 + w + 9));
    d.lw = 11 + w + (c ? 9 + c.getComputedTextLength() : 0);
  }

  function toggle(d: Node) {
    d.children = d.children ? undefined : d._children;
    update(d);
    reveal(d);
  }

  /** unfolding a branch adds a column to the right of it, which on a narrow
   *  screen lands outside the scroll box; bring it in rather than leaving the
   *  reader to discover that the thing they clicked went somewhere */
  function reveal(d: Node) {
    if (!d.children || !host) return;
    const right = Math.max(...d.children.map((c) => c.y + (c.lw ?? 160))) + PAD * 2;
    const want = Math.max(0, right - host.clientWidth);
    if (want > host.scrollLeft) {
      host.scrollTo({ left: want, behavior: DUR ? 'smooth' : 'auto' });
    }
  }

  /** a node that holds fallacy entries rather than more structure */
  const holdsEntries = (d: Node) => Boolean(d._children?.some((c) => c.data.href));

  function setAll(open: boolean) {
    root.descendants().forEach((n) => {
      const d = n as Node;
      if (!togglable(d)) return;
      // folding up means putting the entries away, not flattening the tree to
      // two nodes: the shape is the thing this figure is for
      d.children = open || !holdsEntries(d) ? d._children : undefined;
    });
    update(root);
    if (!open) host?.scrollTo({ left: 0, behavior: DUR ? 'smooth' : 'auto' });
  }

  function update(source: Node) {
    layout(root);
    const nodes = root.descendants() as Node[];
    const links = root.links() as unknown as Array<{ source: Node; target: Node }>;

    const node = gNode.selectAll<SVGGElement, Node>('g.n')
      .data(nodes, (d) => String(d.uid));

    const enter = node.enter().append('g')
      .attr('class', (d) => (isLeaf(d) ? 'n leaf' : 'n'))
      .attr('transform', `translate(${source.y0 ?? source.y} ${source.x0 ?? source.x})`)
      .attr('opacity', 0)
      .each(function (d) { build(this, d); });

    enter.merge(node)
      .attr('data-open', (d) => (togglable(d) ? (d.children ? 'yes' : 'no') : null))
      .attr('aria-expanded', (d) => (togglable(d) ? (d.children ? 'true' : 'false') : null))
      .transition().duration(DUR)
      .attr('transform', (d) => `translate(${d.y} ${d.x})`)
      .attr('opacity', 1);

    node.exit<Node>()
      .transition().duration(DUR)
      .attr('transform', `translate(${source.y} ${source.x})`)
      .attr('opacity', 0)
      .remove();

    const lk = gLink.selectAll<SVGPathElement, { source: Node; target: Node }>('path')
      .data(links, (d) => String(d.target.uid));

    const lkEnter = lk.enter().append('path')
      .attr('d', () => {
        const o = { x: source.x0 ?? source.x, y: source.y0 ?? source.y } as Node;
        return link({ source: o, target: o })!;
      })
      .attr('opacity', 0);

    lkEnter.merge(lk).transition().duration(DUR)
      .attr('d', (d) => link(d)!)
      .attr('opacity', 1);

    lk.exit<{ source: Node; target: Node }>()
      .transition().duration(DUR)
      .attr('d', () => {
        const o = { x: source.x, y: source.y } as Node;
        return link({ source: o, target: o })!;
      })
      .attr('opacity', 0)
      .remove();

    for (const d of nodes) { d.x0 = d.x; d.y0 = d.y; }
    resize();
  }

  /** the canvas is exactly as big as what is currently unfolded */
  function resize() {
    const nodes = root.descendants() as Node[];
    let minX = Infinity, maxX = -Infinity, right = 0;
    for (const d of nodes) {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
      right = Math.max(right, d.y + (d.lw ?? 160));
    }
    const w = Math.ceil(right + PAD * 2);
    const h = Math.ceil(maxX - minX + PAD * 2);
    const originX = PAD - minX;

    // set straight on the element: a transition would have to interpolate the
    // viewBox string, and on the first pass there is no previous value to go
    // from, which leaves the svg at its default 300x150
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
    gLink.attr('transform', `translate(${PAD} ${originX})`);
    gNode.attr('transform', `translate(${PAD} ${originX})`);
  }

  update(root);

  // the first measurement runs against whatever font is up at the time; once
  // Noto Sans Thai has actually arrived, every label is a different width
  document.fonts?.ready.then(() => {
    gNode.selectAll<SVGGElement, Node>('g.n').each(function (d) { fit(this, d); });
    resize();
  });

  document.querySelector('#tree-open')?.addEventListener('click', () => setAll(true));
  document.querySelector('#tree-close')?.addEventListener('click', () => setAll(false));
}
