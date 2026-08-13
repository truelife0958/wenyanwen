/** 闯关地图 (主页): 画布式 S 形关卡路径 — 星空画布 + 金色蜿蜒路径, 按年级分世界。
 *  节点绝对定位(百分比+像素), 相邻节点用 SVG 二次贝塞尔曲线连接, 顺序解锁/三星评定。 */
import { Link } from 'react-router-dom';
import { moxieArticles } from '../../data/moxie';
import { GRADE_ORDER } from '../../data';
import { useGame } from './store';
import { starsFor } from './xp';
import { g } from '../../shared/lib/game-terms';
import './game.css';

// 画布布局常量
const NODE = 58;      // 节点直径 px
const GAP = 124;      // 纵向间距 px
const TOP = 30;       // 首节点中心偏移 px
const X_LEFT = 15;    // 左列 x 百分比
const X_RIGHT = 60;   // 右列 x 百分比

type LevelKeyFn = (a: { articleId: string | null; id: string; title: string }) => string;

/** 单个世界 (年级): 星空画布 + 金色蜿蜒路径 + S 形关卡节点 */
function LevelWorld({
  grade, articles, startIdx, levelKey, state, isUnlocked,
}: {
  grade: string;
  articles: typeof moxieArticles;
  startIdx: number;
  levelKey: LevelKeyFn;
  state: ReturnType<typeof useGame>['state'];
  isUnlocked: (key: string, keys: string[]) => boolean;
}) {
  const count = articles.length;
  const H = TOP + (count - 1) * GAP + NODE / 2 + 16;
  const keys = articles.map(levelKey);

  // 节点中心坐标: x 百分比, y 像素
  const pos = articles.map((_, i) => ({
    x: i % 2 === 0 ? X_LEFT : X_RIGHT,
    y: TOP + i * GAP,
  }));

  // SVG 蜿蜒路径: 二次贝塞尔连接相邻节点中心 (控制点 = 中点)
  // SVG 蜿蜒路径: 三次贝塞尔 (控制点沿出发方向水平外伸, 形成管道式弯弧)
  const pathD = articles.slice(0, -1).map((_, i) => {
    const p = pos[i];
    const n = pos[i + 1];
    const bend = 15; // 控制点水平外伸量 (百分比)
    return `M ${p.x} ${p.y} C ${p.x + bend} ${p.y}, ${n.x - bend} ${n.y}, ${n.x} ${n.y}`;
  }).join(' ');

  const done = articles.filter((a) => state.levels[levelKey(a)]?.total > 0).length;

  return (
    <div className="gx-world-card">
      <div className="gx-world-head">
        <span className="gx-world-icon" aria-hidden="true">🗺️</span>
        <div className="gx-world-titles">
          <div className="gx-world-title">{grade}</div>
          <div className="gx-world-sub">通关本篇解锁下一篇 · 全通本世界开启下一世界</div>
        </div>
        <span className="gx-world-progress">{done}/{count}</span>
      </div>
      <div className="gx-canvas" style={{ height: H }}>
        <svg className="gx-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={pathD} className="gx-path-glow" vectorEffect="non-scaling-stroke" fill="none" />
          <path d={pathD} className="gx-path-main" vectorEffect="non-scaling-stroke" fill="none" />
        </svg>
        {articles.map((article, i) => {
          const globalIdx = startIdx + i + 1;
          const key = levelKey(article);
          const rec = state.levels[key];
          const total = article.sections.reduce((t, s) => t + (s.items?.length || 0), 0);
          const stars = rec ? starsFor(rec.passed, Math.max(rec.total, 1)) : 0;
          const passed = !!rec && rec.total > 0;
          const unlocked = isUnlocked(key, keys);
          const cls = passed ? 'done' : unlocked ? 'playable' : 'locked';
          const p = pos[i];
          return (
            <div className="gx-node-wrap" key={article.id} style={{ left: `${p.x}%`, top: p.y }}>
              {passed || unlocked ? (
                <Link
                  to={`/articles/${encodeURIComponent(article.articleId || article.id)}/moxie`}
                  className={`gx-node ${cls}`}
                  aria-label={g(article.title)}
                >
                  {globalIdx}
                  {passed && stars > 0 && <span className="stars">{'★'.repeat(stars)}</span>}
                </Link>
              ) : (
                <span className={`gx-node ${cls}`} aria-label={`${g(article.title)} 未解锁`}>
                  <span className="lock">🔒</span>
                </span>
              )}
              <span className={`gx-node-label${passed ? ' done' : ''}`}>{g(article.title)}</span>
              <span className="gx-node-count">{total} 题</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  // 统一关卡 key: 与 MoxieTrainer.addResult 的 key 一致 (articleId 优先)
  const levelKey: LevelKeyFn = (a) => a.articleId || a.id || a.title;

  // 全局关卡编号累加
  let acc = 0;

  return (
    <div className="gx-sky gx-map view-enter">
      <div className="gx-ach-head">
        <h2>🗺️ 闯关地图</h2>
        <span>{Object.values(state.levels).filter((r) => r.total > 0).length}/{totalLevels} 篇已通关</span>
      </div>
      <Link to="/achievements" className="gx-cta" style={{ marginBottom: 20 }}>
        🏅 我的成就
        <span className="arrow">➜</span>
      </Link>

      {grades.map((grade) => {
        const arts = groups.get(grade)!;
        const world = (
          <LevelWorld
            key={grade}
            grade={grade}
            articles={arts}
            startIdx={acc}
            levelKey={levelKey}
            state={state}
            isUnlocked={isUnlocked}
          />
        );
        acc += arts.length;
        return world;
      })}
    </div>
  );
}
