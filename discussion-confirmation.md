# 需求讨论确认

## 已确认决策
- KB 筛选：按 service_type 精确匹配，退化到 home_services；TF-IDF 相似度 + 加权评分（service_type 0.3，topic 0.2，其余 0.5），最多取 4 条，不足可少返。
- 下载生成：后端实时渲染 HTML→PDF（Playwright/Chromium）并流式返回；Word 采用 html-to-docx 或模板填充，同样流式返回；后续接入存储可改预签名 URL。
- 环境变量：统一使用 `LLM_API_BASE`、`LLM_API_KEY`、`LLM_INTAKE_MODEL`、`LLM_GENERATE_MODEL`，便于代理与模型切换。
- brief 暂存：在未接 Supabase 前，用本地存储 + `resume_brief` 过渡；后续切换 Supabase。
- 日志：记录 intake/generate/optimize 输入输出、KB 选取、trace id；无需脱敏。

## 待补充设计
- PDF/Word 渲染样式来源：是否直接复用前端（Tailwind/shadcn）样式，或单独定义渲染模板？
- 权限检查 & 下载接口占位：是否固定返回结构 `{ allowed: boolean, reason?: string }`，错误码用标准 401/403/500？需确认前后端约定。
