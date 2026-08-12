/** 闯关地图: 按年级分组, 蜿蜒关卡路径, 顺序解锁, 三星评定 */
import { Link } from 'react-router-dom';
import { moxieArticles } from '../../data/moxie';
import { GRADE_ORDER } from '../../data';
import { useGame } from './store';
import { starsFor } from './xp';
import './game.css';

export default function LevelMap() {
  const { state, isUnlocked } = useGame();

  // 按年级分组 (排除附录综合套卷 — 它们不是单篇关卡), 保持 GRADE_ORDER 顺序
  const groups = new Map<string, typeof moxieArticles>();
  for (const a of moxieArticles) {
    if (a.grade === '附录') continue;
    if (!groups.has(a.grade)) groups.set(a.grade, []);
    groups.get(a.grade)!.push(a);
  }
  const grades = GRADE_ORDER.filter((g) => groups.has(g));
  const totalLevels = grades.reduce((t, g) => t + (groups.get(g)?.length || 0), 0);

  // 统一关卡 key: 与 MoxieArticle.addResult 的 key 一致 (articleId 优先)
  const levelKey = (a: { articleId: string | null; id: string; title: string }) =>
    a.articleId || a.id || a.title;

  // 全局关卡编号
  let globalIdx = 0;

  return (
    <div className="gx-sky gx-map view-enter">
      <div className="gx-ach-head">
        <h2>🗺️ 闯关地图</h2>
        <span>{Object.values(state.levels).filter((r) => r.total > 0).length}/{totalLevels} 篇已通关</span>
      </div>
      <Link to="/achievements" className="gx-cta" style={{ marginBottom: 18 }}>
        🏅 我的成就
        <span className="arrow">➜</span>
      </Link>

      {grades.map((grade) => {
        const arts = groups.get(grade)!;
        const done = arts.filter((a) => state.levels[a.id]?.total > 0).length;
        return (
          <div className="gx-world" key={grade}>
            <div className="gx-world-title">
              {grade}
              <span className="gx-world-progress">{done}/{arts.length}</span>
            </div>
            <div className="gx-world-sub">通关本篇解锁下一篇，全通本年级开启下一世界</div>
            <div className="gx-path">
              {arts.map((article) => {
                globalIdx += 1;
                const key = levelKey(article);
                const rec = state.levels[key];
                const total = article.sections.reduce((t, s) => t + (s.items?.length || 0), 0);
                const stars = rec ? starsFor(rec.passed, Math.max(rec.total, 1)) : 0;
                const passed = !!rec && rec.total > 0;
                const unlocked = isUnlocked(key, arts.map(levelKey));
                const cls = passed ? 'done' : unlocked ? 'playable' : 'locked';
                return (
                  <div className="gx-level-row" key={article.id}>
                    {passed ? (
                      <Link to={`/moxie/${encodeURIComponent(article.id)}`} className={`gx-node ${cls}`} aria-label={article.title}>
                        {globalIdx}
                        {stars > 0 && <span className="stars">{'★'.repeat(stars)}</span>}
                      </Link>
                    ) : unlocked ? (
                      <Link to={`/moxie/${encodeURIComponent(article.id)}`} className={`gx-node ${cls}`} aria-label={article.title}>
                        {globalIdx}
                      </Link>
                    ) : (
                      <span className={`gx-node ${cls}`} aria-label={`${article.title} 未解锁`}>
                        <span className="lock">🔒</span>
                      </span>
                    )}
                    <div className="gx-level-info">
                      <div className="gx-level-name">{article.title}</div>
                      <div className="gx-level-meta">
                        {total} 题{rec && rec.bestCombo >= 3 ? ` · 最佳连击 ${rec.bestCombo}` : ''}
                      </div>
                    </div>
                    <span className={`gx-level-tag${passed ? ' done' : ''}`}>
                      {passed ? `${stars}★` : unlocked ? '挑战' : '未解锁'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
