/** 闯关地图 (主页): 横版卷轴世界地图 — 世界(年级)横向并排可滚动, 世界内蜿蜒路径,
 *  玩家Token定位当前位置, 路径流动光效, 按状态分流 (未通关→历练 / 已通关→默诵)。 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { moxieArticles } from '../../data/moxie';
import { GRADE_ORDER } from '../../data';
import { useGame } from './store';
import { starsFor } from './xp';
import { g } from '../../shared/lib/game-terms';
import './game.css';

// 画布布局常量 (横版世界列)
const NODE = 58;      // 节点直径 px
const GAP = 96;       // 纵向间距 px
const TOP = 34;       // 首节点中心偏移 px
const X_LEFT = 24;    // 左列 x 百分比
const X_RIGHT = 74;   // 右列 x 百分比

const GRADE_ICONS: Record<string, string> = {
  '七上': '🌱', '七下': '🌿', '八上': '🎋', '八下': '🍃', '九上': '🍁', '九下': '❄️',
};

type LevelKeyFn = (a: { articleId: string | null; id: string; title: string }) => string;

/** 单个世界 (年级): 世界头 + 纵向蜿蜒路径画布 */
function LevelWorld({
  grade, articles, startIdx, levelKey, state, isUnlocked, playerKey,
}: {
  grade: string;
  articles: typeof moxieArticles;
  startIdx: number;
  levelKey: LevelKeyFn;
  state: ReturnType<typeof useGame>['state'];
  isUnlocked: (key: string, keys: string[]) => boolean;
  playerKey: string | null;
}) {
  const count = articles.length;
  const H = TOP + (count - 1) * GAP + NODE / 2 + 20;
  const keys = articles.map(levelKey);

  // 节点中心坐标: x 百分比, y 像素
  const pos = articles.map((_, i) => ({
    x: i % 2 === 0 ? X_LEFT : X_RIGHT,
    y: TOP + i * GAP,
  }));

  // SVG 蜿蜒路径: 三次贝塞尔 (控制点水平外伸, 管道式弯弧)
  const pathD = articles.slice(0, -1).map((_, i) => {
    const p = pos[i];
    const n = pos[i + 1];
    const bend = 12;
    return `M ${p.x} ${p.y} C ${p.x + bend} ${p.y}, ${n.x - bend} ${n.y}, ${n.x} ${n.y}`;
  }).join(' ');

  const done = articles.filter((a) => state.levels[levelKey(a)]?.total > 0).length;

  return (
    <div className="gx-world-col">
      <div className="gx-world-head">
        <span className="gx-world-icon" aria-hidden="true">{GRADE_ICONS[grade] || '🗺️'}</span>
        <div className="gx-world-titles">
          <div className="gx-world-title">{grade}</div>
          <div className="gx-world-sub">全通本世界开启下一世界</div>
        </div>
        <div className="gx-world-prog">
          <span className="gx-world-progress">{done}/{count}</span>
          <div className="gx-progress-track"><div className="gx-progress-fill" style={{ width: `${count ? (done / count) * 100 : 0}%` }} /></div>
        </div>
      </div>
      <div className="gx-canvas" style={{ height: H }}>
        <svg className="gx-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={pathD} className="gx-path-glow" vectorEffect="non-scaling-stroke" fill="none" />
          <path d={pathD} className="gx-path-main" vectorEffect="non-scaling-stroke" fill="none" />
          <path d={pathD} className="gx-path-flow" vectorEffect="non-scaling-stroke" fill="none" />
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
          const isPlayer = playerKey === key;
          return (
            <div className="gx-node-wrap" key={article.id} style={{ left: `${p.x}%`, top: p.y }}>
              {isPlayer && <span className="gx-player-token" aria-label="玩家当前位置"><i className="gx-token-flag" /></span>}
              {passed || unlocked ? (
                <Link
                  to={`/articles/${encodeURIComponent(article.articleId || article.id)}/${passed ? 'moxie' : 'learn'}`}
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
              <span className={`gx-node-label${passed ? ' done' : ''}`} title={g(article.title)}>{g(article.title)}</span>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // 按年级分组 (排除附录综合套卷)
  const groups = new Map<string, typeof moxieArticles>();
  for (const a of moxieArticles) {
    if (a.grade === '附录') continue;
    if (!groups.has(a.grade)) groups.set(a.grade, []);
    groups.get(a.grade)!.push(a);
  }
  const grades = GRADE_ORDER.filter((g) => groups.has(g));
  const totalLevels = grades.reduce((t, g) => t + (groups.get(g)?.length || 0), 0);

  // 统一关卡 key: 与 MoxieTrainer.addResult 一致 (articleId 优先)
  const levelKey: LevelKeyFn = (a) => a.articleId || a.id || a.title;

  // 玩家位置: 第一个未通关已解锁关卡 (兜底最后一个通关)
  let playerWorldIdx = 0;
  let playerKey: string | null = null;
  outer: for (let gi = 0; gi < grades.length; gi++) {
    const arts = groups.get(grades[gi])!;
    const keys = arts.map(levelKey);
    for (let i = 0; i < arts.length; i++) {
      const key = keys[i];
      const rec = state.levels[key];
      const passed = !!rec && rec.total > 0;
      const unlocked = isUnlocked(key, keys);
      if (!passed && unlocked) { playerWorldIdx = gi; playerKey = key; break outer; }
      if (passed) { playerWorldIdx = gi; playerKey = key; }
    }
  }

  // 挂载时平滑滚动到玩家所在世界
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cols = el.querySelectorAll<HTMLElement>('.gx-world-col');
    const target = cols[playerWorldIdx];
    if (target) el.scrollTo({ left: target.offsetLeft - 40, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let acc = 0;

  return (
    <div className="gx-sky gx-map view-enter">
      <div className="gx-ach-head">
        <h2>🗺️ 闯关地图</h2>
        <span>{Object.values(state.levels).filter((r) => r.total > 0).length}/{totalLevels} 篇已通关</span>
      </div>
      <Link to="/achievements" className="gx-cta" style={{ marginBottom: 16 }}>
        🏅 我的成就
        <span className="arrow">➜</span>
      </Link>

      {/* 世界导航条 */}
      <div className="gx-world-nav" aria-label="世界导航">
        {grades.map((grade, gi) => (
          <button
            key={grade}
            type="button"
            className={`gx-nav-btn${gi === playerWorldIdx ? ' here' : ''}`}
            onClick={() => {
              const el = scrollRef.current;
              const target = el?.querySelectorAll<HTMLElement>('.gx-world-col')[gi];
              if (target) el?.scrollTo({ left: target.offsetLeft - 40, behavior: 'smooth' });
            }}
          >
            {GRADE_ICONS[grade] || '🗺️'} {grade}
          </button>
        ))}
      </div>

      {/* 横版卷轴轨道 */}
      <div className="gx-map-h" ref={scrollRef}>
        <div className="gx-world-track">
          {grades.map((grade, gi) => {
            const arts = groups.get(grade)!;
            return (
              <div className="gx-world-slot" key={grade}>
                <LevelWorld
                  grade={grade}
                  articles={arts}
                  startIdx={acc}
                  levelKey={levelKey}
                  state={state}
                  isUnlocked={isUnlocked}
                  playerKey={playerKey}
                />
                {gi < grades.length - 1 && <div className="gx-world-bridge" aria-hidden="true">➜</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
