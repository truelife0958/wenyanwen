#!/usr/bin/env python3
"""AI 生成经典中考试题 + 数据校正.

对每个必考/core篇目:
  1. 根据原文+译文+分析, 生成 6-8 道中考真题型题(默写+实词+翻译+选择+主旨+写法)
  2. 校正译文一致性 (可选 flag --verify)
  3. 生成核心考点简表(供前端"考点卡片"展示)

用法:
  python scripts/gen-exam-questions.py --articles 5    # 先跑 5 篇试水
  python scripts/gen-exam-questions.py --all            # 跑全部 must+core
  python scripts/gen-exam-questions.py --verify        # 仅校正译文一致性
"""
import json, os, sys, time, urllib.request, urllib.error, argparse, pathlib
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
RUN = ROOT / "src/data/runtime"
OUT = ROOT / "src/data/runtime/exam-generated.json"

CONF = json.load(open(os.path.expanduser("~/.pi/agent/models.json")))
PROV = os.environ.get("GEN_PROV", "cpa")
MODEL = os.environ.get("GEN_MODEL", "z-ai/glm-5.2")
P = CONF["providers"][PROV]
EP = P["baseUrl"].rstrip("/") + "/chat/completions"
KEY = P["apiKey"]
# 复用 exam-tags 的等级映射
sys.path.insert(0, str(ROOT))
# exam-tags 是 ts, 直接内联必要清单
MUST_TITLES = [
    "论语十二章","岳阳楼记","醉翁亭记","出师表","桃花源记","小石潭记","陋室铭","爱莲说","马说",
    "曹刿论战","邹忌讽齐王纳谏","三峡","使至塞上","春望","钱塘湖春行","望岳","酬乐天扬州初逢席上见赠",
    "水调歌头(明月几时有)","破阵子·为陈同甫赋壮词以寄之","过零丁洋","行路难（其一）","白雪歌送武判官归京",
    "茅屋为秋风所破歌","观沧海","天净沙·秋思","送杜少府之任蜀州","黄鹤楼","渔家傲·秋思","江城子·密州出猎",
]
CORE_TITLES = [
    "记承天寺夜游","卖炭翁","卖油翁","送东阳马生序","湖心亭看雪","与朱元思书","答谢中书书",
    "生于忧患，死于安乐","富贵不能淫","愚公移山","孙权劝学","陈太丘与友期行","咏雪","狼","核舟记",
    "周亚夫军细柳","送友人","饮酒（其五）","赤壁","泊秦淮","夜雨寄北","己亥杂诗(其五)","登飞来峰",
    "游山西村","十一月四日风雨大作（其二）","卜算子·咏梅","相见欢(无言独上西楼)","山坡羊·潼关怀古",
    "南乡子·登京口北固亭有怀","登幽州台歌","望洞庭湖上张丞相","渡荆门送别",
]

def load_articles():
    arts = json.load(open(RUN/"articles.json"))
    by_title = {a["title"]: a for a in arts}
    return by_title

PROMPT_GEN = """你是中考语文命题专家。为以下文言文/古诗词生成 6-8 道经典中考试题型题目。

篇目: {title} ({dynasty}·{author})
出处: {origin}
原文:
{original}
译文:
{translation}
写作手法分析:
{analysis}

请围绕中考高频考点生成题目, 每道题类型必须取自: choice(选择), blank(默写填空), translate(句子翻译), explain(实词解释), short(简答/主旨), discuss(拓展论述)。
输出一个 JSON 数组, 每个元素 schema:
{{
  "id": "{id_base}-X",
  "articleId": "{id}",
  "articleTitle": "{title}",
  "scope": "article",
  "type": "choice|blank|translate|explain|short|discuss",
  "stem": "题干",
  "options": ["A. ...", "B. ...", ...],
  "answer": "标准答案",
  "analysis": "解析说明(考点+思路)",
  "points": ["考点1","考点2"],
  "origin": "exam-gen",
  "level": "must|core"
}}

要求:
1. 覆盖本篇 4-6 个核心考点, 不重复题目套路
2. 默写题(blank)必须针对必背名句
3. 选择题(choice)4 选项, 干扰项有迷惑性但科学
4. 翻译题(translate)选重点句, 答案规范
5. 写法分析为 short/discuss 题, 主旨题必出
6. 难度对标中考, 不超纲
7. 只返回 JSON 数组, 不要其他文字
"""

def call_model(prompt, expect_json_array=True):
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 8000,
    }).encode()
    req = urllib.request.Request(EP, data=body, headers={"Content-Type":"application/json",
                                                          "Authorization": f"Bearer {KEY}"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.load(r)
            text = data["choices"][0]["message"]["content"]
            # 提取 JSON 数组 (容许 ```json ... ``` 包裹)
            m = text.replace("```json","").replace("```","").strip()
            # 找第一个 [ 到最后一个 ]
            s, e = m.find("["), m.rfind("]")
            if s < 0 or e < 0: raise ValueError("no JSON array found")
            return json.loads(m[s:e+1])
        except (urllib.error.URLError, TimeoutError) as ex:
            print(f"  retry {attempt+1}: {ex}")
            time.sleep(5)
    raise RuntimeError("model call failed after retries")

def get_para_analysis(a):
    """汇聚段落分析与整篇精要,作为生成上下文"""
    parts = []
    r = a.get("reading", {})
    if r.get("analysis"):
        for k in ("theme","outline","writing","culture"):
            v = r["analysis"].get(k)
            if v: parts.append(f"[{k}] {v}")
    for p in r.get("paragraphs", []):
        if p.get("analysis"): parts.append(f"段落({p.get('number','?')}): {p['analysis']}")
    return "\n".join(parts) or "(无分析)"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--articles", type=int, default=0, help="仅跑前 N 篇试水")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--verify", action="store_true", help="仅校正译文")
    ap.add_argument("--level", default="must", choices=["must","core","both"])
    args = ap.parse_args()

    by_title = load_articles()
    titles = []
    if args.level in ("must","both"): titles += MUST_TITLES
    if args.level in ("core","both"): titles += CORE_TITLES
    if args.articles:
        titles = titles[:args.articles]

    print(f"准备处理 {len(titles)} 篇 (provider={PROV} model={MODEL})")
    all_qs = []
    done = 0
    for i, title in enumerate(titles, 1):
        a = by_title.get(title)
        if not a:
            print(f"[{i}] 跳过(找不到数据): {title}")
            continue
        original = a["reading"].get("original","")[:2500]
        translation = a["reading"].get("translation","")[:1500]
        analysis = get_para_analysis(a)
        prompt = PROMPT_GEN.format(
            title=title, dynasty=a.get("dynasty",""), author=a.get("author",""),
            origin=a.get("origin",""), id=a["id"], id_base=a["id"].replace("article-",""),
            original=original, translation=translation, analysis=analysis[:2000],
        )
        try:
            qs = call_model(prompt)
            if not isinstance(qs, list): qs = []
            # 规整
            for j, q in enumerate(qs):
                q.setdefault("id", f"{a['id']}-{j+1}")
                q["articleId"] = a["id"]
                q["articleTitle"] = title
                q["scope"] = "article"
                q["origin"] = "exam-gen"
            all_qs.extend(qs)
            done += 1
            print(f"[{i}] {title}: 生成 {len(qs)} 题")
        except Exception as ex:
            print(f"[{i}] {title}: ✗ 失败 {ex}")
        if i % 5 == 0:
            # 中途存盘
            OUT.write_text(json.dumps(all_qs, ensure_ascii=False, indent=2))
            print(f"  中途存盘 {len(all_qs)} 题 -> {OUT}")
        time.sleep(1)  # rate limit friendly

    OUT.write_text(json.dumps(all_qs, ensure_ascii=False, indent=2))
    print(f"\n✅ 完成 {done}/{len(titles)} 篇, 共生成 {len(all_qs)} 道中考题")
    print(f"输出: {OUT}")

if __name__ == "__main__":
    main()
