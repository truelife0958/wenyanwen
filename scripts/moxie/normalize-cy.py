#!/usr/bin/env python3
"""词义默写格式统一 + 答案修复 (v6 最终版, 幂等)

单考点:  句子【考点】： ___
多考点:  句子(清标签后)：\n考点1：___\n考点2：___
答案:    考点词匹配 learning.notes (按篇优先) 替换
"""
import json, re
from pathlib import Path

RAW = Path('src/data/raw')
OUT = Path('.trellis/tasks/08-11-cy-normalize/research')
OUT.mkdir(parents=True, exist_ok=True)

def norm(s):
    return re.sub(r'[\s，,。；;！？!?：:、·…—~～""\'\'（）()【】\d\.]', '', str(s))

def build_note_map():
    learn = json.load(open(RAW / 'learning.json'))
    per_art, g_exact, g_loose = {}, {}, []
    for a in learn:
        art = {}
        for n in a.get('notes', []):
            c, t = str(n.get('char', '')).strip(), str(n.get('text', '')).strip()
            if c and t:
                art.setdefault(norm(c), t)
                g_exact.setdefault(norm(c), t)
                g_loose.append((norm(c), t))
        per_art[re.sub(r'[\s《》]', '', a['title'])] = art
    return per_art, g_exact, g_loose

def find_answer(word, per_art, art_key, g_exact, g_loose):
    w = norm(word)
    if not w:
        return None
    art = per_art.get(art_key, {})
    if w in art:
        return art[w]
    for c, t in art.items():
        if len(w) >= 2 and (w in c or c in w) and min(len(w), len(c)) >= 2:
            return t
    if w in g_exact:
        return g_exact[w]
    for c, t in g_loose:
        if w == c:
            return t
    for c, t in g_loose:
        if len(w) >= 2 and (w in c or c in w) and min(len(w), len(c)) >= 2:
            return t
    return None

def clean_tags(text, words):
    """删除标签区: 【词】：___ / 词：___ / 词前缀变体; 返回清理后句子"""
    s = text
    for w in words:
        variants = [w]
        if len(w) > 2:
            variants.append(w[1:])
        for v in variants:
            s = re.sub(r'【' + re.escape(v) + r'】[：:]\s*_{3,}\s*', '', s)
            s = re.sub(re.escape(v) + r'[：:]\s*_{3,}\s*', '', s)
            if len(v) == 1:
                # 标签可能是考点词+1字 (如 【略】标签"略无")
                s = re.sub(re.escape(v) + r'[\u4e00-\u9fa5·][：:]\s*_{3,}\s*', '', s)
    # 残渣清理: "xxx：___：" → 删标签留冒号 → 再删孤立冒号
    s = re.sub(r'[\u4e00-\u9fa5·]{1,10}[：:]\s*_{3,}\s*[：:]', lambda m: '：' if False else '', s)
    s = re.sub(r'[\u4e00-\u9fa5·]{1,10}[：:](?=$)', '', s)
    s = s.replace('：：', '：').rstrip('，,；;、:： ')
    return s

def normalize(q):
    """返回 (新 q, 考点词列表) 或 None (已规范化)"""
    q = str(q).strip()
    if not q:
        return None
    raw_words = re.findall(r'【([^】]+)】', q)
    words = list(dict.fromkeys(raw_words))
    lines = q.split('\n')
    first = lines[0]
    rest = lines[1:]
    if not words:
        # 无【】: 冒号前裸词为考点 (仅首行)
        m = re.search(r'([\u4e00-\u9fa5A-Za-z·]{1,12})[：:]\s*_{3,}', first)
        if m:
            word = m.group(1)
            sentence = first[:m.start()].strip().rstrip('，,；;、')
            new_q = f'{sentence}【{word}】： ___'
            return new_q, [word]
        return None
    if len(raw_words) == 1:
        w = words[0]
        # 已规范化: "句子【w】： ___" 且无裸标签
        if re.search(r'【' + re.escape(w) + r'】[：:]\s*_{3,}', first) and not re.search(re.escape(w) + r'[：:]\s*_{3,}', first.replace('【' + w + '】', '')):
            return None
        # 清理: 去 "【w】" 后的重复裸标签 "w：___"
        sentence = re.sub(r'【' + re.escape(w) + r'】', '【' + w + '】', first)
        sentence = re.sub(r'【' + re.escape(w) + r'】\s*' + re.escape(w) + r'[：:]\s*_{3,}', '【' + w + '】： ___', sentence)
        sentence = re.sub(r'【' + re.escape(w) + r'】', '【' + w + '】', sentence)
        # 无【w】在句中但标签"w：___" → 包【】
        if '【' + w + '】' not in sentence:
            m = re.search(re.escape(w) + r'[：:]\s*_{3,}', sentence)
            if m:
                sentence = sentence[:m.start()] + '【' + w + '】： ___' + sentence[m.end():]
        sentence = re.sub(r'([：:]\s*_{3,}){2,}', '： ___', sentence)
        sentence = re.sub(r'\s+', ' ', sentence).strip()
        if sentence == q:
            return None
        return sentence, words
    # 多考点
    def tag_re(w):
        pat = r'【?' + re.escape(w) + r'】?[：:]\s*_{3,}'
        if len(w) == 1:
            pat += r'|' + re.escape(w) + r'[\u4e00-\u9fa5·][：:]\s*_{3,}'
        return re.compile(pat)
    has_tag = any(tag_re(w).search(first) for w in raw_words)
    if not has_tag:
        return None
    sentence = clean_tags(first, raw_words)
    new_q = f'{sentence}：\n' + '\n'.join(f'{w}：___' for w in raw_words)
    return new_q, raw_words

def main():
    per_art, g_exact, g_loose = build_note_map()
    record = []
    stats = {'single': 0, 'multi': 0, 'no_bracket': 0, 'ans_fixed': 0, 'ans_kept': 0, 'mismatch': 0}
    for fn in ('moxie.json', 'moxie-legacy.json'):
        data = json.load(open(RAW / fn))
        for art in data:
            for s in art.get('sections', []):
                if s['type'] != '词义默写':
                    continue
                art_key = re.sub(r'[\s《》]', '', art['title'])
                for it in s.get('items', []):
                    q0 = it['q']
                    res = normalize(q0)
                    if not res:
                        continue
                    new_q, words = res
                    n_words = len(words)
                    if n_words > 1:
                        stats['multi'] += 1
                    elif '【' not in q0:
                        stats['no_bracket'] += 1
                    else:
                        stats['single'] += 1
                    new_ans = []
                    fixed = False
                    for w in words:
                        ans = find_answer(w, per_art, art_key, g_exact, g_loose)
                        if ans:
                            new_ans.append(ans)
                            fixed = True
                        else:
                            old = it.get('answers', [])
                            old_i = words.index(w)
                            if old_i < len(old) and old[old_i]:
                                new_ans.append(old[old_i])
                                stats['ans_kept'] += 1
                                record.append(f'答案保留: {art["title"]} {it["qid"]} “{w}”')
                            else:
                                new_ans.append('')
                                stats['mismatch'] += 1
                                record.append(f'答案缺失: {art["title"]} {it["qid"]} “{w}”')
                    if fixed:
                        stats['ans_fixed'] += 1
                    if new_q != q0:
                        it['q'] = new_q
                        record.append(f'格式: {art["title"]} {it["qid"]}: {q0[:28]} → {new_q[:38]}')
                    if new_ans:
                        HALF = str.maketrans({',': '，', ';': '；', ':': '：', '!': '！', '?': '？', '(': '（', ')': '）', '"': '“', '"': '”', "'": '‘', "'": '’'})
                        new_ans = [str(a).translate(HALF) for a in new_ans]
                    if new_ans and new_ans != it.get('answers', []):
                        it['answers'] = new_ans
                        it['blanks'] = len(new_ans)
        json.dump(data, open(RAW / fn, 'w'), ensure_ascii=False, indent=2)
    print(f"单考点 {stats['single']} / 多考点 {stats['multi']} / 无【】补 {stats['no_bracket']}")
    print(f"答案修复 {stats['ans_fixed']} / 保留 {stats['ans_kept']} / 缺失 {stats['mismatch']}")
    with open(OUT / 'fix-record.md', 'w') as f:
        f.write('# 词义默写规范化记录 (v6)\n\n')
        f.write(f"- 单考点: {stats['single']} / 多考点: {stats['multi']} / 无【】补标: {stats['no_bracket']}\n")
        f.write(f"- 答案修复(notes): {stats['ans_fixed']} / 保留旧: {stats['ans_kept']} / 缺失: {stats['mismatch']}\n")
    print('done')

if __name__ == '__main__':
    main()
