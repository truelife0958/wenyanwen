/** XP / 等级系统 — 游戏化核心数值层 (纯函数, 无副作用) */

/** 古风称号: 等级 → 称号 */
export const TITLES = [
  '学童', '蒙童', '秀才', '举人', '贡士',
  '进士', '探花', '榜眼', '状元', '文曲星',
] as const;

/** 等级上限 (10 级后仍可累积 XP, 称号停留在文曲星) */
export const MAX_LEVEL = TITLES.length;

/** 升级所需 XP: 累进曲线 level n → n+1 需 80 + 40*(n-1) */
export function xpForLevel(n: number): number {
  // 从等级 n 升到 n+1 所需 XP
  return 80 + 40 * (n - 1);
}

/** 累计到某等级所需总 XP */
export function cumulativeXp(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

/** 由累计 XP 反推等级 (1 起) */
export function levelFromXp(xp: number): number {
  let level = 1;
  let rem = xp;
  while (level < MAX_LEVEL) {
    const need = xpForLevel(level);
    if (rem < need) break;
    rem -= need;
    level++;
  }
  return level;
}

/** 当前等级内进度: { level, cur, need, pct } */
export function levelProgress(xp: number): { level: number; cur: number; need: number; pct: number; title: string } {
  const level = levelFromXp(xp);
  const base = cumulativeXp(level);
  const need = level >= MAX_LEVEL ? 1 : xpForLevel(level);
  const cur = Math.min(xp - base, need);
  return {
    level,
    cur,
    need,
    pct: Math.round((cur / need) * 100),
    title: TITLES[Math.min(level - 1, MAX_LEVEL - 1)],
  };
}

/** 单题 XP 计算 (含连击加成) */
export function xpForAnswer(pass: boolean, allPass: boolean, combo: number): number {
  let base = pass ? (allPass ? 15 : 10) : 2;
  // 连击加成: combo 为"本次判定后的连击数"
  if (combo >= 8) base = Math.round(base * 2.0);
  else if (combo >= 5) base = Math.round(base * 1.5);
  else if (combo >= 3) base = Math.round(base * 1.2);
  return base;
}

/** 星级: total 总题数 / passed 全对题数 → 0-3 星 (未作答不算错误) */
export function starsFor(passed: number, total: number): number {
  if (!total) return 0;
  if (passed >= total) return 3;
  const pct = passed / total;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}
