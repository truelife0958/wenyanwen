/** 成就墙: 网格徽章, 已解锁金色发光, 未解锁灰 + 条件, 隐藏成就显示 ??? */
import { Link } from 'react-router-dom';
import { useGame, ACHIEVEMENTS } from './store';
import './game.css';

export default function Achievements() {
  const { state } = useGame();
  const unlockedCount = state.achievements.length;

  return (
    <div className="gx-sky view-enter">
      <div className="gx-ach-head">
        <h2>🏅 成就墙</h2>
        <span>{unlockedCount}/{ACHIEVEMENTS.length} 已解锁</span>
      </div>
      <Link to="/map" className="gx-cta" style={{ marginBottom: 14 }}>
        ← 返回闯关地图
      </Link>
      <div className="gx-ach-grid">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = state.achievements.includes(ach.id);
          const hidden = ach.hidden && !unlocked;
          return (
            <div key={ach.id} className={`gx-ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ic">{hidden ? '❓' : ach.icon}</div>
              <div className="nm">{hidden ? '？？？' : ach.name}</div>
              <div className="de">{hidden ? '神秘成就，继续闯关解锁' : ach.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
