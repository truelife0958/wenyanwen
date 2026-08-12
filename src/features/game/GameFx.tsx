/** 全局游戏特效层: 消费 Game Store 事件队列 → 飘字/连击横幅/升级/成就横幅/星光 */
import { useEffect, useRef, useState } from 'react';
import { useGame, ACHIEVEMENTS } from './store';

interface FxItem {
  id: number;
  kind: string;
  x: number; y: number;
  text?: string;
}

let uid = 0;

export default function GameFx() {
  const { drainEvents } = useGame();
  const [fx, setFx] = useState<FxItem[]>([]);
  const [banner, setBanner] = useState<{ kind: string; text?: string; sub?: string; icon?: string } | null>(null);
  const [starburst, setStarburst] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const iv = setInterval(() => {
      const evts = drainEvents();
      if (!evts.length) return;
      const now = Date.now();
      for (const e of evts) {
        // 忽略超过 2s 的旧事件
        if (now - e.ts > 2000) continue;
        if (e.kind === 'xp' && e.payload.xp) {
          const x = 60 + Math.random() * (window.innerWidth - 120);
          const y = 80 + Math.random() * (window.innerHeight * 0.3);
          const id = ++uid;
          setFx((f) => [...f, { id, kind: 'xp', x, y, text: `+${e.payload.xp}` }]);
          timers.current.push(window.setTimeout(() => setFx((f) => f.filter((i) => i.id !== id)), 1100));
        } else if (e.kind === 'combo') {
          setBanner({ kind: 'combo', text: `连击 ×${e.payload.combo}` });
          timers.current.push(window.setTimeout(() => setBanner(null), 950));
        } else if (e.kind === 'levelup') {
          setBanner({ kind: 'levelup', text: `升到 ${e.payload.level} 级`, sub: `· ${e.payload.title} ·` });
          setStarburst(true);
          timers.current.push(window.setTimeout(() => setBanner(null), 2100));
          timers.current.push(window.setTimeout(() => setStarburst(false), 900));
        } else if (e.kind === 'achieve' && e.payload.achId) {
          const ach = ACHIEVEMENTS.find((a) => a.id === e.payload.achId);
          if (ach) {
            setBanner({ kind: 'ach', text: ach.name, sub: ach.desc, icon: ach.icon });
            setStarburst(true);
            timers.current.push(window.setTimeout(() => setBanner(null), 2500));
            timers.current.push(window.setTimeout(() => setStarburst(false), 900));
          }
        }
      }
    }, 300);
    return () => {
      clearInterval(iv);
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, [drainEvents]);

  return (
    <>
      {fx.map((f) => (
        <div key={f.id} className="gx-xp-fly" style={{ left: f.x, top: f.y }}>{f.text}</div>
      ))}
      {starburst && <div className="gx-starburst" />}
      {banner && (
        <div className={banner.kind === 'combo' ? 'gx-combo-banner' : 'gx-levelup'}>
          {banner.kind === 'ach' && (
            <div className="gx-ach-banner" style={{ animation: 'none', position: 'relative' }}>
              <div className="ic">{banner.icon}</div>
              <div className="nm">🏆 {banner.text}</div>
              <div className="de">{banner.sub}</div>
            </div>
          )}
          {banner.kind === 'levelup' && (<><div className="big">{banner.text}</div><div className="sub">{banner.sub}</div></>)}
          {banner.kind === 'combo' && banner.text}
        </div>
      )}
    </>
  );
}
