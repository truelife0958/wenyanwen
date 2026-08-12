import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../shared/ui/Icon';
import './home.css';
import { GRADE_ORDER, groupByGrade, articleMeta, counts } from '../../data';
import type { ArticleMeta } from '../../data';
import { articleHref } from '../../data/article-links';
import EmptyState from '../../shared/ui/EmptyState';
import SectionHeader from '../../shared/ui/SectionHeader';
import { examLevel, examPoints } from '../../data/exam-tags';
import { loadLS, loadStreak } from '../../shared/lib/utils';
import { useErrorBook } from '../errorbook/store';
import HeroStats from '../game/HeroStats';
import '../game/game.css';

const LAST_ARTICLE_KEY = 'wyw_last_article';

/** 学习概览: 默写进度 + 默写错题 (进度直接读 localStorage, 不加载 moxie.json 全量数据) */
function useOverview() {
  const { items } = useErrorBook();
  return useMemo(() => {
    let prog: Record<string, { pass: boolean }> = {};
    try {
      const raw = localStorage.getItem('wyw_moxie_progress_v1');
      if (raw) prog = JSON.parse(raw);
    } catch { /* ignore */ }
    const doneCount = Object.keys(prog).length;
    const passedCount = Object.values(prog).filter((e) => e.pass).length;
    const moxieErrors = items.filter((e) => String(e.qid || '').startsWith('moxie'));
    return { doneCount, passedCount, errorCount: moxieErrors.length };
  }, [items]);
}

export default function Home() {
  const [search, setSearch] = useState('');
  // 搜索防抖: 高频输入不阻塞主线程 (E5)
  const deferredSearch = useDeferredValue(search);
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

  const moxieTotal = counts.moxieQuestions;
  const moxiePct = moxieTotal ? Math.round((overview.doneCount / moxieTotal) * 100) : 0;

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
      <HeroStats />
      {/* 今日学习头部 */}
      <section className="today-head" aria-label="今日学习">
        <div className="today-greet">
          <h2 className="today-title">今日学习</h2>
          <p className="today-sub">{new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'} · {loadStreak().count > 0 ? `🔥 已连续学习 ${loadStreak().count} 天` : '坚持就是胜利'}</p>
        </div>
        <div className="today-ring-wrap" aria-label="默写进度">
          <div className="today-ring">
            <svg viewBox="0 0 64 64" className="ring-svg">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#d9cdb8" strokeWidth="7" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--primary)" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - moxiePct / 100)}`}
                transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <span className="ring-text">{moxiePct}%</span>
          </div>
          <span className="ring-caption">默写进度</span>
        </div>
      </section>

      {/* 今日推荐 (主入口): 默写错题驱动优先, 无错题时继续学习 */}
      <section className="today-recommend" aria-label="今日推荐">
        {overview.errorCount > 0 ? (
          <Link to="/moxie/errors" className="rec-card rec-error">
            <span className="rec-icon" aria-hidden="true"><Icon name="pencil" size={20} /></span>
            <span className="rec-main">
              <span className="rec-label">默写错题回炉</span>
              <span className="rec-title">错题本 · {overview.errorCount} 题待复习</span>
              <span className="rec-sub">答错的默写题都在这里，重练巩固</span>
            </span>
            <span className="rec-go" aria-hidden="true">→</span>
          </Link>
        ) : (
        <Link to={lastArticle ? articleHref(lastArticle.target) : articleHref(articleMeta[0])} className="rec-card">
          <span className="rec-icon" aria-hidden="true"><Icon name="book" size={20} /></span>
          <span className="rec-main">
            <span className="rec-label">{lastArticle ? '继续上次学习' : '今日推荐'}</span>
            <span className="rec-title">{lastArticle ? lastArticle.target.title : articleMeta[0]?.title}</span>
            <span className="rec-sub">{lastArticle ? '点击继续学习' : '开始今天的学习'}</span>
          </span>
          <span className="rec-go" aria-hidden="true">→</span>
        </Link>
        )}
      </section>

      {/* 今日任务 */}
      <section className="today-tasks" aria-label="今日任务">
        <div className="task-item done"><Icon name="check" size={13} /> 默写 {overview.doneCount}/{moxieTotal} 题</div>
        <Link className="task-item task-link" to="/moxie"><span className="task-dot" /> 开始默写 →</Link>
      </section>
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

      {/* 篇目区 (始终显示) */}

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

function examOrder(title: string): number {
  const lvl = examLevel(title);
  return lvl === 'must' ? 0 : lvl === 'core' ? 1 : 2;
}
