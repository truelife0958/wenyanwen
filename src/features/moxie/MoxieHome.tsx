import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { moxieArticles, moxieCount, articleProgress, loadMoxieProgress } from '../../data/moxie';
import { GRADE_ORDER } from '../../data';
import SectionHeader from '../../shared/ui/SectionHeader';
import EmptyState from '../../shared/ui/EmptyState';
import { g } from '../../shared/lib/game-terms';
import './moxie.css';

/** 默诵模块首页: 统计 + 年级 tab + 篇目网格 */
export default function MoxieHome() {
  const [activeGrade, setActiveGrade] = useState('');

  const groups = useMemo(() => {
    const map = new Map<string, typeof moxieArticles>();
    for (const a of moxieArticles) {
      if (!map.has(a.grade)) map.set(a.grade, []);
      map.get(a.grade)!.push(a);
    }
    return map;
  }, []);

  const progress = useMemo(() => loadMoxieProgress(), []);
  const passedCount = Object.values(progress).filter((e) => e.pass).length;
  const doneCount = Object.values(progress).length;
  const totalItems = useMemo(() => moxieArticles.reduce((t, a) => t + a.sections.reduce((x, s) => x + (s.items?.length || 0), 0), 0), []);

  const availableGrades = GRADE_ORDER.filter((g) => groups.has(g));
  const showGrade = activeGrade || availableGrades[0] || '';
  const display = groups.get(showGrade) || [];

  return (
    <div className="moxie view-enter">
      {/* 统计头部 */}
      <section className="moxie-head" aria-label="默诵统计">
        <div className="moxie-head-main">
          <h2 className="moxie-title">默诵</h2>
          <p className="moxie-sub">原文 · 理解 · 词义 · 译文，四种默诵步步通关</p>
        </div>
        <div className="moxie-ring-wrap" aria-label="默诵总进度">
          <div className="moxie-ring">
            <svg viewBox="0 0 64 64" className="ring-svg">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#d9cdb8" strokeWidth="7" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent-brown)" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - (totalItems ? doneCount / totalItems : 0))}`}
                transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <span className="ring-text">{totalItems ? Math.round((doneCount / totalItems) * 100) : 0}%</span>
          </div>
          <span className="ring-caption">总进度</span>
        </div>
      </section>

      {/* 统计条 */}
      <div className="moxie-stats">
        <div className="moxie-stat"><b>{moxieCount}</b><em>篇目</em></div>
        <div className="moxie-stat"><b>{totalItems}</b><em>道题</em></div>
        <div className="moxie-stat"><b>{doneCount}</b><em>已作答</em></div>
        <div className="moxie-stat ok"><b>{passedCount}</b><em>全对</em></div>
      </div>

      {/* 年级 tab */}
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

      {/* 篇目网格 */}
      <div className="article-grid-section">
        <SectionHeader title={<>默诵篇目 <em style={{ fontWeight: 400, fontStyle: 'normal', color: 'var(--ink-light)', fontSize: '0.82rem' }}>· {display.length} 篇</em></>} />
        {display.length ? (
          <div className="article-grid stagger">
            {display.map((article) => {
              const p = articleProgress(article);
              const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
              const allPass = p.done > 0 && p.done === p.passed;
              return (
                <Link key={article.id} to={`/moxie/${encodeURIComponent(article.id)}`} className="article-card moxie-card">
                  <span className="ac-title">{g(article.title)}</span>
                  <span className="ac-meta">默诵 {p.total} 题 · {pct}%</span>
                  <span className="moxie-card-bar" aria-hidden="true">
                    <i style={{ width: `${pct}%`, background: allPass ? "var(--success)" : "var(--accent-brown)" }} />
                  </span>
                  {allPass && <span className="ac-badge moxie-done">已通关</span>}
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="该年级暂无默诵篇目" hint="数据抽取中，稍后再试" compact />
        )}
      </div>
    </div>
  );
}
