/** 规范化运行时数据及页面兼容视图类型。 */

/** 规范化运行时篇目。原始 OCR 字段不直接暴露给页面。 */
export interface CanonicalParagraph {
  start?: number;
  end?: number;
  fallbackText?: string;
  analysis?: string;
  translation?: string;
  number?: string;
}

export interface CanonicalCulture {
  text?: string;
  authorIntro?: string;
  background?: string;
  theme?: string;
}

export interface CanonicalArticle {
  id: string;
  title: string;
  grade: string;
  author?: string;
  dynasty?: string;
  origin?: string;
  source?: string;
  reading: {
    original: string;
    translation: string;
    paragraphs: CanonicalParagraph[];
  };
  analysis: {
    theme?: string;
    outline?: string;
    writing?: string;
    culture: CanonicalCulture;
  };
  recitation: {
    stars: CanonicalStarSentence[];
  };
  wordIds: string[];
  questionIds: string[];
}

export interface CanonicalStarSentence {
  sentence: string;
  kind: '重点句' | '名句默写';
  translation?: string;
}

export interface CanonicalWordMeaning {
  text: string;
  category: string;
  source: string;
  example?: string;
  origin?: string;
  numbers?: string[];
  /** v2 规范化前的卡片 ID，仅用于迁移本地复习进度。 */
  legacyIds?: string[];
}

export interface CanonicalWord {
  id: string;
  scope: 'article' | 'global';
  articleId?: string;
  word: string;
  meanings: CanonicalWordMeaning[];
}

export interface CanonicalQuestion {
  id: string;
  scope: 'article' | 'collection';
  articleId?: string;
  collectionId?: string;
  origin: 'practice' | 'zhenti' | 'related' | 'exam_point' | 'handwritten' | 'exam_gen';
  origins: string[];
  type: QuestionType;
  stem: string;
  answer: string | string[];
  options?: string[];
  answerNote?: string;
  explanation?: string;
  key_points?: string[];
  /** AI 生成题考点标签（exam-gen 来源） */
  points?: string[];
  province?: string;
  year?: string;
  source?: string;
  material?: string;
  fromZhenti?: boolean;
}

export interface CanonicalCollection {
  id: string;
  title: string;
  grade: string;
  source: string;
  questionIds: string[];
}

/** 学习篇目（课文全解） */
export interface Note {
  char?: string;
  text?: string;
  number?: string;
}

export interface RelatedQuestion {
  title?: string;
  type?: string;
  stem?: string;
  [k: string]: unknown;
}

export interface KeyTermItem {
  word?: string;
  meaning?: string;
}

export interface KeyTermGroup {
  category?: string;
  items?: KeyTermItem[];
}

export interface LearningArticle {
  id?: string;
  type?: string;
  title: string;
  author?: string;
  dynasty?: string;
  origin?: string;
  grade?: string;
  source?: string;
  original_text?: string;
  translation?: string;
  notes?: Note[];
  paragraph_analysis?: string | string[];
  exam_points?: string[] | unknown;
  literary_culture?: string;
  key_terms?: unknown[];
  key_sentences?: unknown[];
  writing_features?: string;
  theme_idea?: string;
  content_outline?: string;
  related_questions?: RelatedQuestion[];
  /** glossary 专属 */
  subtitle?: string;
  shici?: GlossaryChar[];
  xuci?: GlossaryChar[];
}

export interface GlossarySense {
  sense?: string;
  example?: string;
  origin?: string;
}

export interface GlossaryUsage {
  category?: string;
  subtype?: string;
  example?: string;
  origin?: string;
}

export interface GlossaryChar {
  char: string;
  senses?: GlossarySense[];
  usage?: GlossaryUsage[];
}

/** 练习篇目 */
export type QuestionType =
  | 'blank' | 'choice' | 'discuss' | 'explain'
  | 'passage' | 'punctuate' | 'short' | 'translate'
  /** 中考真题题型（已并入练习） */
  | 'gloss' | 'punct' | 'understand' | 'open';

export type PracticeKind = 'yiwuyilian' | 'zhenti';
export type ZhentiSource = 'jiaocai' | 'web';

export interface PracticeQuestion {
  id?: string;
  type: QuestionType;
  stem?: string;
  options?: string[];
  answer: string | string[];
  answerNote?: string;
  explanation?: string;
  key_points?: string[];
  /** 真题来源省份 */
  province?: string;
  /** 真题年份 */
  year?: string;
  /** jiaocai | web */
  source?: ZhentiSource | string;
  /** 阅读材料（甲/乙选段） */
  material?: string;
  /** 是否来自中考真题库 */
  fromZhenti?: boolean;
  /** 来源类型 (practice/zhenti/exam_gen/exam_point/related/handwritten) */
  origin?: string;
  /** 来源类型数组 */
  origins?: string[];
  /** 关联篇目 / 题集 */
  articleId?: string;
  collectionId?: string;
  articleTitle?: string;
}

export interface PracticeArticle {
  id?: string;
  type?: string;
  title: string;
  author?: string;
  dynasty?: string;
  origin?: string;
  grade?: string;
  source?: string;
  original_text?: string;
  translation?: string;
  notes?: Note[];
  questions?: PracticeQuestion[];
  /** yiwuyilian=一文一练；zhenti=中考真题专篇 */
  kind?: PracticeKind;
  /** 真题数（混合篇目中） */
  zhentiCount?: number;
}

/** 手录数据（questions.js 迁移） */
export interface HandwrittenData {
  annotation: PracticeArticle[];
  passage: PracticeArticle[];
  extra: PracticeArticle[];
  exam: PracticeArticle[];
  meta: {
    articleCount: number;
    pageCountDone: number;
    source: string;
  };
}

/** 中考真题（教材解读"中考链接"提取 + 网络搜集） */
export interface ZhentiItem {
  id: string;
  page: number;        // 来源页码，网络真题用 0
  title: string;       // 关联篇目
  province: string;   // 省份/地区
  stem: string;        // 题干
  answer: string;      // 答案
  source?: 'jiaocai' | 'web';  // 数据来源
  year?: string;       // 年份（网络真题）
  material?: string;   // 阅读材料原文（甲/乙选段）
  type?: 'gloss' | 'choice' | 'punct' | 'translate' | 'understand' | 'open';
  analysis?: string;   // 解析
  subQuestions?: { q: string; a: string; analysis?: string }[]; // 复合题的小题
}
