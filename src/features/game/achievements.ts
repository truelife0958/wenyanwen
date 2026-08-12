/** 成就系统 — 定义 + 检测 (纯函数) */
import { levelProgress } from './xp';
import type { GameState } from './store';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;        // emoji 图标
  hidden?: boolean;    // 达成前显示 ???
  check: (s: GameState) => boolean;
}

const totalAnswered = (s: GameState) => Object.values(s.levels).reduce((t, r) => t + r.total, 0);
const totalPassed = (s: GameState) => Object.values(s.levels).reduce((t, r) => t + r.passed, 0);
const totalStars = (s: GameState) => Object.values(s.levels).reduce((t, r) => t + (r.stars >= 1 ? 1 : 0), 0);
const completedArticles = (s: GameState) => Object.values(s.levels).filter((r) => r.total > 0).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', name: '初出茅庐', desc: '完成第 1 道默写题', icon: '🌱', check: (s) => totalAnswered(s) >= 1 },
  { id: 'ten-perfect', name: '十全十美', desc: '累计全对 10 题', icon: '🎯', check: (s) => totalPassed(s) >= 10 },
  { id: 'hundred', name: '百炼成钢', desc: '累计作答 100 题', icon: '⚔️', check: (s) => totalAnswered(s) >= 100 },
  { id: 'combo5', name: '连击小达人', desc: '单次连击达到 5', icon: '🔥', check: (s) => s.bestCombo >= 5 },
  { id: 'combo10', name: '连击大师', desc: '单次连击达到 10', icon: '🌋', check: (s) => s.bestCombo >= 10 },
  { id: 'clear5', name: '过关斩将', desc: '通关 5 篇默写', icon: '🗡️', check: (s) => completedArticles(s) >= 5 },
  { id: 'clear10', name: '半壁江山', desc: '通关 10 篇默写', icon: '🏯', check: (s) => completedArticles(s) >= 10 },
  { id: 'clear20', name: '全胜将军', desc: '通关 20 篇默写', icon: '🏆', check: (s) => completedArticles(s) >= 20 },
  { id: 'lv5', name: '进士及第', desc: '等级达到 5 级', icon: '🎓', check: (s) => levelProgress(s.xp).level >= 5 },
  { id: 'lv9', name: '状元及第', desc: '等级达到 9 级', icon: '👑', check: (s) => levelProgress(s.xp).level >= 9 },
  { id: 'streak3', name: '锲而不舍', desc: '连续学习 3 天', icon: '📅', check: (s) => s.streak >= 3 },
  { id: 'streak7', name: '焚膏继晷', desc: '连续学习 7 天', icon: '🏮', check: (s) => s.streak >= 7 },
  { id: 'big-xp', name: '一词千金', desc: '单题获得 15 XP（含连击加成）', icon: '💎', check: (s) => s.todayXp >= 15 && totalAnswered(s) >= 1 },
  { id: 'all-complete', name: '满腹经纶', desc: '完成全部 129 篇默写', icon: '🐉', hidden: true, check: (s) => completedArticles(s) >= 129 },
];

/** 检测新解锁成就 (返回本次新解锁 id 列表) */
export function checkAchievements(s: GameState): string[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s)).map((a) => a.id);
}
