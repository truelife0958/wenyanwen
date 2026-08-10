# 仓库地毯式清理 + Bug 排查 + 满强度测试 — 问题与改动清单 (2026-08)

> 状态: 全部完成并验证

## A. 仓库清理（激进，保留运行必需）

| 删除项 | 大小 | 说明 |
|---|---|---|
| `ocr/` | 3.9M / 569 文件 | OCR 中间产物与历史 merge 脚本（无代码引用） |
| `data/` | 1.7M | 历史批次 batch_*.js / questions.js（仅供追溯，无引用） |
| `logs/` `test-results/` | 8K | 空/单文件 |
| `scripts/oneoff-archive/` | 7 文件 | 一次性修复工具（extract_zhenti 等） |
| `scripts/_fix-origins.py` `_scan.mjs` | 2 文件 | 临时/调试脚本 |
| `_dbg4.mjs` | 根目录 | 调试脚本 |

- build.sh 裁剪：去掉 ocr 历史管线依赖，保留 raw→runtime→validate
- package.json 新增 `test:flow` 脚本
- 清理后体积 15.3M → 9.6M（-36%，不含 node_modules/dist）
- 备份: /tmp/wyw-purge-backup/historical.tar.gz

## B. 满强度用户流测试（scripts/full-flow-test.mjs，新增）

从普通用户视角走完全链路 **38/38 通过**：

1. 首屏（标题/导航/统计/卡片）
2. 学习流（进文章→注释浮层→译文展开→笔记清单→朗读按钮）
3. 练习流（选答案→提交→判分反馈→结果页→错题自动入本）
4. 复习流（查看答案→标记错题→我的错题过滤）
5. 错题本（collections 左栏→分组删除）
6. 字词卡（翻卡→评分→SM-2 统计更新）
7. 综合题集（选组→做题）
8. 旧链接深链（#/learning、#/practice）
9. 移动端 375px 6 页无溢出
10. 全程 0 console/pageerror

## C. 边界探针（7/7 通过）

搜索无结果提示 / 继续学习横幅 / 错题空态文案 / 全部浏览模式 / 词义测验模式 / 无效路由回首页 / 无 JS 错误

## D. BUG 排查结论

- **未发现应用级 BUG**：测试暴露的均为测试脚本断言/流程逻辑问题（选择器过时、计数错位、交互顺序），已修正；产品语义（未作答算错、错题分组删除、标记去重）经验证正确
- 前几轮已修复的 BUG 在此轮满强度回归中确认稳定（判分反馈样式、错题本整合、questionIds 去重、背诵句清洗等）

## E. 文档更新

- README.md 重写：功能表/快速开始/数据管道/测试命令/技术栈/目录结构
- PROJECT_STRUCTURE.md 更新：移除 ocr/data 历史产物引用

## F. 验证结果

```
npm run check            → data:build + validate(0错) + typecheck + vite8 build + SSR ✅
node scripts/full-flow-test.mjs → 38 通过 / 0 失败
node scripts/page-scan.mjs      → 137 通过 / 0 问题
边界探针                → 7/7 通过
仓库体积                → 15.3M → 9.6M (-36%)
```
