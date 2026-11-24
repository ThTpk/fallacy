/** The shape of the collection, as a tree.
 *
 *  `category` on a fallacy entry is a flat enum of seven values. That is the
 *  right thing to store, but it hides the reason those seven go together: the
 *  first split in every logic textbook is formal against informal, and the
 *  informal side then splits by *which* job the premises fail at. This file is
 *  that reasoning, written down once, so the home page can draw it.
 *
 *  Only the leaves carry entries. A branch with no `category` is a grouping
 *  node and holds no fallacies of its own.
 */
import { CATEGORY_TH, CATEGORY_ORDER } from './text';

export interface Branch {
  id: string;
  /** omitted on a category leaf, where the name comes from CATEGORY_TH */
  name?: string;
  note?: string;
  category?: string;
  children?: Branch[];
}

export const TAXONOMY: Branch = {
  id: 'root',
  name: 'ตรรกวิบัติ',
  note: 'ข้อโต้แย้งที่ดูเหมือนให้เหตุผล แต่ไม่ได้ให้',
  children: [
    {
      id: 'formal',
      category: 'formal',
      note: 'โครงของการอนุมานผิดเอง ตัดสินได้จากรูป โดยไม่ต้องรู้ว่าเนื้อหาพูดถึงอะไร',
    },
    {
      id: 'informal',
      name: 'เชิงเนื้อหา',
      note: 'โครงไม่ผิด แต่ข้ออ้างที่ใส่เข้าไปใช้ไม่ได้ ต้องรู้เรื่องที่พูดถึงก่อนจึงตัดสินได้',
      children: [
        {
          id: 'relevance',
          category: 'relevance',
          note: 'ข้ออ้างอาจเป็นจริงทุกข้อ แต่ต่อให้จริงก็ไม่ได้ช่วยข้อสรุป',
        },
        {
          id: 'presumption',
          category: 'presumption',
          note: 'ข้ออ้างแอบบรรจุสิ่งที่ยังต้องพิสูจน์เข้าไปเสียเอง',
        },
        {
          id: 'ambiguity',
          category: 'ambiguity',
          note: 'ถ้อยคำเปลี่ยนความหมายกลางทาง หรืออ่านได้มากกว่าหนึ่งแบบ',
        },
        {
          id: 'evidence-group',
          name: 'หลักฐานรับน้ำหนักไม่ไหว',
          note: 'ข้ออ้างเกี่ยวข้องจริงและเป็นจริง แต่ยังพาไปถึงข้อสรุปไม่ได้',
          children: [
            { id: 'causal', category: 'causal' },
            { id: 'statistical', category: 'statistical' },
          ],
        },
        {
          id: 'rhetorical',
          category: 'rhetorical',
          note: 'ไม่ได้พลาดที่การอนุมาน แต่เล่นที่ตัวการสนทนา เช่น เวลา ภาระพิสูจน์ หรือความน่าเชื่อถือของอีกฝ่าย',
        },
      ],
    },
  ],
};

/** every category must sit in the tree exactly once, or the home page would
 *  quietly drop entries. Called from the page so the build fails, not the tab. */
export function assertCoversEveryCategory(): void {
  const seen: string[] = [];
  const walk = (b: Branch) => {
    if (b.category) seen.push(b.category);
    b.children?.forEach(walk);
  };
  walk(TAXONOMY);

  const dupes = seen.filter((c, i) => seen.indexOf(c) !== i);
  if (dupes.length) {
    throw new Error(`taxonomy: category appears more than once: ${dupes.join(', ')}`);
  }
  const missing = CATEGORY_ORDER.filter((c) => !seen.includes(c));
  if (missing.length) {
    throw new Error(`taxonomy: no place in the tree for: ${missing.join(', ')}`);
  }
  const unknown = seen.filter((c) => !CATEGORY_ORDER.includes(c));
  if (unknown.length) {
    throw new Error(`taxonomy: not a real category: ${unknown.join(', ')}`);
  }
  const unnamed = seen.filter((c) => !CATEGORY_TH[c]);
  if (unnamed.length) {
    throw new Error(`taxonomy: no Thai name for: ${unnamed.join(', ')}`);
  }
}
