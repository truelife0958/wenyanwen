/** 游戏化术语映射 (展示层): 学习→历练, 默写→默诵。
 *  数据 json (moxie.json 题型名/考点标签) 保持原值, 仅在渲染时映射,
 *  避免触碰构建管道与校验逻辑。 */

/** 通用替换: 学习→历练, 默写→默诵 (对数据驱动的展示文案统一生效)。 */
export function g(text: string): string {
  return String(text ?? '')
    .replace(/学习/g, '历练')
    .replace(/默写/g, '默诵');
}

/** 题型专名映射 (MoxieSection.type → 展示名)。 */
export const MOXIE_TYPE_MAP: Record<string, string> = {
  '原文默写': '原文默诵',
  '理解性默写': '理解默诵',
  '词义默写': '词义默诵',
  '译文默写': '译文默诵',
  '名句默写': '名句默诵',
};

/** 题型展示名: 优先专名映射, 兜底通用替换。 */
export function moxieTypeLabel(type: string): string {
  return MOXIE_TYPE_MAP[type] || g(type);
}
