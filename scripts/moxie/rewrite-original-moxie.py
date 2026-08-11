#!/usr/bin/env python3
"""原文默写题重写 v3: 每句保留前分句挖后分句 + 答案以 learning 原文对齐。
- 全挖句(有逗号): 答案[0]定位原文句 → 保留前分句, 挖后分句
- 部分挖句: 用保留文字定位 → 空后/前文字映射答案; 失败/引号句 → 原样
- 无效题(空数≠答案数)完全不动
- 篇级: 仅当全篇题有效且无任何完整句 → 首题首句填满 (至少保留一句)
"""
import json, re, copy, sys

def norm(s):
    return re.sub(r'[，,。；;！？!?\s“”"\'：:、（）()【】\d\.]', '', str(s))

def sentences_of(text):
    out = []
    for sent in re.split(r'[。；!?！？]', text):
        clauses = [c.strip() for c in re.split(r'[，,、]', sent) if c.strip()]
        if clauses:
            out.append(clauses)
    return out

def locate_clause(clause, orig_sents):
    nc = norm(clause)
    if not nc: return None
    for clauses in orig_sents:
        for c in clauses:
            if norm(c) == nc:
                return clauses
    return None

def split_flat(answers):
    flat = []
    for a in answers:
        flat.extend([p for p in re.split(r'[\s，,、；;]+', str(a).strip()) if p])
    return flat

def tokenize(q):
    return re.findall(r'_{3,}|[^_，,。；;！？!?\s]+|[，,。；;！？!?]', q)

def sent_split(tokens):
    sentences, cur = [], []
    for t in tokens:
        cur.append(t)
        if t in '。；;！？!?':
            sentences.append(cur); cur = []
    if cur: sentences.append(cur)
    return sentences

def has_full_sentence(q):
    """q 中是否存在完整句(切句后任一句无空)"""
    toks = tokenize(q)
    cur = []
    for t in toks:
        cur.append(t)
        if t in '。；;！？!?':
            if not any(x.startswith('_') for x in cur):
                return True
            cur = []
    if cur and not any(x.startswith('_') for x in cur):
        return True
    return False

def rewrite_item(item, orig_sents):
    q = item['q']
    flat = split_flat(item.get('answers', []))
    n_blank = len(re.findall(r'_{3,}', q))
    if len(flat) != n_blank:
        return None, f'无效题 答案{len(flat)}/空{n_blank}'
    sentences = sent_split(tokenize(q))
    ai = 0
    out_parts = []
    new_answers = []
    notes = []

    def take(n):
        nonlocal ai
        out = flat[ai:ai+n]; ai += n
        return out

    for si, sent in enumerate(sentences):
        nb = sum(1 for t in sent if t.startswith('_'))
        if nb == 0:
            out_parts.append(''.join(sent))
            continue
        kept = ''.join(t for t in sent if not t.startswith('_') and t not in '，,。；;！？!?')
        has_comma = any(t in '，,' for t in sent)
        end_p = ''.join(t for t in sent if t in '。；;！？!?') or '。'
        if not kept and has_comma:
            # 全挖有逗号
            seg = take(nb)
            clauses = locate_clause(seg[0], orig_sents) or locate_clause(''.join(seg), orig_sents)
            if not clauses:
                out_parts.append('___' + '，___' * (nb - 1) + end_p)
                new_answers.extend(seg)
                notes.append('全挖无法定位')
                continue
            if len(clauses) == 1:
                out_parts.append('___' + end_p)
                new_answers.append(clauses[0])
                continue
            out_parts.append(clauses[0] + '，___' * (len(clauses) - 1) + end_p)
            new_answers.extend(clauses[1:])
            notes.append('原文重建')
            continue
        # 部分挖/无逗号: q 与答案均原样 (不做修正, 避免引入新错误)
        seg = take(nb)
        out_parts.append(''.join(sent))
        new_answers.extend(seg)
        notes.append('原样')

    if ai != len(flat):
        return None, f'消费 {ai}/{len(flat)}'
    return {'q': ''.join(out_parts), 'answers': new_answers}, notes

def main():
    moxie = json.load(open('src/data/raw/moxie.json'))
    learning = json.load(open('src/data/raw/learning.json'))
    learn_by_id = {x['id']: x for x in learning}
    learn_by_title = {re.sub(r'[《》·、（）()\s]', '', x['title']): x for x in learning}

    stats = {'rebuilt': 0, 'fixed': 0, 'kept': 0, 'skipped': 0}
    all_rebuilt = set()   # 整篇全部为全挖重建的篇目
    for art in moxie:
        l = None
        if art.get('articleId'):
            l = learn_by_id.get(art['articleId'])
        if not l:
            key = re.sub(r'[《》·、（）()\s]', '', art['title'])
            l = learn_by_title.get(key)
        if not l or not l.get('original_text'):
            continue
        orig_sents = sentences_of(l['original_text'])
        rebuilt_here = True
        for sec in art.get('sections', []):
            if sec['type'] != '原文默写':
                continue
            for it in sec['items']:
                r, notes = rewrite_item(it, orig_sents)
                if r is None:
                    stats['skipped'] += 1
                    rebuilt_here = False
                    continue
                it['q'] = r['q']
                it['answers'] = r['answers']
                it['blanks'] = len(r['answers'])
                if any('原文重建' in n for n in notes):
                    stats['rebuilt'] += 1
                else:
                    stats['kept'] += 1
                    rebuilt_here = False
        if rebuilt_here:
            all_rebuilt.add(art['title'])

    # 篇级首句保留: 仅整篇全挖重建的篇目 + 无任何完整句
    for art in moxie:
        if art['title'] not in all_rebuilt:
            continue
        items = [it for s in art.get('sections', []) if s['type'] == '原文默写' for it in s['items']]
        if not items:
            continue
        # 全部题有效(空数==答案数拆分)且全部含空(无完整句)
        valid = True
        for it in items:
            nb = len(re.findall(r'_{3,}', it.get('q', '')))
            if nb != len(split_flat(it.get('answers', []))):
                valid = False
                break
        if not valid:
            continue
        if any(has_full_sentence(it.get('q', '')) for it in items):
            continue
        first = items[0]
        nq = first.get('q', '')
        m = re.search(r'[。；!?！？]', nq)
        first_end = m.end() if m else len(nq)
        seg = nq[:first_end]
        if '___' not in seg:
            continue
        ans = split_flat(first.get('answers', []))
        ft = tokenize(seg)
        filled = []
        ok = True
        for t in ft:
            if t.startswith('_'):
                if ans:
                    filled.append(ans.pop(0))
                else:
                    ok = False
                    break
            else:
                filled.append(t)
        if not ok:
            continue
        first['q'] = ''.join(filled) + nq[first_end:]
        first['answers'] = ans
        first['blanks'] = len(ans)
        print(f"  首句完整保留: {art['title']}")

    json.dump(moxie, open('src/data/raw/moxie.json', 'w'), ensure_ascii=False, indent=2)
    print(f"重建 {stats['rebuilt']}, 原样 {stats['kept']}, 跳过 {stats['skipped']}")

    # 终检
    d = json.load(open('src/data/raw/moxie.json'))
    multi = [(x['title'], str(a)[:22]) for x in d for s in x.get('sections', []) if s['type'] == '原文默写' for it in s.get('items', []) for a in it.get('answers', []) if re.search(r'[\s，,、；;]', str(a)) and len(str(a)) > 2]
    bad = [(x['title'], it['qid'], len(re.findall(r'_{3,}', it.get('q', ''))), len(it.get('answers', []))) for x in d for s in x.get('sections', []) if s['type'] == '原文默写' for it in s.get('items', []) if len(re.findall(r'_{3,}', it.get('q', ''))) != len(it.get('answers', []))]
    no_full = [x['title'] for x in d if any(s['type'] == '原文默写' for s in x['sections']) and not any(has_full_sentence(it.get('q', '')) for s in x['sections'] if s['type'] == '原文默写' for it in s['items'])]
    print(f'终检: 双分句答案 {len(multi)}, 空数≠答案 {len(bad)}, 无完整句篇目 {len(no_full)}')
    for t, a in multi[:5]: print(f'  multi: {t} {a}')
    for t, q, nb, na in bad[:5]: print(f'  bad: {t} {q} {nb}/{na}')
    for t in no_full[:8]: print(f'  no-full: {t}')

if __name__ == '__main__':
    main()
