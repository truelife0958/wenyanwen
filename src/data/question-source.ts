/**
 * 题目出处系统 — 每道练习题标注精确来源。
 *
 * 六大来源 (runtime questions.json 的 origin 字段):
 * - zhenti      中考真题 (含年份/省份/来源 jiaocai|web)
 * - practice    一文一练练习册 (归篇目或综合题集)
 * - exam_gen    AI 生成考点题 (归篇目 + 考点标签)
 * - exam_point  教材考点题
 * - related     相关练习
 * - handwritten 手写题库
 */
import { getCore, collections } from './index';

export interface QuestionSourceInfo {
  /** 主徽章 (真题/一文一练/AI生成/考点/相关/手写) */
  badge: string;
  /** 出处行文本, 如 "2024 · 武汉" / "《论语十二章》一文一练" */
  label: string;
}

type Sourceable = {
  origin?: string;
  origins?: string[];
  fromZhenti?: boolean;
  year?: string;
  province?: string;
  source?: string;
  collectionId?: string;
  articleId?: string;
  articleTitle?: string;
  points?: string[];
};

const REAL_YEAR = /^\d{4}$/;

function articleTitleOf(q: Sourceable): string {
  if (q.articleTitle) return q.articleTitle;
  if (q.articleId) return getCore()?.articleById.get(q.articleId)?.title || '';
  return '';
}

/** 标题包书名号, 已带《》的不重复包裹 (避免《《论语》十二章》) */
function wrapTitle(title: string): string {
  const t = title.trim();
  return t.startsWith('《') && t.endsWith('》') ? t : `《${t}》`;
}
export function questionSourceOf(q: Sourceable): QuestionSourceInfo {
  // 真题优先 (含从题集/练习中混入的真题)
  const isZhenti = Boolean(q.fromZhenti || q.origin === 'zhenti' || (q.origins || []).includes('zhenti'));
  if (isZhenti) {
    const year = q.year && REAL_YEAR.test(String(q.year)) ? String(q.year) : '';
    const province = (q.province || '').replace(/省|市|卷$/g, '').trim();
    const label = [year, province].filter(Boolean).join(' · ');
    return { badge: '真题', label: label ? `中考真题 · ${label}` : '中考真题' };
  }

  // 综合题集归属优先于篇目归属 (题集跨篇)
  let title = q.articleTitle || '';
  if (!title && q.collectionId) {
    title = collections.find((c) => c.id === q.collectionId)?.title || '';
  }
  if (!title) title = articleTitleOf(q);

  switch (q.origin) {
    case 'practice':
      return { badge: '一文一练', label: title ? `${wrapTitle(title)}一文一练` : '一文一练练习' };
    case 'exam_point':
      return { badge: '考点', label: title ? `${wrapTitle(title)}考点` : '教材考点' };
    case 'exam_gen': {
      const point = (q.points || [])[0];
      return { badge: 'AI生成', label: title ? `${wrapTitle(title)}· ${point || '考点'}` : `AI 生成 · ${point || '考点'}` };
    }
    case 'related':
      return { badge: '相关', label: title ? `${wrapTitle(title)}相关练习` : '相关练习' };
    case 'handwritten':
      return { badge: '手写', label: title ? `${wrapTitle(title)}手写题库` : '手写题库' };
    default:
      return { badge: '练习', label: title ? `${wrapTitle(title)}练习` : '练习' };
  }
}

/** 徽章 → CSS 变体类名 (真题红 / 一文一练铜 / AI生成紫 / 考点蓝 / 相关灰 / 手写绿) */
export function questionSourceTone(badge: string): string {
  switch (badge) {
    case '真题': return 'zt';
    case '一文一练': return 'practice';
    case 'AI生成': return 'gen';
    case '考点': return 'point';
    case '相关': return 'related';
    case '手写': return 'hand';
    default: return 'default';
  }
}
