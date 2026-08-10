import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useErrorBook } from '../errorbook/store';
import { findMoxieArticle } from '../../data/moxie';
import EmptyState from '../../shared/ui/EmptyState';
import PageHeader from '../../shared/ui/PageHeader';
import './moxie.css';

/** 默写错题本: 仅收录 moxie: 前缀错题, 按篇目分组, 支持重练 */
export default function MoxieErrors() {
  const { items, removeEntry, removeTitle, clear } = useErrorBook();

  const moxieErrors = useMemo(
    () => items.filter((e) => String(e.qid || '').startsWith('moxie:')),
    [items],
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof moxieErrors>();
    for (const e of moxieErrors) {
      if (!map.has(e.title)) map.set(e.title, []);
      map.get(e.title)!.push(e);
    }
    return map;
  }, [moxieErrors]);

  const totalAnswers = moxieErrors.length;

  return (
    <div className="moxie-errors view-enter">
      <PageHeader
        backTo="/moxie"
        backLabel="← 返回默写列表"
        title="默写错题本"
        meta={`${totalAnswers} 条错题 · 按篇目分组`}
        right={
          totalAnswers > 0 ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => clear()}>清空</button>
          ) : undefined
        }
      />

      {totalAnswers === 0 ? (
        <EmptyState title="暂无默写错题" hint="默写练习中答错的题会自动收录到这里" />
      ) : (
        <div className="moxie-err-groups">
          {Array.from(groups.entries()).map(([title, list]) => {
            const moxie = findMoxieArticle(title);
            return (
              <section className="moxie-err-group" key={title}>
                <div className="meg-head">
                  <h3 className="meg-title">{title}</h3>
                  <span className="meg-count">{list.length} 题</span>
                  <div className="meg-actions">
                    {moxie && <Link className="btn btn-primary btn-sm" to={`/moxie/${encodeURIComponent(moxie.id)}`}>重练</Link>}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeTitle(title)}>移除整篇</button>
                  </div>
                </div>
                <div className="meg-list">
                  {list.map((e) => (
                    <div className="meg-item" key={e.qid}>
                      <div className="meg-type">{e.type}</div>
                      <div className="meg-stem">{e.stem}</div>
                      <div className="meg-answer">答案：{e.answer}</div>
                      <button type="button" className="meg-remove" onClick={() => removeEntry(title, e.qid)} aria-label="移除该错题">✕</button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
