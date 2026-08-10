/** 底部 Tab 导航: 学习 / 字词 / 图谱 (移动优先, 宽屏居中) */
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import Icon from '../../shared/ui/Icon';

const TABS = [
  { to: '/', label: '学习', icon: 'book' },
  { to: '/cards', label: '字词', icon: 'cards' },
  { to: '/map', label: '图谱', icon: 'map' },
] as const;

export default function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tab-bar" aria-label="主导航">
      {TABS.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end
          className={({ isActive }) => 'tab-item' + (isActive || (tab.to === '/' && pathname.startsWith('/articles')) ? ' active' : '')}
        >
          <Icon name={tab.icon} size={20} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
