/**
 * 通假字 / 多音字 / 破音字 / 生僻字读音字典
 *
 * — always:true  表示该字在所有文言文中都用此读法(本质是固定读音)
 * — expose:true  表示 ruby 标注显示(默认 false 即只影响 TTS 不显示拼音注音)
 * — replace      表示 TTS 时用"该字"的音替代:
 *                 通假字用本字 / 多音字用正确读音的同音字
 *                 (Chrome 中文 TTS 对多音字按现代默认读音念, 必须换成同音字
 *                  才能强制发出目标读音, 如 朝→招[zhāo] / 朝→潮[cháo])
 *
 * 数据来自人教版文言文注释 + 历年中考真题高频考点
 */
export interface PronEntry {
  /** 原文中的字 */
  char: string;
  /** 可选上下文(篇目片段或前后字串)用于精确匹配；空表示不限 */
  context?: string;
  /** 拼音显示标签(供 ruby 注音) */
  pron?: string;
  /** TTS 时替换为的发音字, 默认替换为本字同音 */
  replace?: string;
  /** 本字(通假字所通之字), 用于注释说明; 若同 char 则单纯多音字 */
  benzi?: string;
  /** true 在所有文言文里都照此读(固定读法/特殊读音) */
  always?: boolean;
  /** 是否在页面显示注音; 通假字/重要多音字=true */
  expose?: boolean;
}

export const PRON_DICT: PronEntry[] = [
  // ================= 高频通假字 =================
  // 学而时习之,不亦说乎(说→悦, yuè)
  { char: '率', context: '奖率', pron: 'shuài', replace: '帅', benzi: '帅', expose: true },
  { char: '率', context: '率三军', pron: 'shuài', replace: '帅', benzi: '帅', expose: true },
  { char: '率', context: '大率', pron: 'shuài', replace: '帅', benzi: '帅', expose: true },
  { char: '说', context: '不亦说乎', pron: 'yuè', replace: '悦', benzi: '悦', expose: true },
  { char: '说', context: '学而时习之', pron: 'yuè', replace: '悦', benzi: '悦', expose: true },
  // 秦王不说(说→悦, yuè)
  { char: '说', context: '秦王不说', pron: 'yuè', replace: '悦', benzi: '悦', expose: true },
  { char: '说', context: '不说', pron: 'yuè', replace: '悦', benzi: '悦', expose: true },
  // 傅说(人名, yuè)
  { char: '说', context: '傅说', pron: 'yuè', replace: '岳', benzi: '人名', expose: true },
  // 客美我(说→劝说, shuì)
  { char: '说', context: '客之美我', pron: 'shuì', replace: '税', benzi: '游说之意', expose: true },
  // 畔(叛 pàn):寡助之至,亲戚畔之
  { char: '畔', context: '亲戚畔之', pron: 'pàn', replace: '叛', benzi: '叛', expose: true },
  { char: '畔', context: '寡助之至', pron: 'pàn', replace: '叛', benzi: '叛', expose: true },
  // 曾(zēng): 曾不能毁山之一毛 / 曾不若孀妻弱子 / 曾益其所不能
  { char: '曾', context: '曾不能', pron: 'zēng', replace: '增', benzi: '竟然/竟至', expose: true, always: true },
  { char: '曾', context: '曾不若', pron: 'zēng', replace: '增', benzi: '竟然/竟至', expose: true, always: true },
  { char: '曾', context: '曾益其所不能', pron: 'zēng', replace: '增', benzi: '增', expose: true, always: true },
  // 拂(bì): 入则无法家拂士
  { char: '拂', context: '拂士', pron: 'bì', replace: '弼', benzi: '弼(辅弼)', expose: true },
  { char: '拂', context: '法家', pron: 'bì', replace: '弼', benzi: '弼', expose: true },
  // 要(yāo): 便要还家
  { char: '要', context: '便要还家', pron: 'yāo', replace: '邀', benzi: '邀', expose: true },
  // 具(俱 jù): 具答之 / 政通人和,百废具兴
  { char: '具', context: '具答之', pron: 'jù', replace: '俱', benzi: '俱(全/都)', expose: true },
  { char: '具', context: '百废具兴', pron: 'jù', replace: '俱', benzi: '俱', expose: true },
  // 反(返 fǎn): 寒暑易节,始一反焉
  { char: '反', context: '一反焉', pron: 'fǎn', replace: '返', benzi: '返', expose: true },
  { char: '反', context: '一反', pron: 'fǎn', replace: '返', benzi: '返', expose: true },
  // 惠(慧 huì): 甚矣,汝之不惠
  { char: '惠', context: '不惠', pron: 'huì', replace: '慧', benzi: '慧(聪明)', expose: true },
  // 亡(无 wú): 河曲智叟亡以应
  { char: '亡', context: '亡以应', pron: 'wú', replace: '无', benzi: '无', expose: true },
  // 属(zhǔ): 属予作文以记之 / 属引凄异
  { char: '属', context: '属予作文', pron: 'zhǔ', replace: '嘱', benzi: '嘱(嘱咐)', expose: true },
  { char: '属', context: '属文', pron: 'zhǔ', replace: '嘱', benzi: '嘱', expose: true },
  { char: '属', context: '属引', pron: 'zhǔ', replace: '嘱', benzi: '连续', expose: true },
  // 见(xiàn): 见渔人,乃大惊 / 才美不外见
  { char: '见', context: '乃大惊', pron: 'xiàn', replace: '现', benzi: '现', expose: false },
  { char: '见', context: '见渔人', pron: 'xiàn', replace: '现', benzi: '现', expose: true },
  { char: '见', context: '见公输', pron: 'xiàn', replace: '现', benzi: '现', expose: true },
  { char: '见', context: '外见', pron: 'xiàn', replace: '现', benzi: '现(显露)', expose: true },
  { char: '见', context: '胡不', pron: 'jiàn', replace: '见', benzi: '见', expose: false },
  // 诎(qū): 诎右臂支地
  { char: '诎', context: '诎右臂', pron: 'qū', replace: '屈', benzi: '屈', expose: true },
  // 衡(横 héng): 困于心衡于虑
  { char: '衡', context: '衡于虑', pron: 'héng', replace: '横', benzi: '横(梗塞)', expose: true },
  // 忍(rèn) 通"韧": 所以动心忍性
  { char: '忍', context: '所以动心忍性', pron: 'rèn', replace: '韧', benzi: '韧', expose: true },
  // 帖(tiē): 对镜帖花黄
  { char: '帖', context: '帖花黄', pron: 'tiē', replace: '贴', benzi: '贴', expose: true },
  // 蕃(fán): 可爱者甚蕃
  { char: '蕃', context: '甚蕃', pron: 'fán', replace: '繁', benzi: '繁(多)', expose: true },
  // 隳(huī): 一厝朔东(隳突乎南北)
  { char: '隳', always: true, pron: 'huī', replace: '灰', benzi: '毁', expose: true },
  // 错(措 cuò): 故不错意也
  { char: '错', context: '不错意', pron: 'cuò', replace: '措', benzi: '措(放置)', expose: true },
  // 仓(苍 cāng): 仓鹰击于殿上
  { char: '仓', context: '仓鹰', pron: 'cāng', replace: '苍', benzi: '苍', expose: true },

  // ================= 多音字 / 破音字(高频考点) =================
  // ---- 朝: zhāo(早晨) / cháo(朝廷/朝向) ----
  { char: '朝', context: '朝而往', pron: 'zhāo', replace: '招', benzi: '早晨', expose: true },
  { char: '朝', context: '朝服', pron: 'zhāo', replace: '招', benzi: '早晨', expose: true },
  { char: '朝', context: '朝晖', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '朝暮', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '朝露', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '一朝', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '今朝', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '朝辞', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '朝雨', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '朝气', pron: 'zhāo', replace: '招', expose: true },
  { char: '朝', context: '明朝', pron: 'cháo', replace: '潮' },
  { char: '朝', context: '朝廷', pron: 'cháo', replace: '潮' },
  { char: '朝', context: '朝代', pron: 'cháo', replace: '潮' },
  { char: '朝', context: '市朝', pron: 'cháo', replace: '潮' },
  { char: '朝', context: '朝于', pron: 'cháo', replace: '潮', benzi: '朝见', expose: true },
  { char: '朝', context: '入朝', pron: 'cháo', replace: '潮' },
  { char: '朝', context: '朝中', pron: 'cháo', replace: '潮' },

  // ---- 乐: lè(快乐) / yuè(音乐) / yào(喜爱) ----
  { char: '乐', context: '山水之乐', pron: 'lè', replace: '乐' },
  { char: '乐', context: '太守之乐', pron: 'lè', replace: '乐' },
  { char: '乐', context: '乐其乐', pron: 'lè', replace: '乐', expose: true },
  { char: '乐', context: '而乐', pron: 'lè', replace: '乐' },
  { char: '乐', context: '乐府', pron: 'yuè', replace: '岳', benzi: 'yuè(音乐)', expose: true },
  { char: '乐', context: '乐水', pron: 'yào', replace: '要', benzi: 'yào(喜爱)', expose: true },
  { char: '乐', context: '乐山', pron: 'yào', replace: '要', benzi: 'yào(喜爱)', expose: true },

  // ---- 行: xíng(行走) / háng(行列/太行) ----
  { char: '行', context: '行拂乱', pron: 'xíng', replace: '行', expose: true },
  { char: '行', context: '行阵', pron: 'háng', replace: '航', benzi: 'háng (行列)', expose: true },
  { char: '行', context: '行列', pron: 'háng', replace: '航', expose: true },
  { char: '行', context: '太行', pron: 'háng', replace: '航', benzi: '太行山', expose: true },

  // ---- 夫: fú(发语词/这) / fū(成年男子) ----
  { char: '夫', context: '夫君子', pron: 'fú', replace: '服', benzi: '句首发语词', expose: true },
  { char: '夫', context: '夫大国', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '予观夫', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '夫环', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '若夫', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '夫战', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '嗟夫', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '如斯夫', pron: 'fú', replace: '服', expose: true },
  { char: '夫', context: '夫专', pron: 'fú', replace: '服', expose: true },

  // ---- 度: dù(尺度) / duó(估计/越过) ----
  { char: '度', context: '度若飞', pron: 'duó', replace: '夺', benzi: 'duó (越过)', expose: true },
  { char: '度', context: '度已失期', pron: 'duó', replace: '夺', benzi: 'duó (估计)', expose: true },

  // ---- 燕: yàn(鸟) / yān(地名) ----
  { char: '燕', context: '燕雀', pron: 'yàn', replace: '燕', benzi: 'yàn (鸟)', expose: true },
  { char: '燕', context: '燕然', pron: 'yān', replace: '烟', benzi: 'yān (地名)', expose: true },
  { char: '燕', context: '燕脂', pron: 'yān', replace: '烟', expose: true },
  { char: '燕', context: '燕山', pron: 'yān', replace: '烟', expose: true },
  { char: '燕', context: '燕、', pron: 'yān', replace: '烟', expose: true },

  // ---- 薄: bó(迫近/微薄) / báo(厚薄) ----
  { char: '薄', context: '薄暮', pron: 'bó', replace: '博', benzi: '迫近', expose: true },
  { char: '薄', context: '日薄', pron: 'bó', replace: '博', expose: true },
  { char: '薄', context: '薄如', pron: 'bó', replace: '博', expose: true },

  // ---- 称: chèn(相当) / chēng(称呼) ----
  { char: '称', context: '称前时', pron: 'chèn', replace: '衬', benzi: 'chèn (相当)', expose: true },
  { char: '称', context: '称善', pron: 'chēng', replace: '称' },

  // ---- 骑: qí(骑马) / jì(骑兵) ----
  { char: '骑', context: '胡骑', pron: 'jì', replace: '计', benzi: 'jì (骑兵)', expose: true },
  { char: '骑', context: '铁骑', pron: 'jì', replace: '计', expose: true },
  { char: '骑', context: '候骑', pron: 'jì', replace: '计', expose: true },
  { char: '骑', context: '千骑', pron: 'jì', replace: '计', expose: true },

  // ---- 间: jiān(中间) / jiàn(参与/间或/暗地) ----
  { char: '间', context: '又何间焉', pron: 'jiàn', replace: '建', benzi: 'jiàn (参与)', expose: true },
  { char: '间', context: '间令', pron: 'jiàn', replace: '建', benzi: 'jiàn (暗地)', expose: true },
  { char: '间', context: '间至', pron: 'jiàn', replace: '建', expose: true },
  { char: '间', context: '间进', pron: 'jiàn', replace: '建', benzi: 'jiàn (间或)', expose: true },

  // ---- 少: shǎo(多少) / shào(年少) ----
  { char: '少', context: '少时', pron: 'shǎo', replace: '少' },
  { char: '少', context: '少顷', pron: 'shǎo', replace: '少' },
  { char: '少', context: '少益', pron: 'shāo', replace: '少', benzi: 'shāo (稍微)', expose: true },
  { char: '少', context: '宾客少长', pron: 'shào', replace: '绍', benzi: 'shào (年轻)', expose: true },

  // ---- 长: cháng(长短) / zhǎng(年长/生长) ----
  { char: '长', context: '长息', pron: 'cháng', replace: '长' },
  { char: '长', context: '长跪', pron: 'cháng', replace: '长' },
  { char: '长', context: '长者', pron: 'zhǎng', replace: '掌', benzi: 'zhǎng (年长)', expose: true },

  // ---- 好: hǎo(美好) / hào(爱好) ----
  { char: '好', context: '好鸟', pron: 'hǎo', replace: '好' },
  { char: '好', context: '不好', pron: 'hào', replace: '号' },
  { char: '好', context: '好此', pron: 'hào', replace: '号' },
  { char: '好', context: '好之者', pron: 'hào', replace: '号', expose: true },
  { char: '好', context: '好读书', pron: 'hào', replace: '号', expose: true },

  // ---- 为: wèi(介词) / wéi(做/是) ----
  { char: '为', context: '为之', pron: 'wèi', replace: '卫', expose: true },
  { char: '为', context: '为此', pron: 'wèi', replace: '卫', expose: true },
  { char: '为', context: '不足为', pron: 'wèi', replace: '卫', expose: true },
  { char: '为', context: '奈何', pron: 'wèi', replace: '卫', expose: true },
  { char: '为', context: '为坛', pron: 'wéi', replace: '为' },

  // ---- 属: zhǔ(嘱托) / shǔ(类属) ----
  { char: '属', context: '之属', pron: 'shǔ', replace: '属', benzi: 'shǔ (类)', expose: true },
  { char: '属', context: '徒属', pron: 'shǔ', replace: '属', expose: true },

  // ---- 和: hé(和平) / hè(唱和/呼应) ----
  { char: '和', context: '和其声', pron: 'hè', replace: '贺', benzi: 'hè (呼应)', expose: true },
  { char: '和', context: '唱和', pron: 'hè', replace: '贺', expose: true },

  // ---- 屏: píng(屏风) / bǐng(屏息) ----
  { char: '屏', context: '屏气', pron: 'bǐng', replace: '饼', benzi: 'bǐng (抑制)', expose: true },
  { char: '屏', context: '屏息', pron: 'bǐng', replace: '饼', expose: true },

  // ---- 遗: yí(遗留) / wèi(给予) ----
  { char: '遗', context: '以遗陛', pron: 'wèi', replace: '卫', benzi: 'wèi (给予)', expose: true },
  { char: '遗', context: '遗陛下', pron: 'wèi', replace: '卫', expose: true },

  // ---- 恶: è(凶恶) / wū(疑问) / wù(厌恶) ----
  { char: '恶', context: '恶得', pron: 'wū', replace: '呜', benzi: 'wū (如何)', expose: true },
  { char: '恶', context: '恶能', pron: 'wū', replace: '呜', expose: true },

  // ---- 数: shù(数目) / shǔ(数落/计算) / shuò(多次) ----
  { char: '数', context: '数言', pron: 'shuò', replace: '硕', benzi: 'shuò (多次)', expose: true },
  { char: '数', context: '数风流', pron: 'shǔ', replace: '暑', benzi: 'shǔ (计算)', expose: true },

  // ---- 塞: sài(边塞) / sè(闭塞) / sāi(塞住) ----
  { char: '塞', context: '塞上', pron: 'sài', replace: '赛' },
  { char: '塞', context: '塞外', pron: 'sài', replace: '赛' },
  { char: '塞', context: '塞下', pron: 'sài', replace: '赛' },
  { char: '塞', context: '边塞', pron: 'sài', replace: '赛' },
  { char: '塞', context: '出塞', pron: 'sài', replace: '赛' },
  { char: '塞', context: '之塞', pron: 'sè', replace: '涩', benzi: 'sè (阻塞)', expose: true },

  // ---- 还: huán(归还) / hái(副词) ----
  { char: '还', context: '还家', pron: 'huán', replace: '环', benzi: 'huán (返回)', expose: true },
  { char: '还', context: '还故乡', pron: 'huán', replace: '环', expose: true },

  // ---- 汤: tāng(汤水) / shāng(汤汤水大) ----
  { char: '汤', context: '汤汤', pron: 'shāng', replace: '伤', benzi: 'shāng (水势大)', expose: true },

  // ---- 更: gēng(更换/更夫) / gèng(更加) ----
  { char: '更', context: '更互', pron: 'gēng', replace: '耕', benzi: 'gēng (交替)', expose: true },
  { char: '更', context: '三更', pron: 'gēng', replace: '耕', expose: true },

  // ---- 处: chǔ(处于) / chù(处所) ----
  { char: '处', context: '处江湖', pron: 'chǔ', replace: '楚', expose: true },
  { char: '处', context: '处其间', pron: 'chǔ', replace: '楚', expose: true },

  // ---- 相: xiāng(互相) / xiàng(丞相/相面) ----
  { char: '相', context: '将相', pron: 'xiàng', replace: '向', benzi: 'xiàng (宰相)', expose: true },

  // ---- 将: jiāng(将要) / jiàng(将领) ----
  { char: '将', context: '将相', pron: 'jiàng', replace: '匠', benzi: 'jiàng (将领)', expose: true },
  { char: '将', context: '将士', pron: 'jiàng', replace: '匠', expose: true },

  // ---- 王: wáng(君王) / wàng(称王) ----
  { char: '王', context: '陈胜王', pron: 'wàng', replace: '忘', benzi: 'wàng (称王)', expose: true },

  // ---- 食: shí(吃) / sì(喂养) ----
  { char: '食', context: '食马者', pron: 'sì', replace: '四', benzi: 'sì (喂养)', expose: true },
  { char: '食', context: '而食也', pron: 'sì', replace: '四', benzi: 'sì (喂养)', expose: true },

  // ---- 单: dān(单一) / chán(单于) ----
  { char: '单', context: '单于', pron: 'chán', replace: '缠', benzi: '单于(匈奴首领)', expose: true },

  // ---- 石: shí(石头) / dàn(容量单位) ----
  { char: '石', context: '一石', pron: 'dàn', replace: '蛋', benzi: 'dàn (容量)', expose: true },

  // ---- 邪: xié(邪恶) / yé(语气词) ----
  { char: '邪', context: '马邪', pron: 'yé', replace: '耶', expose: true },

  // ---- 期: qī(期限) / jī(期年) ----
  { char: '期', context: '期年', pron: 'jī', replace: '机', benzi: 'jī (满一年)', expose: true },

  // ---- 传: chuán(传递) / zhuàn(传记) ----
  { char: '传', context: '左传', pron: 'zhuàn', replace: '撰', benzi: 'zhuàn (传记)', expose: true },

  // ---- 语: yǔ(语言) / yù(告诉) ----
  { char: '语', context: '语云', pron: 'yù', replace: '玉', benzi: 'yù (告诉)', expose: true },

  // ---- 与: yǔ(和) / yú(语气词) ----
  { char: '与', context: '寡人与', pron: 'yú', replace: '余', expose: true },

  // ---- 荷: hé(荷花) / hè(扛) ----
  { char: '荷', context: '荷担', pron: 'hè', replace: '贺', benzi: 'hè (扛)', expose: true },

  // ---- 应: yīng(应该) / yìng(回应) ----
  { char: '应', context: '者应', pron: 'yìng', replace: '硬', expose: true },
  { char: '应', context: '以应', pron: 'yìng', replace: '硬', expose: true },

  // ---- 中: zhōng(中间) / zhòng(射中) ----
  { char: '中', context: '中通外直', pron: 'zhōng', replace: '中' },
  { char: '中', context: '者中', pron: 'zhòng', replace: '众', benzi: 'zhòng (射中)', expose: true },

  // ---- 鲜: xiān(新鲜) / xiǎn(少) ----
  { char: '鲜', context: '鲜有', pron: 'xiǎn', replace: '显', benzi: 'xiǎn (少)', expose: true },

  // ---- 强: qiáng(强大) / qiǎng(勉强) ----
  { char: '强', context: '勉强', pron: 'qiǎng', replace: '抢', expose: true },

  // ---- 抢: qiǎng(抢夺) / qiāng(撞) ----
  { char: '抢', context: '抢地', pron: 'qiāng', replace: '枪', benzi: 'qiāng (撞)', expose: true },

  // ---- 差: chā(差别) / cī(参差/差互) ----
  { char: '差', context: '参差', pron: 'cī', replace: '疵', benzi: 'cī (不齐)', expose: true },
  { char: '差', context: '差互', pron: 'cī', replace: '疵', benzi: 'cī (交错)', expose: true },
  { char: '参', context: '参差', pron: 'cēn', replace: '嗔', benzi: 'cēn (参差)', expose: true },

  // ---- 倒: dǎo(倒下) / dào(倒映/倒退) ----
  { char: '倒', context: '倒影', pron: 'dào', replace: '到', expose: true },

  // ---- 裳: cháng(下衣) / shang(衣裳) ----
  { char: '裳', context: '沾裳', pron: 'cháng', replace: '常', expose: true },
  { char: '裳', context: '旧时裳', pron: 'cháng', replace: '常', expose: true },

  // ---- 识: shí(认识) / zhì(记住) ----
  { char: '识', context: '默而识之', pron: 'zhì', replace: '志', benzi: 'zhì (记住)', expose: true },

  // ---- 仿佛: fú(仿佛) ----
  { char: '佛', context: '仿佛', pron: 'fú', replace: '扶', expose: true },

  // ---- 曾: céng(曾经) / zēng(姓氏/竟然) ----
  { char: '曾', context: '曾经', pron: 'céng', replace: '层', expose: true },

  // ---- 胜: shèng(胜利/美好) ----
  { char: '胜', context: '胜状', pron: 'shèng', replace: '圣', expose: true },
  { char: '胜', context: '胜地', pron: 'shèng', replace: '圣', expose: true },

  // ---- 奇: qí(奇特) ----
  { char: '奇', context: '奇伟', pron: 'qí', replace: '棋' },
  { char: '奇', context: '奇绝', pron: 'qí', replace: '棋' },
  { char: '奇', context: '奇巧', pron: 'qí', replace: '棋' },

  // ---- 仆: pú(仆人) / pū(倒下) ----
  { char: '仆', context: '仆地', pron: 'pū', replace: '扑', benzi: 'pū (倒下)', expose: true },

  // ---- 裨: bì(弥补) ----
  { char: '裨', context: '裨补', pron: 'bì', replace: '必', benzi: 'bì (弥补)', expose: true },

  // ================= 生僻字 / 易错字(固定读音) =================
  { char: '阡', always: true, pron: 'qiān', replace: '千' },
  { char: '垣', always: true, pron: 'yuán', replace: '圆' },
  { char: '暝', always: true, pron: 'míng', replace: '明', expose: true },
  { char: '晦', context: '晦明', pron: 'huì', replace: '会', expose: true, always: true },
  { char: '偻', context: '伛偻', pron: 'lǚ', replace: '缕', expose: true, always: true },
  { char: '搴', always: true, pron: 'qiān', replace: '千', expose: true },
  { char: '洌', always: true, pron: 'liè', replace: '列' },
  { char: '蔌', always: true, pron: 'sù', replace: '素' },
  { char: '觥', always: true, pron: 'gōng', replace: '公' },
  { char: '颓', context: '颓然', pron: 'tuí', replace: '颓', expose: true },
  { char: '颓', context: '颓乎', pron: 'tuí', replace: '颓', expose: true },
  { char: '霏', always: true, pron: 'fēi', replace: '飞' },
  { char: '滁', always: true, pron: 'chú', replace: '除' },
  { char: '琅', always: true, pron: 'láng', replace: '狼' },
  { char: '琊', always: true, pron: 'yá', replace: '牙' },
  { char: '酿', always: true, pron: 'niàng', replace: '酿' },
  { char: '晏', always: true, pron: 'yàn', replace: '艳' },
  { char: '殆', always: true, pron: 'dài', replace: '代' },
  { char: '绝', context: '绝境', pron: 'jué', replace: '决', expose: true },
  { char: '绝', context: '绝壁', pron: 'jué', replace: '决' },
  { char: '顾', context: '三顾', pron: 'gù', replace: '故', benzi: 'gù (拜访)', expose: true },
  { char: '顾', context: '不如', pron: 'gù', replace: '故', expose: true },
  { char: '几', context: '未几', pron: 'jǐ', replace: '几' },
  { char: '阙', context: '阙漏', pron: 'quē', replace: '缺', benzi: '缺', expose: true },
  { char: '阙', context: '裨补', pron: 'quē', replace: '缺', expose: true },
  { char: '咎', always: true, pron: 'jiù', replace: '就' },
  { char: '谏', always: true, pron: 'jiàn', replace: '建' },
  { char: '稍', context: '稍稍', pron: 'shāo', replace: '烧', expose: true },
  { char: '举', context: '举酒', pron: 'jǔ', replace: '矩' },
  { char: '临', context: '临溪', pron: 'lín', replace: '林' },
  { char: '渔', always: true, pron: 'yú', replace: '鱼' },
  { char: '怫', context: '怫然', pron: 'fú', replace: '服', expose: true },
  { char: '跣', context: '徒跣', pron: 'xiǎn', replace: '险', expose: true },
  { char: '傀', context: '韩傀', pron: 'guī', replace: '归', expose: true },
  { char: '祲', context: '休祲', pron: 'jìn', replace: '进', expose: true },
  { char: '缟', context: '缟素', pron: 'gǎo', replace: '稿', expose: true },
  { char: '雎', context: '唐雎', pron: 'jū', replace: '居', expose: true },
  { char: '昳', always: true, pron: 'yì', replace: '意', expose: true },
  { char: '龀', always: true, pron: 'chèn', replace: '衬', expose: true },
  { char: '厝', always: true, pron: 'cuò', replace: '措', expose: true },
  { char: '畎', always: true, pron: 'quǎn', replace: '犬', expose: true },
  { char: '鬲', context: '胶鬲', pron: 'gé', replace: '格', expose: true },
  { char: '媵', always: true, pron: 'yìng', replace: '硬', expose: true },
  { char: '衾', always: true, pron: 'qīn', replace: '亲', expose: true },
  { char: '缊', always: true, pron: 'yùn', replace: '运', expose: true },
  { char: '烨', always: true, pron: 'yè', replace: '页', expose: true },
  { char: '箪', always: true, pron: 'dān', replace: '丹', expose: true },
  { char: '肱', always: true, pron: 'gōng', replace: '公', expose: true },
  { char: '愠', always: true, pron: 'yùn', replace: '运', expose: true },
  { char: '诹', always: true, pron: 'zōu', replace: '邹', expose: true },
  { char: '濯', always: true, pron: 'zhuó', replace: '卓', expose: true },
  { char: '亵', always: true, pron: 'xiè', replace: '谢', expose: true },
  { char: '噫', always: true, pron: 'yī', replace: '衣', expose: true },
  { char: '祗', always: true, pron: 'zhǐ', replace: '只', expose: true },
  { char: '潺', always: true, pron: 'chán', replace: '缠', expose: true },
  { char: '辄', always: true, pron: 'zhé', replace: '哲', expose: true },
  { char: '酣', always: true, pron: 'hān', replace: '憨', expose: true },
  { char: '弈', always: true, pron: 'yì', replace: '艺', expose: true },
  { char: '翳', always: true, pron: 'yì', replace: '意', expose: true },
  { char: '壑', always: true, pron: 'hè', replace: '贺', expose: true },
  { char: '嗟', always: true, pron: 'jiē', replace: '街', expose: true },
  { char: '缥', always: true, pron: 'piǎo', replace: '瞟', expose: true },
  { char: '泠', always: true, pron: 'líng', replace: '零', expose: true },
  { char: '巘', always: true, pron: 'yǎn', replace: '眼', expose: true },
  { char: '佁', always: true, pron: 'yǐ', replace: '已', expose: true },
  { char: '俶', always: true, pron: 'chù', replace: '触', expose: true },
  { char: '翕', always: true, pron: 'xī', replace: '西', expose: true },
  { char: '涧', always: true, pron: 'jiàn', replace: '建', expose: true },
  { char: '藉', context: '狼藉', pron: 'jí', replace: '籍', expose: true },
];

/**
 * 构建原文注音映射：返回 { 字符绝对偏移 → 拼音 }。
 * 匹配规则：entry.always 全局匹配；否则需命中 context 上下文。
 */
export function buildPronMap(text: string): Map<number, string> {
  const m = new Map<number, string>();
  PRON_DICT.forEach((entry) => {
    if (!entry.always && text.indexOf(entry.char) < 0) return;
    let idx = text.indexOf(entry.char);
    while (idx >= 0) {
      if (entry.context) {
        const ctx = text.substring(Math.max(0, idx - entry.context.length), idx + entry.context.length + 1);
        if (!ctx.includes(entry.context)) { idx = text.indexOf(entry.char, idx + 1); continue; }
      }
      if (entry.pron && !m.has(idx)) m.set(idx, entry.pron);
      if (!entry.always) break;
      idx = text.indexOf(entry.char, idx + 1);
    }
  });
  return m;
}
