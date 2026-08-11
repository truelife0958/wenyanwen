#!/usr/bin/env python3
"""legacy + book 数据修复 v2: 词义去重(归一title) + | 答案拆分 + 多小题 + 错乱section移除

1. 词义去重: title 归一化(去《》空格)匹配; legacy 同词丢弃 (book 优先); legacy 内部完全重复 (词+答案) 去重
2. answers 单元素含 | → split 为多元素, blanks 同步
3. book 理解性"默写填空"多小题拆分
4. 默写效果检测 6 篇词义 section 移除 (answers 全部错乱, 与其他篇目重复)
"""
import json, re
from pathlib import Path

RAW = Path('src/data/raw')
OUT = Path('.trellis/tasks/08-11-all-moxie-input/research')

def norm_title(t):
    return re.sub(r'[《》\s（）()「」]', '', str(t))

def norm_key(s):
    return re.sub(r'[，,。；;！？!?：:\s()（）""\'\'【】·]', '', str(s))

def split_ans(items, record):
    """answers 单元素含 | → 拆多元素, blanks 同步"""
    n = 0
    for it in items:
        ans = it.get('answers')
        if ans and len(ans) == 1 and '|' in str(ans[0]):
            parts = [a.strip() for a in str(ans[0]).split('|') if a.strip()]
            if len(parts) > 1:
                it['answers'] = parts
                it['blanks'] = len(parts)
                n += 1
    return n

def main():
    book = json.load(open(RAW / 'moxie.json'))
    legacy = json.load(open(RAW / 'moxie-legacy.json'))
    record = []

    # ===== 1. 词义去重 (title 归一化匹配 + legacy 内部) =====
    b_by_title = {}
    for b in book:
        b_by_title.setdefault(norm_title(b['title']), b)
    dedup = 0
    internal = 0
    for art in legacy:
        b_art = b_by_title.get(norm_title(art['title']))
        for s in art.get('sections', []):
            if s['type'] != '词义默写':
                continue
            b_sec = None
            if b_art:
                b_sec = next((bs for bs in b_art.get('sections', []) if bs['type'] == '词义默写'), None)
            b_keys = set()
            if b_sec:
                for bit in b_sec.get('items', []):
                    m = re.search(r'【([^】]+)】', bit['q'])
                    if m:
                        b_keys.add(norm_key(m.group(1)))
            kept = []
            seen_local = {}
            for it in s.get('items', []):
                m = re.search(r'【([^】]+)】', it['q'])
                key = norm_key(m.group(1)) if m else norm_key(it['q'])
                ans_key = norm_key(''.join(it.get('answers', [])))
                if key in b_keys:
                    dedup += 1
                    record.append(f'词义去重(bk): {art["title"]} “{key}”')
                    continue
                lk = (key, ans_key)
                if lk in seen_local:
                    internal += 1
                    record.append(f'词义去重(内): {art["title"]} “{key}”')
                    continue
                seen_local[lk] = True
                kept.append(it)
            s['items'] = kept
    print(f'词义去重: book 优先 {dedup}, legacy 内部 {internal}')

    # ===== 2. | 答案拆分 =====
    n_leg = sum(split_ans(s.get('items', []), record) for art in legacy for s in art.get('sections', []))
    n_bk = sum(split_ans(s.get('items', []), record) for art in book for s in art.get('sections', []))
    print(f'| 答案拆分: legacy {n_leg}, book {n_bk}')

    # ===== 3. book 理解性"默写填空"多小题拆分 =====
    split_total = 0
    for art in book:
        for s in art.get('sections', []):
            items = s.get('items', [])
            new_items = []
            for it in items:
                q = str(it['q'])
                if re.search(r'默写填空|补写|名句默写', q) and len(re.findall(r'\d+[\.．、]', q)) > 1:
                    parts = [p.strip() for p in re.split(r'(?=\d+[\.．、])', q) if p.strip()]
                    ans = list(it.get('answers', []))
                    if len(ans) == 1 and '|' in str(ans[0]):
                        ans = [a.strip() for a in str(ans[0]).split('|')]
                    record.append(f'book 多小题拆分: {art["title"]}/{s["type"]} {it["qid"]} → {len(parts)}')
                    for i, p in enumerate(parts):
                        ni = dict(it)
                        ni['q'] = p
                        ni['answers'] = [ans[i]] if i < len(ans) else []
                        ni['blanks'] = len(ni['answers'])
                        ni['qid'] = f"{it['qid']}:s{i + 1}"
                        new_items.append(ni)
                        split_total += 1
                else:
                    new_items.append(it)
            s['items'] = new_items
    print(f'book 多小题拆分: {split_total}')

    # ===== 4. 默写效果检测词义 section 移除 =====
    removed = 0
    for art in book:
        if art['title'].startswith('默写效果检测'):
            arts_sec = [s for s in art.get('sections', []) if s['type'] == '词义默写']
            removed += sum(len(s.get('items', [])) for s in arts_sec)
            art['sections'] = [s for s in art.get('sections', []) if s['type'] != '词义默写']
            record.append(f'移除错乱词义: {art["title"]} {removed if False else len(arts_sec)} 个 section')
    print(f'默写效果检测词义移除: {removed} 题')

    json.dump(legacy, open(RAW / 'moxie-legacy.json', 'w'), ensure_ascii=False, indent=2)
    json.dump(book, open(RAW / 'moxie.json', 'w'), ensure_ascii=False, indent=2)

    with open(OUT / 'fix-record.md', 'a') as f:
        f.write(f'\n## v2\n\n- 词义去重: book优先 {dedup}, legacy内部 {internal}\n- | 答案拆分: legacy {n_leg}, book {n_bk}\n- book 多小题拆分: {split_total}\n- 默写效果检测词义移除: {removed} 题\n')
    print('done')

if __name__ == '__main__':
    main()
