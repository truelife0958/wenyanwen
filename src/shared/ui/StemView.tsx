/**
 * 题干结构化渲染 — 把数据中的题面(含 markdown 表格/知识卡片/方法提示/加点词/编号小题)
 * 排版为清晰美观的结构:
 *  - markdown 表格  → <table>
 *  - > 引用(知识卡片) → 卡片浮层
 *  - 【课外迁移】等行首标签 → 章节徽章
 *  - (方法提示:...) → 方法提示徽章
 *  - 【x】/〔x〕(≤2字) → 加点字强调(下点线)
 *  - 其余文本 → 保留换行的正文
 */
import { useMemo } from 'react';

type Block =
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'quote'; lines: string[] }
  | { type: 'text'; line: string };

export function parseStem(text: string): Block[] {
  const rawLines = String(text || '').split('\n');
  // 预处理: 识别行内嵌 markdown 表格 (含 :--- 分隔行) 或伪表格 (文言词句|方法提示|解释) 拆为表格行;
  // 再拆同一行内的连续编号小题 (1)...(2)...或1. 2. 成独立行
  const lines: string[] = [];
  const splitInlineTable = (line: string): string[] => {
    const hasSep = /:\s*-{1,}\s*\|/.test(line) || /\|\s*-{1,}:?/.test(line);
    const hasPipe = (line.match(/\|/g) || []).length >= 4;
    // 伪表格: 导语+文言词句|方法提示|解释 (仅 2 个 |)
    const pseudoTable = /(文言词句|加点词|词句|句子)[：:][^|]*\|[^|]*\|/.test(line);
    if (!hasPipe && !pseudoTable) return [line];
    const cells = line.split('|').map((c) => c.trim());
    const rows: string[][] = [];
    let cur: string[] = [];
    for (const c of cells) {
      if (c === '') { if (cur.length) { rows.push(cur); cur = []; } continue; }
      cur.push(c);
    }
    if (cur.length) rows.push(cur);
    const filtered = rows.filter((r) => !(r.length === 1 && /^:?-{1,}:?$/.test(r[0])));
    // 伪表格: 首列含 文言词句/加点词 等表头词 → 补表头转表格
    if (!hasSep && filtered.length >= 1) {
      let firstRow = filtered[0];
      // 首单元格可能 = 导语 + 文言词句:xxx, 拆出导语
      if (firstRow[0]) {
        const m = firstRow[0].match(/^(.*?)(文言词句|加点词|词句|句子)[：:](.*)$/);
        if (m && m[1].trim()) {
          // 返回导语行 + 表格行
          const headRow = [m[2] + '：' + m[3], ...firstRow.slice(1)];
          const body = [headRow, ...filtered.slice(1)].map((r) => {
            const pad = [...r];
            while (pad.length < 3) pad.push('');
            return pad;
          });
          return [m[1].trim(), '| 文言词句 | 方法提示 | 解释 |', '| :--- | :--- | :--- |', ...body.map((r) => '| ' + r.join(' | ') + ' |')];
        }
      }
      const firstCell = firstRow[0] || '';
      if (/^(文言词句|加点词|词句|句子)[：:]/.test(firstCell)) {
        const body = filtered.map((r) => {
          const pad = [...r];
          while (pad.length < 3) pad.push('');
          return pad;
        });
        return ['| 文言词句 | 方法提示 | 解释 |', '| :--- | :--- | :--- |', ...body.map((r) => '| ' + r.join(' | ') + ' |')];
      }
    }
    if (!hasSep || filtered.length < 2) return [line];
    // 标准表格: 拆出导语 (表格前文本)
    const out: string[] = [];
    const first = filtered[0];
    if (first.length >= 2) {
      const HEAD = /^(词语|方法提示|文言词句|加点词|推断过程|释义|句子|用法|项目|内容|出处)/;
      const headIdx = first.findIndex((c) => HEAD.test(c));
      if (headIdx > 0) {
        const intro = first.slice(0, headIdx).join(' ');
        if (intro.trim()) out.push(intro.trim());
        filtered[0] = first.slice(headIdx);
      } else {
        const m = first[0].match(/^(.*?)(词语|方法提示|文言词句|加点词|推断过程|释义|句子|用法|项目|内容|出处)(.*)$/);
        if (m && m[1].trim()) { out.push(m[1].trim()); first[0] = (m[2] + m[3]).trim(); }
      }
    }
    for (const r of filtered) out.push('| ' + r.join(' | ') + ' |');
    return out;
  };
  for (const line of rawLines) {
    const expanded = splitInlineTable(line);
    if (expanded.length > 1) { lines.push(...expanded); continue; }
    if (line.trim() && (/[((]\d+[))]/.test(line) || /^\d+\.\s/.test(line.trim()))) {
      const parts = line.split(/(?=[((]\d+[))]|(?=\d+\.\s))/);
      let intro = '';
      for (const part of parts) {
        if (/^[(（]\d+[)）]/.test(part)) {
          if (intro) { lines.push(intro); intro = ''; }
          lines.push(part);
        } else {
          intro += part;
        }
      }
      if (intro.trim()) lines.push(intro);
    } else {
      lines.push(line);
    }
  }
  const blocks: Block[] = [];
  let i = 0;

  const flushTable = (start: number): number => {
    const rows: string[][] = [];
    let j = start;
    while (j < lines.length && lines[j].trimStart().startsWith('|')) {
      const cells = lines[j]
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      if (!cells.every((c) => /^:?-{1,}:?$/.test(c))) rows.push(cells);
      j++;
    }
    if (rows.length) {
      const [header, ...body] = rows;
      blocks.push({ type: 'table', header: header || [], rows: body });
    }
    return j;
  };

  const flushQuote = (start: number): number => {
    const q: string[] = [];
    let j = start;
    while (j < lines.length && lines[j].trimStart().startsWith('>')) {
      q.push(lines[j].replace(/^\s*>\s?/, ''));
      j++;
    }
    if (q.length) blocks.push({ type: 'quote', lines: q });
    return j;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.trimStart().startsWith('|')) { i = flushTable(i); continue; }
    if (line.trimStart().startsWith('>')) { i = flushQuote(i); continue; }
    blocks.push({ type: 'text', line });
    i++;
  }
  return blocks;
}

/** 行内渲染: 转义 + 加点词/方法提示/章节徽章 */
function renderInline(line: string, keyBase: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let buf = '';
  let i = 0;
  let k = 0;
  const flush = () => {
    if (buf) {
      nodes.push(<span key={`${keyBase}-t${k++}`}>{buf}</span>);
      buf = '';
    }
  };

  const METHOD_RE = /(方法提示:[\s\S]*?)$/;
  const SECTION_RE = /^【([^】]{2,8})】/;   // 行首 ≥2 字 → 章节标签
  const JD_RE = /【([^】]{1,2})】|〔([^〕]{1,4})〕|\*\*([^*]{1,6})\*\*/; // 加点词 (含 **加粗** 旧格式)

  while (i < line.length) {
    const rest = line.slice(i);
    // 方法提示
    const mm = rest.match(METHOD_RE);
    if (mm && mm.index === 0) {
      flush();
      const tip = mm[0].replace(/^方法提示:/, '');
      nodes.push(
        <span className="stem-method" key={`${keyBase}-m${k++}`}>
          <b>方法提示</b> {tip}
        </span>
      );
      i += mm[0].length;
      continue;
    }
    // 行首章节标签
    const sm = rest.match(SECTION_RE);
    if (sm && i === 0) {
      flush();
      nodes.push(<span className="stem-section" key={`${keyBase}-s${k++}`}>{sm[1]}</span>);
      i += sm[0].length;
      continue;
    }
    // 加点词
    // 加点词 (含 **旧格式**)
    const jm = rest.match(JD_RE);
    if (jm && jm.index === 0) {
      flush();
      const word = jm[1] || jm[2] || jm[3] || '';
      i += jm[0].length;
      continue;
    }
    buf += line[i];
    i++;
  }
  flush();
  return nodes;
}

export default function StemView({ text, className }: { text?: string; className?: string }) {
  const blocks = useMemo(() => parseStem(text || ''), [text]);
  return (
    <div className={'stem-view' + (className ? ' ' + className : '')}>
      {blocks.map((b, bi) => {
        if (b.type === 'table') {
          return (
            <table className="stem-table" key={bi}>
              <thead>
                <tr>{b.header.map((h, hi) => <th key={hi}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          );
        }
        if (b.type === 'quote') {
          const title = b.lines[0]?.replace(/\*\*/g, '') || '知识卡片';
          const body = b.lines.slice(1).filter(Boolean);
          return (
            <div className="stem-callout" key={bi}>
              <div className="stem-callout-title">📌 {title}</div>
              {body.map((l, li) => (
                <p key={li}>{l}</p>
              ))}
            </div>
          );
        }
        const line = b.line.trim();
        if (!line) return null;
        // 编号小题行: (1) xxx 或 1. xxx, 加悬挂缩进
        const isItem = /^[((]\d+[))]/.test(line) || /^\d+\./.test(line);
        return (
          <p className={'stem-line' + (isItem ? ' stem-item' : '')} key={bi}>
            {renderInline(line, String(bi))}
          </p>
        );
      })}
    </div>
  );
}