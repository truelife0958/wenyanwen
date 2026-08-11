/** 底部 Tab 导航: 学习 / 默写 (移动优先, 宽屏居中) */
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '../../shared/ui/Icon';

const TABS = [
  { to: '/', label: '学习', icon: 'book' },
  { to: '/moxie', label: '默写', icon: 'pencil' },
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
