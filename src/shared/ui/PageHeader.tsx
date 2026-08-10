/** 通用页面头部: 面包屑(可选) + 标题 + 徽章 + 元信息 + 右侧操作区 */
import { Link } from 'react-router-dom';

export default function PageHeader({
  backTo,
  backLabel = '← 返回',
  title,
  badge,
  meta,
  right,
  className = '',
}: {
  backTo?: string;
  backLabel?: string;
  title: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`page-header${className ? ' ' + className : ''}`}>
      {backTo && (
        <div className="page-header-back">
          <Link to={backTo}>{backLabel}</Link>
        </div>
      )}
      <div className="page-header-main">
        <h2 className="page-title">
          {title}
          {badge}
        </h2>
        {meta && <p className="page-header-meta">{meta}</p>}
      </div>
      {right && <div className="page-header-right">{right}</div>}
    </header>
  );
}
