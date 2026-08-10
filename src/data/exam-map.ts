/**
 * 考点图谱数据层 — 从统一题库聚合考点索引。
 *
 * 借鉴来源:
 * - 研途 (zhongkaoexam) 考点图谱: 命题点 → 高频过滤 → 学科/层级分组 → 频次徽章
 * - 智考真题实验室 (ai-smartexam) 考点统计: 频次/真题年份/分值权重/教材映射
 *
 * 考点来源(三级):
 * 1. 题目自带 points (AI 生成题考点标签, 426 题)
 * 2. 题目 key_points (手写/真题考点, 205 题)
 * 3. 篇目考点表 EXAM_TAGS (必考/核心篇目的考查点映射, 覆盖该篇全部题目)
 */
import type { CanonicalQuestion, PracticeArticle, PracticeQuestion } from '../types';
import { getCore } from './index';
import { EXAM_TAGS } from './exam-tags';

/** 单个考点的聚合统计。 */
export interface ExamPoint {
  name: string;
  questionIds: string[];
  articleIds: string[];
  articleTitles: string[];
  /** 真题数量 (来自中考真题/中考链接) */
  zhentiCount: number;
  /** 真题年份, 降序 */
  years: string[];
  /** 题型分布 */
  types: string[];
  /** 题目总数 */
  count: number;
  /** 高频: 题多 / 真题多年 / 必考篇目 */
  hot: boolean;
  /** 关联篇目等级: must 必考 > core 核心 > normal */
  level: 'must' | 'core' | 'normal';
  /** 错题数 (weakPointsFromErrors 填充) */
  mistakes: number;
}

interface PointAcc {
  questionIds: Set<string>;
  articleIds: Set<string>;
  zhentiCount: number;
  years: Set<string>;
  types: Set<string>;
  level: 'must' | 'core' | 'normal';
}

/** 归一化考点名: 去空白/换行, 压缩多余空格 */
function normPoint(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name.replace(/\s+/g, ' ').trim();
}

function levelRank(level: ExamPoint['level']): number {
  return level === 'must' ? 2 : level === 'core' ? 1 : 0;
}

function coreData() {
  const core = getCore();
  if (!core) throw new Error('data core 未加载 (loadCore 先行)');
  return core;
}

/** 安全读取: core 未加载时返回 null (SSR/首帧) */
function tryCore() {
  return getCore();
}

function buildPointMap(): Map<string, PointAcc> {
  const { questions, articleById } = coreData();
  const map = new Map<string, PointAcc>();

  const accFor = (name: string): PointAcc => {
    let acc = map.get(name);
    if (!acc) {
      acc = { questionIds: new Set(), articleIds: new Set(), zhentiCount: 0, years: new Set(), types: new Set(), level: 'normal' };
      map.set(name, acc);
    }
    return acc;
  };

  const addQuestion = (name: string, q: CanonicalQuestion) => {
    const clean = normPoint(name);
    if (!clean) return;
    const acc = accFor(clean);
    acc.questionIds.add(q.id);
    if (q.type) acc.types.add(q.type);
    const isZhenti = Boolean(q.fromZhenti || q.origin === 'zhenti');
    if (isZhenti) {
      acc.zhentiCount += 1;
      if (q.year) acc.years.add(String(q.year));
    }
    if (q.articleId) {
      acc.articleIds.add(q.articleId);
      const article = articleById.get(q.articleId);
      const tag = article ? EXAM_TAGS[article.title] : undefined;
      if (tag && levelRank(tag.level) > levelRank(acc.level)) acc.level = tag.level;
    }
  };

  for (const q of questions) {
    const article = q.articleId ? articleById.get(q.articleId) : undefined;
    // 来源1: 题目自带考点标签
    (q.points || []).forEach((p) => addQuestion(p, q));
    // 来源2: 手写/真题考点
    (q.key_points || []).forEach((p) => addQuestion(p, q));
    // 来源3: 篇目考点表 (覆盖该篇全部题目)
    if (article && EXAM_TAGS[article.title]) {
      EXAM_TAGS[article.title].points.forEach((p) => addQuestion(p, q));
    }
  }

  return map;
}

function toExamPoint(name: string, acc: PointAcc): ExamPoint {
  const { articleById } = coreData();
  const years = Array.from(acc.years)
    .map((y) => y.replace(/\D/g, ''))
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));
  return {
    name,
    questionIds: Array.from(acc.questionIds),
    articleIds: Array.from(acc.articleIds),
    articleTitles: Array.from(acc.articleIds)
      .map((id) => articleById.get(id)?.title)
      .filter((t): t is string => Boolean(t)),
    zhentiCount: acc.zhentiCount,
    years,
    types: Array.from(acc.types),
    count: acc.questionIds.size,
    hot: acc.questionIds.size >= 5 || acc.zhentiCount >= 2 || acc.level === 'must',
    level: acc.level,
    mistakes: 0,
  };
}

let pointCache: ExamPoint[] | null = null;

/** 全部考点, 按 hot + count 降序 (借鉴研途: 高频前置) */
export function getExamPoints(): ExamPoint[] {
  if (pointCache) return pointCache;
  const pointMap = buildPointMap();
  pointCache = Array.from(pointMap.entries())
    .map(([name, acc]) => toExamPoint(name, acc))
    .sort((a, b) => Number(b.hot) - Number(a.hot) || b.count - a.count || b.zhentiCount - a.zhentiCount);
  return pointCache;
}

export function getExamPointCount(): number { return getExamPoints().length; }
export function getHotPointCount(): number { return getExamPoints().filter((p) => p.hot).length; }

export function pointOf(name: string): ExamPoint | undefined {
  return getExamPoints().find((p) => p.name === name);
}

const isQuestion = (q: CanonicalQuestion | undefined): q is CanonicalQuestion => Boolean(q);

function toPracticeQuestion(q: CanonicalQuestion): PracticeQuestion {
  return {
    id: q.id,
    type: q.type,
    stem: q.stem,
    answer: q.answer,
    options: q.options,
    answerNote: q.answerNote,
    explanation: q.explanation,
    key_points: q.key_points,
    province: q.province,
    year: q.year,
    source: q.source || q.origin,
    material: q.material,
    fromZhenti: q.fromZhenti || q.origin === 'zhenti' || (q.origins || []).includes('zhenti'),
  } as PracticeQuestion;
}

/** 某考点的全部题目 (可直接喂给 PracticeSession 做题) */
export function pointQuestions(name: string): PracticeQuestion[] {
  const point = pointOf(name);
  if (!point) return [];
  const { questionById } = coreData();
  return point.questionIds.map((id) => questionById.get(id)).filter(isQuestion).map(toPracticeQuestion);
}

/** 组装考点练习文章 — 复用练习会话 (SessionView/PracticeSession), 错题自动入错题本 */
export function pointArticle(name: string): PracticeArticle {
  return {
    id: `point:${name}`,
    title: `考点 · ${name}`,
    kind: 'yiwuyilian',
    questions: pointQuestions(name),
  };
}

/** 薄弱考点 — 从错题本聚合 (借鉴 ai-smartexam weakTags: 错题>0 即薄弱) */
export interface WeakPoint {
  name: string;
  count: number;
  questionIds: string[];
}

export function weakPointsFromErrors(errorItems: Array<{ qid?: string }>): WeakPoint[] {
  const core = getCore();
  if (!core) return [];
  const map = new Map<string, { count: number; questionIds: Set<string> }>();
  const { questionById, articleById } = core;
  for (const entry of errorItems) {
    if (!entry.qid) continue;
    const q = questionById.get(entry.qid);
    if (!q) continue;
    const names: string[] = [...(q.points || []), ...(q.key_points || [])];
    if (names.length === 0) {
      const article = q.articleId ? articleById.get(q.articleId) : undefined;
      if (article && EXAM_TAGS[article.title]) names.push(...EXAM_TAGS[article.title].points);
    }
    for (const name of names) {
      const clean = normPoint(name);
      if (!clean) continue;
      const acc = map.get(clean) || { count: 0, questionIds: new Set<string>() };
      acc.count += 1;
      acc.questionIds.add(q.id);
      map.set(clean, acc);
    }
  }
  return Array.from(map.entries())
    .map(([name, acc]) => ({ name, count: acc.count, questionIds: Array.from(acc.questionIds) }))
    .sort((a, b) => b.count - a.count);
}

/** ===== 考点分类 ===== */
export interface PointCategory {
  name: string;
  points: ExamPoint[];
}

/** 分类规则: 按考点名关键词匹配, 顺序即分类顺序 */
const CATEGORY_RULES: Array<{ name: string; test: (name: string) => boolean }> = [
  { name: '背诵默写', test: (n) => /背诵|默写/.test(n) },
  { name: '字词句翻译', test: (n) => /实词|虚词|翻译|词义|解释|断句|句式|词语|加点|句读/.test(n) },
  { name: '内容理解', test: (n) => /内容|理解|概括|结构|线索|顺序|详略|段落|思路|情节|文意|进谏|事理|主旨句/.test(n) },
  { name: '写作手法', test: (n) => /手法|写法|修辞|描写|对比|衬托|虚实|托物|象征|动静|白描|烘托|铺垫|照应|寓情|烘染|情景交融|借景抒情|借古讽今|设喻|排比|反问|典故|神话|词风|论证|用典|映衬|渲染/.test(n) },
  { name: '语言赏析', test: (n) => /赏析|语言|表达效果|炼字|对偶|骈|对仗|用词|古体|风格|韵味|气势/.test(n) },
  { name: '主旨情感', test: (n) => /主旨|情感|主题|思想|情怀|心情|精神|感悟|道理|哲理|态度|志向|情操|心境|襟怀|怀才|壮志|豪情|隐逸|隐居|避世|劝勉|感慨|思乡|忧国|报国|爱国|豁达|旷达|乐观|赞美山河/.test(n) },
  { name: '人物形象', test: (n) => /形象|人物|性格|品格|品质|为人|才学|智者|贤者/.test(n) },
  { name: '篇目特色', test: () => true },
];

export const POINT_CATEGORIES = CATEGORY_RULES.map((r) => r.name);

/** 考点 → 分类名 */
export function pointCategoryName(point: { name: string }): string {
  const rule = CATEGORY_RULES.find((r) => r.test(point.name));
  return rule ? rule.name : '综合拓展';
}

/** 考点列表按分类分组 (保持分类顺序, 组内按高频+题数降序) */
export function groupPointsByCategory(points: ExamPoint[]): PointCategory[] {
  const map = new Map<string, ExamPoint[]>();
  POINT_CATEGORIES.forEach((c) => map.set(c, []));
  points.forEach((p) => {
    const c = pointCategoryName(p);
    map.get(c)!.push(p);
  });
  return POINT_CATEGORIES
    .map((name) => ({ name, points: (map.get(name) || []).sort((a, b) => Number(b.hot) - Number(a.hot) || b.count - a.count) }))
    .filter((c) => c.points.length > 0);
}
