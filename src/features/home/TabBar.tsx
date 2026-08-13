/** 底部 Tab 导航: 历练 / 闯关 / 成就 (移动优先, 宽屏居中) */
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '../../shared/ui/Icon';

const TABS = [
  { to: '/', label: '历练', icon: 'book' },
  { to: '/map', label: '闯关', icon: 'map' },
  { to: '/achievements', label: '成就', icon: 'trophy' },
] as const;

export default function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tab-bar" aria-label="主导航">
      {TABS.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            'tab-item' +
            (isActive || (tab.to === '/' && pathname.startsWith('/articles')) || (tab.to === '/map' && (pathname.startsWith('/moxie'))) ? ' active' : '')
          }
        >
          <Icon name={tab.icon} size={20} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
