# 封装视觉大模型(VLM)弥补DeepSeek多模态

## Goal

封装本地 VisionProbe: playwright 截屏 → 调外部 VLM API(gemini-3.5-flash, OpenAI 兼容, 复用 models.json provider) → UI 视觉审查报告。弥补 DeepSeek 无多模态缺陷: 任何页面截图可被视觉分析(布局/色彩/对齐/对比度/美观/问题清单), 报告供文本模型消费。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
