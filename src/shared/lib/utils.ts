/** 通用工具 — 拆句 / 序号分段 / 本地状态 (自原项目迁移) */

/**
 * 按 ①②③… 圈号序号分段: "①a。②b。" → ["①a。", "②b。"]
 * 用于写作特色等含序号的分析文本, 保证序号各自成行。
 */
export function splitNumbered(text: string): string[] {
  const s = String(text ?? '').trim();
  if (!s) return [];
  // 圈号序号 ①-⑳ ㉑-㉟ 及 (1)(2) 数字序号
  const parts = s.split(/(?=[①-⑳㉑-㉟]|（\d+）|\(\d+\))/).map((p) => p.trim()).filter(Boolean);
  // 无序号或单段 → 原样单元素
  if (parts.length <= 1) return [s];
  return parts;
}

/** 按句末标点/换行拆句 */

/** 按句末标点/换行拆句 */
export function splitSentences(txt: string): string[] {
  const s = String(txt ?? '');
  if (!s) return [];
  const out: string[] = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    buf += ch;
    // 在句末标点或换行处切分；保留所有字符（含换行/引号）保证偏移与原文一致
    if ('。！？；\n'.indexOf(ch) >= 0) {
      out.push(buf);
      buf = '';
    }
  }
  if (buf) out.push(buf);
  return out;
}

/**
 * 行级对齐：把原文按行（\n）拆分，译文按行/按句比例分配到每行，解决诗词译文只有部分行的问题
 * 返回 [{ orig, trans }] 行对数组
 */
export function alignLines(original: string, translation: string): { orig: string; trans: string }[] {
  const oLines = String(original || '').split('\n').filter((l) => l.trim());
  if (!oLines.length) return [];
  const tText = String(translation || '');
  const tLines = tText.split('\n').filter((l) => l.trim());
  let tSents = tText
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const n = oLines.length;
  // 句号切分不够时，降级用逗号/顿号切分（应对译文每行只含一个句号句的情况）
  if (tSents.length < n) {
    tSents = tText
      .split(/(?<=[。！？；，、,])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  let perLine: string[] = [];
  if (tLines.length === n) {
    perLine = tLines;
  } else {
    // 行数不匹配时按译句比例分配到每一行
    const m = tSents.length;
    if (m === 0) {
      perLine = [tText];
    } else {
      for (let i = 0; i < n; i++) {
        const start = Math.floor((i * m) / n);
        const end = Math.floor(((i + 1) * m) / n);
        perLine.push(tSents.slice(start, end).join(''));
      }
    }
  }
  return oLines.map((ol, i) => ({ orig: ol, trans: perLine[i] || '' }));
}

/** HTML 转义 */
export function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => {
    return (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
    )[c];
  });
}

/** localStorage 读写（带容错） */
export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // 容量溢出等: 明确告警, 避免静默丢失 (S3)
    console.warn(`[wyw] localStorage 写入失败: ${key}`, err);
  }
}

export function removeLS(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** 年级规范化 */
export function normGrade(g?: string): string {
  if (!g) return '未分类';
  const map: Record<string, string> = {
    七上: '七年级上册',
    七下: '七年级下册',
    八上: '八年级上册',
    八下: '八年级下册',
    九上: '九年级上册',
    九下: '九年级下册',
  };
  return map[g] || g;
}

/** ── 历练打卡 (连续天数) ── */
const STREAK_KEY = 'wyw_streak_v1';
export interface StreakState { date: string; count: number; }

export function loadStreak(): StreakState {
  return loadLS<StreakState>(STREAK_KEY, { date: '', count: 0 });
}

/** 记录一次历练: 今日已记则不变; 昨天记过则连续+1; 否则重新开始 */
export function recordLearning(): StreakState {
  const today = new Date().toISOString().slice(0, 10);
  const prev = loadStreak();
  if (prev.date === today) return prev;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = { date: today, count: prev.date === yesterday ? prev.count + 1 : 1 };
  saveLS(STREAK_KEY, next);
  return next;
}
