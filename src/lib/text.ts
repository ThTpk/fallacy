/** Prefix an internal path with the configured base.
 *  The site is served from a subpath on GitHub Pages, so no internal href
 *  may start with a bare "/". */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p: string) => `${BASE}/${p.replace(/^\//, '')}`;

/** Minimal inline formatting for the plain-string fields in front matter.
 *  Escapes first, then supports blank-line paragraphs and **bold** only. */
export function mdLite(s: string): string {
  const esc = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .split(/\n{2,}/)
    .map(
      (p) =>
        '<p>' +
        p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, ' ').trim() +
        '</p>',
    )
    .join('');
}

export const CATEGORY_TH: Record<string, string> = {
  formal: 'เชิงรูปแบบ',
  relevance: 'อ้างสิ่งไม่เกี่ยวข้อง',
  presumption: 'ตั้งสมมติฐานลอย',
  ambiguity: 'ความกำกวมของภาษา',
  causal: 'เหตุและผล',
  statistical: 'เชิงข้อมูลและสถิติ',
  rhetorical: 'กลวิธีโต้วาที',
};

export const CATEGORY_ORDER = [
  'formal',
  'relevance',
  'presumption',
  'ambiguity',
  'causal',
  'statistical',
  'rhetorical',
];

export const KIND_TH: Record<string, string> = {
  fallacy: 'ตรรกวิบัติ',
  rhetorical_tactic: 'กลวิธีโต้วาที',
  statistical_error: 'ความผิดพลาดเชิงข้อมูล',
};

export const LEVEL_TH: Record<string, string> = {
  clear: 'ชัดเจน',
  everyday: 'ชีวิตประจำวัน',
  subtle: 'เนียน',
};

export const MEDIUM_TH: Record<string, string> = {
  news: 'ข่าว',
  ad: 'โฆษณา',
  social: 'โซเชียลมีเดีย',
  transcript: 'บันทึกคำพูด',
  press_release: 'ข่าวเผยแพร่',
  broadcast: 'รายการออกอากาศ',
  factcheck: 'การตรวจสอบข้อเท็จจริง',
  legal_filing: 'เอกสารคดี',
};

export const dots = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n);

export const thDate = (d: Date) =>
  new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(d);
