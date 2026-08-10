import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../shared/ui/Icon';
import './home.css';
import { GRADE_ORDER, groupByGrade, articleMeta, counts } from '../../data';
import type { ArticleMeta } from '../../data';
import { articleHref } from '../../data/article-links';
import EmptyState from '../../shared/ui/EmptyState';
import SectionHeader from '../../shared/ui/SectionHeader';
import { examLevel, examPoints, examOrder } from '../../data/exam-tags';
import { loadLS, loadStreak } from '../../shared/lib/utils';
import { weakPointsFromErrors } from '../../data/exam-map';
import type { WeakPoint } from '../../data/exam-map';

const RECITE_HIST_KEY = 'wyw_recite_hist_v2';
const ERRORBOOK_KEY = 'wyw_errorbook_v2';
const LAST_ARTICLE_KEY = 'wyw_last_article';

/** 学习概览 */
function useOverview() {
  return useMemo(() => {
    const reciteHist = loadLS<Record<string, { lastPassTs: number; passCount: number }>>(RECITE_HIST_KEY, {});
    const reciteCount = Object.values(reciteHist).filter((entry) => entry && entry.passCount > 0).length;
    const rawErrors = loadLS<unknown>(ERRORBOOK_KEY, []);
    // 兼容两种存储格式: 数组 (store.tsx 现行) 与 { items: [] } (旧版)
    const errorItems: Array<{ qid?: string }> = Array.isArray(rawErrors)
      ? (rawErrors as Array<{ qid?: string }>)
      : Array.isArray((rawErrors as { items?: unknown })?.items)
        ? ((rawErrors as { items: Array<{ qid?: string }> }).items)
        : [];
    const weakPoints = weakPointsFromErrors(errorItems as Array<{ qid?: string }>);
    return {
      reciteCount,
      reciteTotal: counts.recite,
      errorCount: errorItems.length,
      weakPoints,
    };
  }, []);
}
export default function Home() {
  const [search, setSearch] = useState('');
  // 搜索防抖: 高频输入不阻塞主线程 (E5)
  const deferredSearch = useDeferredValue(search);
  const navigate = useNavigate();
  const overview = useOverview();
  const gridRef = useRef<HTMLDivElement>(null);

  /** 最近学习的文章 (继续学习横幅) */
  const lastArticle = useMemo(() => {
    try {
      const raw = loadLS<{ id: string; title: string; at: number } | null>(LAST_ARTICLE_KEY, null);
      if (!raw || !raw.id) return null;
      // 校验: 篇目必须仍存在
      const target = articleMeta.find((a) => a.id === raw.id || a.title === raw.title) as unknown as ArticleMeta | undefined;
      return target ? { ...raw, target } : null;
    } catch {
      return null;
    }
  }, []);

  const recitePct = overview.reciteTotal ? Math.round((overview.reciteCount / overview.reciteTotal) * 100) : 0;
  const coreWordCount = counts.globalWords;
  /** 搜索过滤 + 分类过滤 */
  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    let list: ArticleMeta[] = articleMeta;
    if (query) {
      list = list.filter((article) =>
        [article.title, article.author, article.dynasty]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }
    // 分类: all 显示全部, 其他标签点击时跳转对应页面
    // 排序: 中考必考(must) 置顶 → 核心重点(core) → 一般篇目(original order)
    return [...list].sort((a, b) => examOrder(a.title) - examOrder(b.title));
  }, [deferredSearch]);

  const groups = useMemo(() => groupByGrade(filtered), [filtered]);
  // 年级横向 tab: 默认选中第一个包含篇目的年级
  const availableGrades = useMemo(() => GRADE_ORDER.filter((g) => groups.has(g)), [groups]);
  const [activeGrade, setActiveGrade] = useState<string>('');
  // 选中年级 (搜索时跨年级显示, 否则按 tab 切换)
  const showGrade = deferredSearch.trim() ? '' : (activeGrade || availableGrades[0] || '');
  const displayGroups = useMemo<Map<string, ArticleMeta[]>>(() => {
    if (deferredSearch.trim()) return groups;
    if (!showGrade) return new Map();
    const items = groups.get(showGrade) || [];
    return new Map([[showGrade, items]]);
  }, [groups, showGrade, deferredSearch]);


  return (
    <div className="home view-enter">
      {/* 今日学习头部 */}
      <section className="today-head" aria-label="今日学习">
        <div className="today-greet">
          <h2 className="today-title">今日学习</h2>
          <p className="today-sub">{new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'} · {loadStreak().count > 0 ? `🔥 已连续学习 ${loadStreak().count} 天` : '坚持就是胜利'}</p>
        </div>
        <div className="today-ring" aria-label="学习进度">
          <svg viewBox="0 0 64 64" className="ring-svg">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#d9cdb8" strokeWidth="7" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="var(--primary)" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - recitePct / 100)}`}
              transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <span className="ring-text">{recitePct}%</span>
        </div>
      </section>

      {/* 今日推荐 (主入口): 错题驱动优先, 无错题时继续学习 (借鉴 ai-smartexam 驾驶舱主攻逻辑) */}
      <section className="today-recommend" aria-label="今日推荐">
        {overview.weakPoints.length > 0 ? (
          <Link to={`/map?p=${encodeURIComponent(overview.weakPoints[0].name)}`} className="rec-card rec-error">
            <span className="rec-icon" aria-hidden="true"><Icon name="pencil" size={20} /></span>
            <span className="rec-main">
              <span className="rec-label">错题回炉 · 薄弱考点</span>
              <span className="rec-title">{overview.weakPoints[0].name}</span>
              <span className="rec-sub">错 {overview.weakPoints[0].count} 题 · 同类重练巩固</span>
            </span>
            <span className="rec-go" aria-hidden="true">→</span>
          </Link>
        ) : (
        <Link to={lastArticle ? articleHref(lastArticle.target) : articleHref(articleMeta[0])} className="rec-card">
          <span className="rec-icon" aria-hidden="true"><Icon name="book" size={20} /></span>
          <span className="rec-main">
            <span className="rec-label">{lastArticle ? '继续上次学习' : '今日推荐'}</span>
            <span className="rec-title">{lastArticle ? lastArticle.target.title : articleMeta[0]?.title}</span>
            <span className="rec-sub">{lastArticle ? '已学 ' + Math.min(60, Math.floor(recitePct)) + '% · 点击继续' : '开始今天的学习'}</span>
          </span>
          <span className="rec-go" aria-hidden="true">→</span>
        </Link>
        )}
      </section>

      {/* 今日任务 */}
      <section className="today-tasks" aria-label="今日任务">
        <div className="task-item done"><Icon name="check" size={13} /> 背课文 {overview.reciteCount}/{overview.reciteTotal}</div>
        <div className="task-item done"><Icon name="check" size={13} /> 学字词 · 核心 {coreWordCount} 词</div>
        <div className="task-item"><span className="task-dot" /> 练 {overview.errorCount > 0 ? '错题 ' + overview.errorCount : '新题'}</div>
      </section>

      {/* 搜索栏 */}
      <div className="home-topbar">
        <div className="home-search-box">
          <span className="hsb-icon" aria-hidden="true"><Icon name="search" size={17} /></span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索篇目、作者、朝代..."
            maxLength={50}
            autoComplete="off"
            aria-label="搜索篇目"
          />
          {search && (
            <button type="button" className="hsb-clear" onClick={() => setSearch('')} aria-label="清空搜索">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 快捷功能 (错题本 — TabBar 未覆盖的入口) */}
      <section className="home-entry-grid" aria-label="快捷功能">
        <Link to="/errors" className="entry-card entry-errors">
          <span className="entry-icon" aria-hidden="true"><Icon name="pencil" size={26} /></span>
          <span className="entry-body">
            <span className="entry-label">错题本</span>
            <span className="entry-desc">回顾错题 · 查漏补缺</span>
          </span>
          <span className="entry-meta">
            <span className="entry-count"><b>{overview.errorCount}</b><em>条错题</em></span>
            <span className="entry-progress"><i style={{ width: `${Math.min(overview.errorCount * 6, 100)}%` }} /></span>
          </span>
        </Link>
      </section>

      {/* 篇目区 (始终显示) */}
      <div ref={gridRef}>
        <SectionHeader title={<>全部篇目 <em style={{fontWeight: 400, fontStyle: "normal", color: "var(--ink-light)", fontSize: "0.82rem"}}>· {articleMeta.length} 篇</em></>} />
        <>
          {/* 年级横向 tab */}
          {!deferredSearch.trim() && availableGrades.length > 0 && (
            <nav className="grade-tabs" aria-label="年级导航">
              {availableGrades.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`grade-tab${showGrade === g ? ' active' : ''}`}
                  onClick={() => setActiveGrade(g)}
                >
                  <span className="gt-name">{g}</span>
                  <span className="gt-count">{(groups.get(g) || []).length}</span>
                </button>
              ))}
            </nav>
          )}

          {/* 篇目卡片网格 */}
          {Array.from(displayGroups.entries()).map(([grade, items]) => (
            <div className="article-grid-section" key={grade || 'search'}>
              {deferredSearch.trim() && <div className="ags-title">{grade}（{items.length} 篇）</div>}
              <div className="article-grid stagger">
                {items.map((article) => {
                  const lvl = examLevel(article.title);
                  return (
                  <Link className={`article-card${lvl !== 'normal' ? ' exam-' + lvl : ''}`} key={article.id || article.title} to={articleHref(article)} title={examPoints(article.title).join('；')}>
                    {(lvl === 'must' || lvl === 'core') && (
                      <span className="ac-badge">{lvl === 'must' ? '中考必考' : '核心重点'}</span>
                    )}
                    <span className="ac-title">{article.title}</span>
                    <span className="ac-meta">{[article.dynasty, article.author].filter(Boolean).join(' · ') || '佚名'}</span>
                  </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && <EmptyState title="没有找到相关篇目" hint="换个关键词试试" compact />}
        </>
      </div>
    </div>
  );
}
