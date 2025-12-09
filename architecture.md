# 架构设计总览（基于《需求文档.md》与《discussion-confirmation.md》）

## 目标
- 提供面向 Home & Pet Care 服务商的 Service Agreement 生成、解释与优化能力。
- 支持 intake → 生成 → 条款优化 → 下载 的端到端流程，留出支付/登录/存储的后续集成点。
- 保证可维护性：模块化分层、可替换的数据存储（本地占位→Supabase）、清晰的 API 契约与日志。

## 分层与组件
- 前端（Next.js 15 App Router）
  - 路由：`/`（落地页）、`/pricing`、`/contract`（核心流程），保留 `(legal)`、`[locale]`。
  - UI：Tailwind + shadcn/ui，左右双栏合同/解释渲染，Step 导航，表单预填与置信度标记，条款优化入口，下载按钮与权限检查。
  - 状态：brief/合同/KB/优化/权限检查 store（Context/Reducer），API client 封装，Skeleton/Toast 统一。
- 后端（Next API Routes）
  - Intake API：调用 gpt-5-mini（代理），范围判断 + brief 结构化 + field_confidence + missing_critical_fields。
  - Generate API：调用 gpt-5.1-2025-11-13（代理），输入 brief + options + kb_items → 合同 JSON（clauses + explanations + footnotes）。
  - Clause Optimize API：对单条 clause 重写（同模型），融合 user_note，返回更新后的 clause JSON。
  - KB 服务：读取 `/data/service_kb.json`，过滤 enabled，TF-IDF + 加权（service_type 0.3 / topic 0.2 / 相似度 0.5），最多 4 条，可少返；service_type 精确匹配，回退 home_services。
  - 权限检查占位：`allowed`/`reason` 返回；与 Creem/订阅后续对接。
  - 下载占位：PDF/Word 流式返回（后端渲染），无权限返回 403。
  - 日志：记录 intake/generate/optimize 输入输出、prompt、KB 选取、trace id（无需脱敏）。
- 渲染/下载（后端）
  - PDF：Playwright/Chromium 渲染合同 HTML → 流式输出。
  - Word：html-to-docx 或 docx 模板填充 → 流式输出。
  - 模板：复用前端样式或独立打印样式，抽象合同正文+引用列表组件。
- 存储与会话
  - 当前：brief 暂存用本地存储 + `resume_brief`；合同记录占位（内存/本地）。
  - 预留 Supabase 接口层：抽象存取方法，后续替换实现。
- 支付与订阅
  - 现状：Creem 接口未定，前端/后端留出调用点；下载前使用权限检查占位接口。
- 配置
  - 环境变量：`LLM_API_BASE`、`LLM_API_KEY`、`LLM_INTAKE_MODEL`（gpt-5-mini）、`LLM_GENERATE_MODEL`（gpt-5.1-2025-11-13）。
  - Vercel 部署：确保 Playwright 依赖、环境变量注入。

## 关键数据结构
- Brief：service_type/what_service/how_often/how_charge_model/how_charge_text/location_area/cancellation…/damage_cap…/has_pets/short_notes + service_specific/custom_terms。
- FieldConfidence：与 Brief 同键（除 service_specific/custom_terms）。
- Intake Response：is_supported/unsupported_reason/assistant_out_of_scope_message + brief + field_confidence + missing_critical_fields + next_action。
- Generate Response：contract_title/preamble/governing_note/clauses[]/footnotes[]/generation_meta。
- Clause Optimize：输入原 clause + user_note + contract_metadata + kb_items → 输出更新后的 clause JSON。
- KB Item：id/service_type/topic/label/summary/url/source_type/enabled/last_reviewed_at。
- 权限检查：`{ allowed: boolean, reason?: string }`。

## 核心流程（请求链路）
1) 用户在 `/` 输入描述 → `/contract?desc=...`。
2) `/contract` 初始化：调用 Intake API；is_supported=false 则展示软拒绝模板+热门类型+重新描述；否则进入预填表单。
3) 用户确认 brief → “Generate my contract” → Generate API（携带 KB 选取结果与 options）→ 渲染 Base Contract + Plain-language explanations + footnotes。
4) Step 导航：Step1（审阅）/Step2（优化）；点击跳转锚点。
5) 条款优化：选择 clause + user_note → Optimize API → 更新对应条款与解释，标记 Updated。
6) 下载：点击 PDF/Word → 权限检查 → 有权限则渲染流式下载，无权限跳转购买；异常 toast。

## 可维护性与扩展点
- 抽象接口：LLM 客户端、KB 选取、存储、日志、权限检查，便于替换实现（代理变化、Supabase 接入、支付接入）。
- 类型与校验：使用 zod 定义 DTO/响应模型，避免前后端漂移。
- 样式与模板：合同渲染组件分层（正文/解释/引用），下载模板与页面渲染共用或可配置。
- i18n：当前固定英文，预留 namespace 与字典抽象，后续扩展语言。
