/** 游戏状态 Store — XP/等级/连击/成就/关卡 (Context 单例 + localStorage 持久化) */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { loadLS, saveLS } from '../../shared/lib/utils';
import { levelProgress, xpForAnswer } from './xp';
import { checkAchievements, ACHIEVEMENTS } from './achievements';

export interface LevelRecord {
  stars: number;       // 0-3
  bestCombo: number;
  total: number;       // 该篇已作答题目总数
  passed: number;      // 全对题数
}

export interface GameEvent {
  kind: 'xp' | 'combo' | 'levelup' | 'achieve' | 'star';
  payload: { xp?: number; combo?: number; level?: number; title?: string; achId?: string; stars?: number; articleId?: string };
  ts: number;
}

export interface GameState {
  xp: number;
  combo: number;
  bestCombo: number;
  todayXp: number;
  todayDate: string;
  streak: number;
  levels: Record<string, LevelRecord>;
  achievements: string[];
  sound: boolean;
}

export interface GameApi {
  state: GameState;
  /** 判分回调: 记录 XP/连击/关卡进度 */
  addResult: (articleId: string, qid: string, pass: boolean, allPass: boolean) => void;
  /** 篇目星级 */
  starsOf: (articleId: string) => number;
  /** 关卡是否解锁 (顺序链) */
  isUnlocked: (articleId: string, orderedIds: string[]) => boolean;
  /** 成就是否已解锁 */
  hasAch: (id: string) => boolean;
  toggleSound: () => void;
  /** 消费事件队列 (特效组件读取) */
  drainEvents: () => GameEvent[];
}

const KEY = 'wyw_game_v1';
const GLOBAL_CTX_KEY = '__WYW_GAME_CTX__';
const g = globalThis as Record<string, unknown>;

function defaultState(): GameState {
  return { xp: 0, combo: 0, bestCombo: 0, todayXp: 0, todayDate: '', streak: 0, levels: {}, achievements: [], sound: false };
}

function readState(): GameState {
  const s = loadLS<Partial<GameState>>(KEY, {});
  return { ...defaultState(), ...s, levels: s.levels || {}, achievements: s.achievements || [] };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const Ctx: React.Context<GameApi | null> =
  (g[GLOBAL_CTX_KEY] as React.Context<GameApi | null> | undefined) ||
  createContext<GameApi | null>(null);
g[GLOBAL_CTX_KEY] = Ctx;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(readState);
  const eventsRef = useRef<GameEvent[]>([]);

  // 日期滚动: 今日 XP 重置 + 连续天数递增 (与 wyw_streak_v1 对齐)
  useEffect(() => {
    setState((s) => {
      const today = todayKey();
      if (s.todayDate === today) return s;
      // 跨天: 若昨天有学习则 streak+1, 否则重置为 1 (今日首次)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = s.streak > 0 && s.todayDate === yesterday ? s.streak + 1 : 1;
      return { ...s, todayDate: today, todayXp: 0, streak };
    });
  }, []);

  // 持久化
  useEffect(() => { saveLS(KEY, state); }, [state]);

  const pushEvent = (e: Omit<GameEvent, 'ts'>) => {
    eventsRef.current.push({ ...e, ts: Date.now() });
    if (eventsRef.current.length > 30) eventsRef.current = eventsRef.current.slice(-30);
  };

  const addResult = useCallback((articleId: string, _qid: string, pass: boolean, allPass: boolean) => {
    setState((s) => {
      const combo = pass ? s.combo + 1 : 0;
      const xp = xpForAnswer(pass, allPass, combo);
      const today = todayKey();
      // 当天首次作答 → 计入连续天数
      const streak = s.todayDate === today ? s.streak : (s.todayDate === '' ? 1 : (s.streak + 1));

      const before = levelProgress(s.xp);
      const after = levelProgress(s.xp + xp);

      const rec = s.levels[articleId] || { stars: 0, bestCombo: 0, total: 0, passed: 0 };
      const nextRec: LevelRecord = {
        stars: rec.stars,
        bestCombo: Math.max(rec.bestCombo, combo),
        total: rec.total + 1,
        passed: rec.passed + (pass ? 1 : 0),
      };

      const next: GameState = {
        ...s,
        xp: s.xp + xp,
        combo,
        bestCombo: Math.max(s.bestCombo, combo),
        todayXp: s.todayXp + xp,
        todayDate: today,
        streak,
        levels: { ...s.levels, [articleId]: nextRec },
      };

      // 事件: XP / 连击 / 升级
      pushEvent({ kind: 'xp', payload: { xp, combo } });
      if (combo >= 3) pushEvent({ kind: 'combo', payload: { combo } });
      if (after.level > before.level) pushEvent({ kind: 'levelup', payload: { level: after.level, title: after.title } });

      // 成就检测
      const unlocked = checkAchievements(next);
      if (unlocked.length) {
        next.achievements = Array.from(new Set([...next.achievements, ...unlocked]));
        unlocked.forEach((id) => pushEvent({ kind: 'achieve', payload: { achId: id } }));
      }
      return next;
    });
  }, []);

  const starsOf = useCallback((articleId: string) => {
    const rec = state.levels[articleId];
    return rec?.stars || 0;
  }, [state.levels]);

  const isUnlocked = useCallback((articleId: string, orderedIds: string[]) => {
    const idx = orderedIds.indexOf(articleId);
    if (idx <= 0) return true; // 第一篇或不在链中 → 已解锁
    // 上一篇必须已作答 (total>0 视为通关)
    const prev = orderedIds[idx - 1];
    const prevRec = state.levels[prev];
    return !!prevRec && prevRec.total > 0;
  }, [state.levels]);

  const hasAch = useCallback((id: string) => state.achievements.includes(id), [state.achievements]);

  const toggleSound = useCallback(() => setState((s) => ({ ...s, sound: !s.sound })), []);

  const drainEvents = useCallback(() => {
    const evts = eventsRef.current;
    eventsRef.current = [];
    return evts;
  }, []);

  const api = useMemo<GameApi>(() => ({
    state, addResult, starsOf, isUnlocked, hasAch, toggleSound, drainEvents,
  }), [state, addResult, starsOf, isUnlocked, hasAch, toggleSound, drainEvents]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

/** 成就目录引用 (供 UI 展示) */
export { ACHIEVEMENTS };
