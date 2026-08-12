/** 内联 SVG 图标集 — 书卷纸墨风 (stroke 风格, 无外部依赖)。
 *  用法: <Icon name="book" size={18} /> */
const PATHS: Record<string, string> = {
  // 书卷
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5z M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  // 字词卡
  cards: 'M4 7.5h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10z M8 7.5V4.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3',
  // 复习/卷宗
  review: 'M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z M15 4h2a2 2 0 0 1 2 2v14h-2 M8 9h6 M8 13h6',
  // 错题/铅笔
  pencil: 'M17 3l4 4L9 19H5v-4L17 3z M13 7l4 4',
  // 搜索
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M20 20l-3.5-3.5',
  // 右箭头
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  // 左箭头
  arrowLeft: 'M19 12H5 M11 6l-6 6 6 6',
  // 朗读
  play: 'M8 5.5v13l11-6.5L8 5.5z',
  // 星星(重点)
  star: 'M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  // 对勾
  check: 'M4 12.5l5 5L20 6.5',
  // 印章
  seal: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M12 8.5l1.5 3 3.2.4-2.3 2.2.6 3.1L12 15.7 9 17.2l.6-3.1L7.3 12l3.2-.4L12 8.5z',
  // 火焰(热度)
  flame: 'M12 3c1 3-2 4.5-2 8a4 4 0 0 0 8 .5c.4 1 .5 2 .5 3A6.5 6.5 0 0 1 12 21 6.5 6.5 0 0 1 5.5 14.5c0-3 2-5 2.5-7 1 1.5 2 2 2.5 2.5C10.5 8 11 5.5 12 3z',
  // 笔记/清单
  list: 'M9 5h11 M9 12h11 M9 19h11 M4 5h.01 M4 12h.01 M4 19h.01',
  // 刷新
  refresh: 'M20 11a8 8 0 1 0-1.5 5.5 M20 5v6h-6',
  // 图谱/地图
  map: 'M4 6l5-3 6 3 5-3v15l-5 3-6-3-5 3V6z M9 3v15 M15 6v15',
  // 奖杯(成就)
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4z M7 5H4a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3 M17 5h3a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3 M12 14v4 M8 21h8 M9 21a3 3 0 0 1 3-3 3 3 0 0 1 3 3',
};

export default function Icon({
  name,
  size = 18,
  stroke = 'currentColor',
  strokeWidth = 1.7,
  className = '',
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={'icon' + (className ? ' ' + className : '')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
