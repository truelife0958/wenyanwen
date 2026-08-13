/** 首页英雄区: 等级徽章 + 经验条 + 数据行 + 继续闯关 CTA */
import { Link } from 'react-router-dom';
import { useGame } from './store';
import { levelProgress } from './xp';
import { loadStreak } from '../../shared/lib/utils';

export default function HeroStats() {
  const { state } = useGame();
  const prog = levelProgress(state.xp);
  const streak = state.streak || loadStreak().count;
  const totalDone = Object.values(state.levels).filter((r) => r.total > 0).length;
  const achCount = state.achievements.length;

  return (
    <section className="gx-hero" aria-label="历练等级">
      <div className="gx-hero-top">
        <div className="gx-level-badge">
          {prog.level}
          <span className="lv">LV.{prog.level}</span>
        </div>
        <div className="gx-hero-mid">
          <div className="gx-title">· {prog.title} ·</div>
          <div className="gx-sub">每次闯关都涨经验，越战越强</div>
          <div className="gx-xp-bar" role="progressbar" aria-valuenow={prog.cur} aria-valuemax={prog.need} aria-label="经验值">
            <div className="gx-xp-fill" style={{ width: `${Math.max(4, prog.pct)}%` }} />
          </div>
          <div className="gx-xp-label">
            <span>EXP {state.xp}</span>
            <span>{prog.cur}/{prog.need} · {prog.pct}%</span>
          </div>
        </div>
      </div>

      <div className="gx-stats">
        <div className="gx-stat"><b>🔥{streak}</b><span>连续天数</span></div>
        <div className="gx-stat"><b>⚡{state.todayXp}</b><span>今日经验</span></div>
        <div className="gx-stat"><b>🗺️{totalDone}</b><span>已通关</span></div>
        <div className="gx-stat"><b>🏅{achCount}</b><span>成就</span></div>
      </div>

      <Link className="gx-cta" to="/map">
        继续闯关
        <span className="arrow">➜</span>
      </Link>
    </section>
  );
}
