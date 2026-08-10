/** 通用弹窗基座 — Esc 关闭 / 遮罩点击关闭 / 居中浮动。
 *  样式类可透传: overlayClassName / boxClassName 用于兼容各页面既有样式。 */
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 遮罩附加类 (兼容既有 modal 样式, 如 vocab-modal) */
  overlayClassName?: string;
  /** 内容框附加类 (如 vocab-modal-box) */
  boxClassName?: string;
  ariaLabel?: string;
}

export default function Modal({ open, onClose, children, overlayClassName, boxClassName, ariaLabel = '弹窗' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={'modal-overlay' + (overlayClassName ? ` ${overlayClassName}` : '')} onClick={onClose} role="dialog" aria-label={ariaLabel}>
      <div className={'modal-box' + (boxClassName ? ` ${boxClassName}` : '')} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
