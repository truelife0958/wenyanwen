/**
 * HighlightText — 内容重难点标注渲染
 * - 对比行 "1. 原文：释义" → 左加粗 + 右常规 (突出对比)
 * - 引号/书名号内金句 → 高亮
 * - 普通行: 引号高亮 + pre-line
 * - numbered: 每行前加圈号 (名句默写等列表)
 */
import { Fragment } from 'react';

export default function HighlightText({ text, numbered = false }: { text: string; numbered?: boolean }) {
  const lines = String(text || '').split('\n');
  return (
    <span className="ht-wrap">
      {lines.map((line, li) => {
        if (!line.trim()) return <Fragment key={li}><br /></Fragment>;
        // 对比行: 数字序号 + 原文 + 冒号 + 释义
        const m = line.match(/^\s*(\d+[\.．、])\s*(.+?)[：:]\s*(.+)$/);
        if (m) {
          return (
            <span className="ht-row" key={li}>
              <span className="ht-no">{m[1].replace(/[\.．、]/, '')}</span>
              <b className="ht-left">{renderQuotes(m[2])}</b>
              <span className="ht-right">{renderQuotes(m[3])}</span>
            </span>
          );
        }
        return (
          <span className={`ht-line${numbered ? ' num' : ''}`} key={li}>
            {numbered && <i className="ht-dot" aria-hidden="true" />}
            {renderQuotes(line)}
          </span>
        );
      })}
    </span>
  );
}

/** 引号/书名号内文本 → 高亮 em (支持 “…” “…”《…》) */
function renderQuotes(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(“[^”]+”|"[^"]+"|《[^》]+》)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const q = match[0];
    parts.push(
      q.startsWith('《')
        ? <em className="ht-book" key={key++}>{q}</em>
        : <em className="ht-quote" key={key++}>{q}</em>,
    );
    last = match.index + q.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}
