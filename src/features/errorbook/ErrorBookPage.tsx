/** 错题本 — 独立页 (复习中心已移除, 错题本单独保留)。
 *  按篇目分组的错题回顾 + 薄弱考点入口 + 移除/清空。
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useErrorBook } from './store';
import { weakPointsFromErrors } from '../../data/exam-map';
import { useCore } from '../../data';
import EmptyState from '../../shared/ui/EmptyState';
import './errorbook.css';

export default function ErrorBookPage() {
  const { items, removeTitle, clear } = useErrorBook();
  const core = useCore();
  const [search, setSearch] = useState('');
  const questionById = core?.questionById;

  // E7: 统计题库已失效条目 (数据重建后原题不存在), 供顶部提示与列表标记
  const weakPoints = useMemo(() => weakPointsFromErrors(items), [items]);
  const staleCount = useMemo(() => (questionById ? items.filter((e) => e.qid && !questionById.get(e.qid)).length : 0), [items, questionById]);
  const query = search.trim().toLowerCase();
  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const entry of items) {
      if (query && !`${entry.title || ''} ${entry.stem || ''}`.toLowerCase().includes(query)) continue;
      const key = entry.title || entry.articleId || '未知篇目';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [items, query]);

  return (
    <div className="errorbook-page view-enter">
      <div className="errbook-top">
        <Link className="split-home" to="/">← 篇目中心</Link>
        <h2 className="errbook-title">错题本 · {items.length}</h2>
        {staleCount > 0 && <em className="errbook-stale">{staleCount} 条原题已更新</em>}
        {items.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>清空</button>
        )}
      </div>

      {/* 薄弱考点: 错题回炉入口 */}
      {weakPoints.length > 0 && (
        <div className="errbook-points">
          <span className="errbook-points-label">薄弱考点</span>
          {weakPoints.slice(0, 6).map((w) => (
            <Link key={w.name} to={`/map?p=${encodeURIComponent(w.name)}`} className="errbook-point">
              {w.name} <em>{w.count}</em>
            </Link>
          ))}
        </div>
      )}

      <div className="list-search-bar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索篇目或题干…"
          autoComplete="off"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState title="错题本空空如也" hint="做错的题会收进这里，方便回顾重练。练习时答错的题会自动入本。" />
      ) : groups.size === 0 ? (
        <EmptyState title="没有匹配的错题" compact />
      ) : (
        <div className="errbook-list">
          {[...groups.entries()].map(([title, entries]) => (
            <div className="errbook-group" key={title}>
              <div className="errbook-group-head">
                <span className="errbook-group-title">{title}</span>
                <span className="errbook-count">{entries.length}</span>
                <button type="button" className="errbook-del" aria-label={`移除${title}错题`} onClick={() => removeTitle(title)}>✕</button>
              </div>
              <ul className="errbook-items">
                {entries.map((entry) => (
                  <li className="errbook-item" key={entry.qid}>
                    <span className="errbook-stem">{entry.stem}</span>
                    {entry.qid && questionById && !questionById.get(entry.qid) && (
                      <em className="errbook-stale">原题已更新</em>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
