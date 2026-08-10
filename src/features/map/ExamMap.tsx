/** 考点图谱 — 从统一题库聚合考点, 按分类分组展示, 点考点弹窗做题。
 *  借鉴: 研途考点图谱 (命题点→高频过滤→频次徽章) + 智考真题实验室 (薄弱考点/错题回炉闭环)。
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../shared/ui/PageHeader';
import { SessionView } from '../practice/PracticePage';
import { useErrorBook } from '../errorbook/store';
import {
  getExamPoints,
  pointArticle,
  pointOf,
  weakPointsFromErrors,
  groupPointsByCategory,
  type ExamPoint,
} from '../../data/exam-map';
import { useCore } from '../../data';
import Modal from '../../shared/ui/Modal';
import EmptyState from '../../shared/ui/EmptyState';
import './exam-map.css';

const TYPE_LABEL: Record<string, string> = {
  blank: '填空',
  choice: '选择',
  discuss: '讨论',
  explain: '解释',
  passage: '阅读',
  punctuate: '断句',
  short: '简答',
  translate: '翻译',
  gloss: '字词',
  punct: '断句',
  understand: '理解',
  open: '开放',
};

/** 考点卡片的元信息摘要 (借鉴 ai-smartexam TagStat 的摘要行: 命中/真题/年份) */
function PointMeta({ point }: { point: ExamPoint }) {
  const parts: string[] = [];
  if (point.zhentiCount > 0) parts.push(`${point.zhentiCount} 道真题`);
  if (point.years.length > 0) parts.push(`${point.years[0]}${point.years.length > 1 ? '…' : ''} 年`);
  if (point.articleTitles.length > 0) parts.push(`${point.articleTitles.length} 篇`);
  return <>{parts.join(' · ') || '综合题集'}</>;
}

export default function ExamMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: errorItems } = useErrorBook();
  const core = useCore();
  const [filter, setFilter] = useState<'all' | 'hot'>('all');
  // 弹窗考点: 支持 ?p=考点名 直达 (首页薄弱考点 / 复习中心入口)
  const [selectedName, setSelectedName] = useState<string>(searchParams.get('p') || '');
  const selected = selectedName ? pointOf(selectedName) : undefined;

  const weakPoints = useMemo(() => weakPointsFromErrors(errorItems), [errorItems]);

  const points = core ? getExamPoints() : [];
  const rows = useMemo(() => {
    const list = filter === 'hot' ? points.filter((p) => p.hot) : points;
    // 薄弱考点提升到最前 (错题优先回炉)
    const weakNames = new Set(weakPoints.map((w) => w.name));
    return [...list].sort((a, b) => {
      const aw = weakNames.has(a.name) ? 1 : 0;
      const bw = weakNames.has(b.name) ? 1 : 0;
      return bw - aw || Number(b.hot) - Number(a.hot) || b.count - a.count;
    });
  }, [filter, weakPoints, points]);

  // 按分类分组
  const categories = useMemo(() => groupPointsByCategory(rows), [rows]);
  const totalQuestions = useMemo(() => points.reduce((s, p) => s + p.count, 0), [points]);
  const zhentiTotal = useMemo(() => points.reduce((s, p) => s + p.zhentiCount, 0), [points]);
  const examPointCount = points.length;
  const hotPointCount = points.filter((p) => p.hot).length;

  const select = (name: string) => {
    setSelectedName(name);
    setSearchParams(name ? { p: name } : {});
  };

  if (!core) return <div className="page-loader">加载中...</div>;

  return (
    <div className="exam-map view-enter">
      <PageHeader
        backTo="/"
        title="考点图谱"
        badge={<span className="map-badge">{examPointCount} 考点</span>}
        meta={`${hotPointCount} 高频 · ${totalQuestions} 题 · ${zhentiTotal} 道真题`}
      />

      {/* 薄弱考点: 错题回炉优先 (借鉴 ai-smartexam 薄弱考点 + 错题回炉路径) */}
      {weakPoints.length > 0 && (
        <section className="map-weak" aria-label="薄弱考点">
          <div className="map-section-head">
            <span className="map-section-title">薄弱考点 · 错题回炉</span>
            <span className="map-section-sub">错 {errorItems.length} 题 · 优先重练</span>
          </div>
          <div className="map-weak-grid">
            {weakPoints.slice(0, 6).map((w) => (
              <button
                type="button"
                key={w.name}
                className={'map-card map-card-weak' + (selectedName === w.name ? ' active' : '')}
                onClick={() => select(w.name)}
              >
                <span className="map-card-name">{w.name}</span>
                <span className="map-card-count">{w.count}<em>错</em></span>
                <span className="map-card-go">回炉 →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 高频过滤切换 (借鉴研途: 全部考点 / 只看高频) */}
      <div className="map-toolbar">
        <div className="map-filter">
          <button type="button" className={'map-filter-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
            全部考点
          </button>
          <button type="button" className={'map-filter-btn' + (filter === 'hot' ? ' active' : '')} onClick={() => setFilter('hot')}>
            只看高频 <em>{hotPointCount}</em>
          </button>
        </div>
        <span className="map-toolbar-meta">按分类浏览 · 高频优先</span>
      </div>

      {/* 分类分组: 每个分类一个区块 */}
      {categories.map((cat) => (
        <section className="map-category" key={cat.name}>
          <div className="map-cat-head">
            <span className="map-cat-name">{cat.name}</span>
            <span className="map-cat-meta">{cat.points.length} 个考点 · {cat.points.reduce((s, p) => s + p.count, 0)} 题</span>
          </div>
          <div className="map-grid">
            {cat.points.map((point) => {
              const isWeak = weakPoints.some((w) => w.name === point.name);
              return (
                <button
                  type="button"
                  key={point.name}
                  className={'map-card' + (point.hot ? ' map-card-hot' : '') + (point.level === 'must' ? ' map-card-must' : '') + (isWeak ? ' map-card-weak' : '') + (selectedName === point.name ? ' active' : '')}
                  onClick={() => select(point.name)}
                  title={point.articleTitles.slice(0, 8).join('、')}
                >
                  <span className="map-card-top">
                    <span className="map-card-name">{point.name}</span>
                    {point.hot && <span className="map-chip-hot">高频</span>}
                    {point.level === 'must' && <span className="map-chip-must">必考</span>}
                    {isWeak && <span className="map-chip-weak">薄弱</span>}
                  </span>
                  <span className="map-card-meta">
                    <b>{point.count}</b> 题 · <PointMeta point={point} />
                  </span>
                  {point.types.length > 0 && (
                    <span className="map-card-types">
                      {point.types.slice(0, 3).map((t) => TYPE_LABEL[t] || t).join(' / ')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {rows.length === 0 && <EmptyState title="没有匹配的考点" compact />}

      {/* 考点弹窗: 点卡片弹出做题 (不再页面底部展开) */}
      <Modal open={!!selected} onClose={() => select('')} overlayClassName="map-modal" boxClassName="map-modal-box" ariaLabel="考点练习">
        {selected && (<>
            <div className="inline-modal-head">
              <span className="map-modal-title">
                {selected.name}
                <em className="map-modal-meta">{selected.count} 题</em>
              </span>
              <button className="inline-modal-close" onClick={() => select('')} aria-label="关闭考点">✕</button>
            </div>
            <div className="inline-modal-body">
              {selected.count > 0 ? (
                <SessionView article={pointArticle(selected.name)} onExit={() => select('')} embedded errorHref="/errors" />
              ) : (
                <EmptyState title="该考点暂无题目" hint="试试其他考点。" compact />
              )}
            </div>
        </>)}
      </Modal>
    </div>
  );
}
