/** 通用模块标题 — 统一"竖线 + 标题 + 可选副标题/右侧操作"的区块头。 */
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export default function SectionHeader({ title, sub, right, className }: SectionHeaderProps) {
  return (
    <div className={'section-header' + (className ? ` ${className}` : '')}>
      <div className="section-header-main">
        <h2 className="section-header-title">{title}</h2>
        {sub != null && <span className="section-header-sub">{sub}</span>}
      </div>
      {right != null && <div className="section-header-right">{right}</div>}
    </div>
  );
}
