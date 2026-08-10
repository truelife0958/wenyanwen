/**
 * key_terms 条目展开逻辑 (build 与 validate 共用)。
 * 一词多义/文言虚词的 "①X；②Y" 汇总拆成独立义项。
 */
export const MULTI_MARKERS = '①②③④⑤⑥⑦⑧⑨⑩';

const text = (value) => String(value == null ? '' : value).trim();
const compact = (value) => text(value).replace(/\s+/g, ' ');

/** 按圈号标记切分 "①X；②Y" → ['X','Y'] */
export const splitMarked = (value) => {
  const parts = [];
  let buffer = '';
  for (const char of String(value || '')) {
    if (MULTI_MARKERS.includes(char)) {
      if (buffer.trim()) parts.push(buffer.trim());
      buffer = '';
    } else buffer += char;
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts;
};

/**
 * 展开 key_terms 条目。返回 { meaning, example, category }[]。
 * 两种格式:
 *   A) meaning="①义1；②义2" example="①例1；②例2" (平行列表)
 *   B) meaning="①例1(义1)；②例2(义2)" example 空 (例句内嵌释义)
 */
export function expandKeyTerm(group, item) {
  const category = group.category || '重点词';
  const meaning = compact(item.meaning);
  if (!meaning) return [];
  if (!/[①②③④⑤⑥⑦⑧⑨⑩]/.test(meaning)) {
    return [{ meaning, example: compact(item.example), category }];
  }
  const meanings = splitMarked(meaning);
  const examples = splitMarked(item.example || '');
  return meanings.map((part, index) => {
    const fallbackExample = examples[index] || '';
    const match = part.match(/^([^（(]*)[（(]([^（）()]+)[）)]\s*[。；;]?$/);
    if (match) return { meaning: compact(match[2]), example: compact(match[1]) || fallbackExample, category };
    return { meaning: part, example: fallbackExample, category };
  });
}
