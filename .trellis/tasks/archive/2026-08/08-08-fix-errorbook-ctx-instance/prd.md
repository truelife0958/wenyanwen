# 修复errorbook上下文跨实例失配

## Goal

控制台刷屏 [errorbook] useErrorBook 在 Provider 外使用。根因: Vite HMR 多实例(errorbook.tsx 多次更新后旧模块 Context 与 Provider 不匹配)。根治: Context 挂 globalThis 跨实例共享 + warn 模块级去重。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
