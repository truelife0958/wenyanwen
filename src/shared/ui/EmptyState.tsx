/** 通用空态 — 柔和居中的空状态提示 (图标/标题/说明/可选操作)。 */
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  /** 附加类 (兼容既有空态样式) */
  className?: string;
  compact?: boolean;
}

export default function EmptyState({ icon, title, hint, children, className, compact }: EmptyStateProps) {
  return (
    <div className={'empty-state' + (compact ? ' empty-state-compact' : '') + (className ? ` ${className}` : '')}>
      {icon != null && <div className="empty-state-icon">{icon}</div>}
      {title != null && <p className="empty-state-title">{title}</p>}
      {hint != null && <p className="empty-state-hint">{hint}</p>}
      {children}
    </div>
  );
}
