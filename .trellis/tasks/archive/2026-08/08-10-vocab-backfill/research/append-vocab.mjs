// 补充虚词(4)与实词(30)到 learning.json glossary 条目
import { readFileSync, writeFileSync } from 'fs';
const PATH = 'src/data/raw/learning.json';
const data = JSON.parse(readFileSync(PATH, 'utf8'));
const g = data.find((x) => x.type === 'glossary');
writeFileSync(PATH + '.bak3', JSON.stringify(data, null, 2), 'utf8');

// ===== 虚词补充: 者 所 若 矣 (格式: {category, subtype, example, origin}) =====
const newXuci = [
  { char: '者', kind: '虚词', usage: [
    { category: '助词', subtype: '代词,用在形容词、动词或动词短语后,组成名词性短语,相当于“……的人”“……的事物”', example: '择其善者而从之', origin: '论语十二章' },
    { category: '助词', subtype: '助词,用在判断句主语后,表停顿,引出判断', example: '陈胜者,阳城人也', origin: '陈涉世家' },
    { category: '助词', subtype: '助词,用在时间词后,凑足音节,无实义', example: '今者项庄拔剑舞', origin: '课文例句' },
    { category: '助词', subtype: '代词,可译为“……的人”', example: '京中有善口技者', origin: '口技' },
  ] },
  { char: '所', kind: '虚词', usage: [
    { category: '助词', subtype: '与动词结合,组成名词性短语,表示“……的人”“……的事物”“……的地方”', example: '山峦为晴雪所洗', origin: '满井游记' },
    { category: '助词', subtype: '“所以”连用:表原因,可译为“……的原因”;表手段或凭借,可译为“用来……的”', example: '此先汉所以兴隆也', origin: '出师表' },
    { category: '助词', subtype: '与“为”组成“为……所……”被动句式', example: '为天下笑者', origin: '课文例句' },
  ] },
  { char: '若', kind: '虚词', usage: [
    { category: '连词', subtype: '表假设,可译为“如果”“假如”', example: '若士必怒,伏尸二人', origin: '唐雎不辱使命' },
    { category: '代词', subtype: '人称代词,你、你的;你们、你们的', example: '若为佣耕,何富贵也', origin: '陈涉世家' },
    { category: '动词', subtype: '像,如同', example: '门庭若市', origin: '邹忌讽齐王纳谏' },
    { category: '副词', subtype: '“若夫”连用,用在一段话开头,可译为“像那”“至于那”', example: '若夫淫雨霏霏', origin: '岳阳楼记' },
  ] },
  { char: '矣', kind: '虚词', usage: [
    { category: '语气词', subtype: '表陈述语气,可译为“了”,也可不译', example: '温故而知新,可以为师矣', origin: '论语十二章' },
    { category: '语气词', subtype: '表感叹语气,可译为“了”“啊”', example: '甚矣,汝之不惠', origin: '愚公移山' },
    { category: '语气词', subtype: '表祈使、肯定语气', example: '此则岳阳楼之大观也,前人之述备矣', origin: '岳阳楼记' },
  ] },
];

// ===== 实词补充: 教材附录6 + 高频24 =====
const newShici = [
  { char: '类', kind: '实词', senses: [
    { sense: '类似,像', example: '佛印绝类弥勒', origin: '核舟记' },
    { sense: '类推', example: '不可谓知类', origin: '公输' },
    { sense: '类别,种类', example: '同类相求', origin: '课文例句' },
  ] },
  { char: '怜', kind: '实词', senses: [
    { sense: '爱,怜惜', example: '仍怜故乡水', origin: '渡荆门送别' },
    { sense: '同情,可怜', example: '怜君何事到天涯', origin: '长沙过贾谊宅' },
    { sense: '哀怜,怜悯', example: '丈夫亦爱怜其少子乎', origin: '触龙说赵太后' },
  ] },
  { char: '名', kind: '实词', senses: [
    { sense: '名字,名称', example: '卷卷有爷名', origin: '木兰诗' },
    { sense: '命名,取名', example: '名之者谁', origin: '醉翁亭记' },
    { sense: '有名,出名', example: '山不在高,有仙则名', origin: '陋室铭' },
    { sense: '说出,说出名字', example: '不能名其一处也', origin: '口技' },
  ] },
  { char: '明', kind: '实词', senses: [
    { sense: '明亮,光明', example: '斗折蛇行,明灭可见', origin: '小石潭记' },
    { sense: '明确,清楚', example: '明察秋毫', origin: '童趣' },
    { sense: '次日,第二', example: '明日徐公来', origin: '邹忌讽齐王纳谏' },
    { sense: '明智,贤明', example: '恐托付不效,以伤先帝之明', origin: '出师表' },
  ] },
  { char: '难', kind: '实词', senses: [
    { sense: '困难,艰难', example: '夫大国,难测也', origin: '曹刿论战' },
    { sense: '灾难,祸患', example: '奉命于危难之间', origin: '出师表' },
  ] },
  { char: '平', kind: '实词', senses: [
    { sense: '平坦', example: '土地平旷', origin: '桃花源记' },
    { sense: '平定,治理', example: '国治而后天下平', origin: '课文例句' },
    { sense: '公平,公正', example: '以昭陛下平明之理', origin: '出师表' },
  ] },
  { char: '比', kind: '实词', senses: [
    { sense: '靠近,挨着', example: '其两膝相比者', origin: '核舟记' },
    { sense: '比较,相比', example: '比吾乡邻之死则已后矣', origin: '捕蛇者说' },
    { sense: '等到', example: '比至陈', origin: '陈涉世家' },
  ] },
  { char: '鄙', kind: '实词', senses: [
    { sense: '鄙陋,目光短浅', example: '肉食者鄙,未能远谋', origin: '曹刿论战' },
    { sense: '谦辞,自己', example: '先帝不以臣卑鄙', origin: '出师表' },
    { sense: '边境,边远的地方', example: '蜀之鄙有二僧', origin: '为学' },
  ] },
  { char: '兵', kind: '实词', senses: [
    { sense: '兵器,武器', example: '兵革非不坚利也', origin: '得道多助,失道寡助' },
    { sense: '军队,士兵', example: '扶苏以数谏故,上使外将兵', origin: '陈涉世家' },
    { sense: '战争,军事', example: '兵者,国之大事', origin: '课文例句' },
  ] },
  { char: '尝', kind: '实词', senses: [
    { sense: '曾经', example: '尝射于家圃', origin: '卖油翁' },
    { sense: '品尝,辨别滋味', example: '尝一脔肉,而知一镬之味', origin: '课文例句' },
  ] },
  { char: '敌', kind: '实词', senses: [
    { sense: '敌人,仇敌', example: '恐前后受其敌', origin: '狼' },
    { sense: '攻击,胁迫', example: '屠大窘,恐前后受其敌', origin: '狼' },
    { sense: '相当,匹敌', example: '敌则能战之', origin: '课文例句' },
  ] },
  { char: '方', kind: '实词', senses: [
    { sense: '方圆,周围', example: '太行、王屋二山,方七百里', origin: '愚公移山' },
    { sense: '正,正在', example: '方欲行,转视积薪后', origin: '狼' },
    { sense: '方向,方位', example: '乃令符离人葛婴将兵徇蕲以东', origin: '陈涉世家' },
    { sense: '方法,办法', example: '助画方略', origin: '赤壁之战' },
  ] },
  { char: '恨', kind: '实词', senses: [
    { sense: '遗憾,悔恨', example: '此恨绵绵无绝期', origin: '长恨歌' },
    { sense: '怨恨,仇恨', example: '不应有恨,何事长向别时圆', origin: '水调歌头' },
  ] },
  { char: '惠', kind: '实词', senses: [
    { sense: '聪明,同“慧”', example: '甚矣,汝之不惠', origin: '愚公移山' },
    { sense: '恩惠,好处', example: '小惠未遍,民弗从也', origin: '曹刿论战' },
    { sense: '给人以好处', example: '大王加惠', origin: '唐雎不辱使命' },
  ] },
  { char: '急', kind: '实词', senses: [
    { sense: '急迫,紧急', example: '急湍甚箭', origin: '与朱元思书' },
    { sense: '着急,焦急', example: '急应河阳役', origin: '石壕吏' },
    { sense: '急需,急需的', example: '今急而求子', origin: '烛之武退秦师' },
  ] },
  { char: '遣', kind: '实词', senses: [
    { sense: '派遣', example: '康肃笑而遣之', origin: '卖油翁' },
    { sense: '打发,送走', example: '太守即遣人随其往', origin: '桃花源记' },
    { sense: '排遣,消遣', example: '何以遣怀', origin: '课文例句' },
  ] },
  { char: '强', kind: '实词', senses: [
    { sense: '强大,强盛', example: '争而不得,不可谓强', origin: '公输' },
    { sense: '勉强', example: '非夫人之物而强假焉', origin: '黄生借书说' },
    { sense: '有余,略多', example: '策勋十二转,赏赐百千强', origin: '木兰诗' },
    { sense: '坚强,刚强', example: '知困,然后能自强也', origin: '虽有嘉肴' },
  ] },
  { char: '请', kind: '实词', senses: [
    { sense: '请求,请求对方做某事', example: '曹刿请见', origin: '曹刿论战' },
    { sense: '请让我,请允许我', example: '请循其本', origin: '庄子与惠子游于濠梁之上' },
    { sense: '谒见,拜见', example: '其造请诸公,不避寒暑', origin: '课文例句' },
  ] },
  { char: '入', kind: '实词', senses: [
    { sense: '进入,与“出”相对', example: '便舍船,从口入', origin: '桃花源记' },
    { sense: '在国内,朝廷内', example: '入则无法家拂士', origin: '生于忧患,死于安乐' },
    { sense: '收入,收纳', example: '竭其庐之入', origin: '捕蛇者说' },
  ] },
  { char: '少', kind: '实词', senses: [
    { sense: '数量少,不多', example: '少时,一狼径去', origin: '狼' },
    { sense: '年轻,年少', example: '陈涉少时', origin: '陈涉世家' },
    { sense: '稍微,略微', example: '宾客意少舒', origin: '口技' },
  ] },
  { char: '适', kind: '实词', senses: [
    { sense: '到,往', example: '适千里者,三月聚粮', origin: '逍遥游' },
    { sense: '刚才,恰好', example: '适得府君书', origin: '孔雀东南飞' },
    { sense: '适合,适宜', example: '少无适俗韵', origin: '归园田居' },
  ] },
  { char: '汤', kind: '实词', senses: [
    { sense: '热水,开水', example: '媵人持汤沃灌', origin: '送东阳马生序' },
    { sense: '汤药', example: '臣侍汤药,未曾废离', origin: '陈情表' },
    { sense: '同“烫”,用热水焐', example: '疾在腠理,汤熨之所及也', origin: '扁鹊见蔡桓公' },
  ] },
  { char: '谓', kind: '实词', senses: [
    { sense: '对……说,告诉', example: '谓其妻曰', origin: '邹忌讽齐王纳谏' },
    { sense: '叫做,称为', example: '太守谓谁', origin: '醉翁亭记' },
    { sense: '认为', example: '予谓菊,花之隐逸者也', origin: '爱莲说' },
    { sense: '说,讲', example: '此之谓失其本心', origin: '鱼我所欲也' },
  ] },
  { char: '悉', kind: '实词', senses: [
    { sense: '全,都', example: '男女衣着,悉如外人', origin: '桃花源记' },
    { sense: '详尽,详细', example: '丞相亮其悉朕意', origin: '课文例句' },
  ] },
  { char: '信', kind: '实词', senses: [
    { sense: '信用,诚信', example: '日中不至,则是无信', origin: '陈太丘与友期行' },
    { sense: '相信,信任', example: '愿陛下亲之信之', origin: '出师表' },
    { sense: '确实,实在', example: '谓为信然', origin: '隆中对' },
    { sense: '通“伸”,伸张', example: '欲信大义于天下', origin: '隆中对' },
  ] },
  { char: '修', kind: '实词', senses: [
    { sense: '修建,修理', example: '乃重修岳阳楼', origin: '岳阳楼记' },
    { sense: '修养,修行', example: '静以修身', origin: '诫子书' },
    { sense: '长,高', example: '邹忌修八尺有余', origin: '邹忌讽齐王纳谏' },
    { sense: '整治,治理', example: '内修政理', origin: '隆中对' },
  ] },
  { char: '贻', kind: '实词', senses: [
    { sense: '赠送,送给', example: '尝贻余核舟一', origin: '核舟记' },
    { sense: '遗留,留下', example: '贻笑大方', origin: '课文例句' },
  ] },
  { char: '益', kind: '实词', senses: [
    { sense: '更加,越发', example: '香远益清', origin: '爱莲说' },
    { sense: '好处,益处', example: '必能裨补阙漏,有所广益', origin: '出师表' },
    { sense: '增加', example: '曾益其所不能', origin: '生于忧患,死于安乐' },
    { sense: '渐渐地', example: '益习其声', origin: '黔之驴' },
  ] },
  { char: '造', kind: '实词', senses: [
    { sense: '制造,建造', example: '公输盘为楚造云梯之械', origin: '公输' },
    { sense: '到,往', example: '造饮辄尽,期在必醉', origin: '五柳先生传' },
    { sense: '创造,创立', example: '造化钟神秀', origin: '望岳' },
  ] },
  { char: '致', kind: '实词', senses: [
    { sense: '得到,获得', example: '无从致书以观', origin: '送东阳马生序' },
    { sense: '招引,引来', example: '此人可就见,不可屈致也', origin: '隆中对' },
    { sense: '表达,表示', example: '听妇前致词', origin: '石壕吏' },
    { sense: '情趣,情致', example: '余之游将自此始,恶能无纪?已亥之二月也', origin: '满井游记' },
  ] },
  { char: '置', kind: '实词', senses: [
    { sense: '放置,安放', example: '乃取一葫芦置于地', origin: '卖油翁' },
    { sense: '摆放,设置', example: '中轩敞者为舱,箬篷覆之。旁开小窗,左右各四,共八扇', origin: '核舟记' },
    { sense: '购置,添置', example: '郑人有欲买履者,先自度其足,而置之其坐', origin: '郑人买履' },
  ] },
  { char: '逐', kind: '实词', senses: [
    { sense: '追赶,追逐', example: '夸父与日逐走', origin: '夸父逐日' },
    { sense: '跟随,随', example: '衔枚而逐之', origin: '课文例句' },
    { sense: '驱逐,放逐', example: '非吾所谓传其道解其惑者也', origin: '师说' },
  ] },
  { char: '忠', kind: '实词', senses: [
    { sense: '忠诚,尽心竭力', example: '忠之属也,可以一战', origin: '曹刿论战' },
    { sense: '忠于,对……忠诚', example: '此臣所以报先帝而忠陛下之职分也', origin: '出师表' },
    { sense: '尽力做好本分的事', example: '忠焉能勿诲乎', origin: '课文例句' },
  ] },
  { char: '竭', kind: '实词', senses: [
    { sense: '尽,完', example: '彼竭我盈,故克之', origin: '曹刿论战' },
    { sense: '用尽,竭尽', example: '竭其庐之入', origin: '捕蛇者说' },
    { sense: '干涸', example: '水竭则鱼亡', origin: '课文例句' },
  ] },
];

// 追加(去重: 已存在的 char 跳过)
const existX = new Set(g.xuci.map((x) => x.char));
const existS = new Set(g.shici.map((x) => x.char));
const addedX = newXuci.filter((x) => !existX.has(x.char));
const addedS = newShici.filter((x) => !existS.has(x.char));
g.xuci.push(...addedX);
g.shici.push(...addedS);
writeFileSync(PATH, JSON.stringify(data, null, 2), 'utf8');
console.log(`虚词 +${addedX.length}(共 ${g.xuci.length}), 实词 +${addedS.length}(共 ${g.shici.length})`);
