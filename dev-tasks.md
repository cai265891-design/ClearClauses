# 开发任务拆解（基于《需求文档.md》与《discussion-confirmation.md》）

## 环境与配置
- [ ] 配置环境变量：`LLM_API_BASE`、`LLM_API_KEY`、`LLM_INTAKE_MODEL`、`LLM_GENERATE_MODEL`；区分 dev/prod。
- [ ] 代理接口封装：统一的 HTTP client（含重试、超时、错误映射）。
- [ ] 基础异常与响应格式约定（后端/前端通用）。

## 数据与存储（过渡方案 + 预留 Supabase）
- [ ] brief 暂存：本地存储 + URL `resume_brief` 恢复，占位实现；预留切换 Supabase 的抽象接口。
- [ ] 合同记录（30 天）接口占位：先存内存/本地，接口契约预留。
- [ ] 日志存储抽象：intake/generate/optimize/kb 选取日志结构，落地方式可切换（先本地文件/内存，后续 Supabase）。
- [ ] 数据模型定义：Brief、Contract、Clause、KBItem、PaymentPermission（占位）、LogEntry。

## 知识库（KB）
- [ ] KB 文件结构：`/data/service_kb.json`（空数组初始）；schema 校验。
- [ ] KB 选取逻辑：TF-IDF + 加权（service_type 0.3，topic 0.2，全文相似度 0.5），最多 4 条，不足可少返；service_type 精确匹配，退化到 home_services。
- [ ] KB 管理占位接口（读取、过滤 enabled）。

## 后端服务与 API 封装
- [ ] ContractIntake 服务封装（gpt-5-mini）：请求/响应 DTO，支持 is_supported 分流、field_confidence、missing_critical_fields。
- [ ] Generate 服务封装（gpt-5.1-2025-11-13）：输入 brief + options + kb_items；输出合同 JSON（clauses/explanations/footnotes/meta）。
- [ ] Clause 优化服务封装（同模型）：输入单条 clause + user_note + kb_items，输出更新后的 clause JSON。
- [ ] 权限检查占位接口：`GET /api/download/permission` → `{ allowed: boolean, reason?: string }`。
- [ ] 下载流式接口占位：`GET /api/download?(format=pdf|docx&id=...)`，内联文件流；无权限返回 403。
- [ ] 日志记录中间件：请求体、响应体、prompt、kb 选取、trace id。

## 渲染与下载（后端）
- [ ] PDF 渲染：Playwright/Chromium 渲染 HTML 模板 → 流式返回；模板复用前端样式或独立样式方案待定。
- [ ] Word 生成：html-to-docx 或 docx 模板填充 → 流式返回。
- [ ] 模板与样式抽象：合同正文 + 引用列表的可复用组件。

## 前端：全局
- [ ] 状态管理：brief、合同、KB、优化状态、权限检查的 store/contexts。
- [ ] API client 与错误提示（toast）规范。
- [ ] Loading/skeleton 与错误态统一。

## 前端：落地页（/）
- [ ] Hero 输入框 → 跳转 `/contract?desc=...`。
- [ ] 优势/步骤/示例/对比/FAQ/CTA 文案与布局。
- [ ] 响应式与 hover/滚动体验。

## 前端：价格页 (/pricing)
- [ ] 会员/单份权益卡片（Free/Single/Monthly/Yearly）。
- [ ] 单份购买入口（跳转/占位），与下载权限联动预留。

## 前端：合同生成页 (/contract)
- Step 导航
  - [ ] 顶部 Step 1/Step 2 tab + URL `step` 参数滚动锚点。
- Step 1 · Review base contract
  - [ ] 页面初始化：根据 `desc` 调 Intake；is_supported=false 时展示软拒绝模板 + 热门类型按钮 + 重新描述输入。
  - [ ] 预填表单（service_type/what_service/how_often/how_charge...）+ 置信度标记（>=0.8 ✅，0.4–0.8 普通，<0.4 占位/留空）。
  - [ ] missing_critical_fields 以提醒呈现，不阻塞生成。
  - [ ] “Generate my contract” 调用 generate API，渲染 Base Contract & Explanations。
  - [ ] Skeleton/loading 状态。
  - [ ] 左右联动高亮（hover/click 同步）。
  - [ ] Citation Data 匹配 reference_ids → footnotes。
  - [ ] 下载按钮（PDF/Word）：loading → 权限检查 → 有权限则调下载接口；无权限跳转购买；失败 toast。
- Step 2 · Optimize specific terms
  - [ ] 下拉选择条款（自动生成选项）+ 输入框占位联动。
  - [ ] 未选条款或输入为空时禁用发送。
  - [ ] 发送后：禁用控件、按钮 loading、左右卡片“Updating…”状态；成功更新卡片内容并标记 Updated；失败恢复并保留输入。

## 登录与恢复（过渡方案）
- [ ] 无登录首次生成；再次生成需登录的占位流程。
- [ ] Magic link/OAuth 占位；`?resume_brief={{brief_id}}` 恢复逻辑（本地存储 + URL）。

## 权限与支付（占位）
- [ ] Creem 支付/订阅接口尚无：预留调用点与错误提示；下载前使用权限检查占位接口。
- [ ] 会员/单份状态的前端表示与跳转（无具体扣款逻辑）。

## 国际化
- [ ] 当前固定英文文案；预留 i18n 结构（命名空间/字典）但先不切换。

## 质量与运维
- [ ] ESLint/格式化检查（pnpm lint）。
- [ ] 基础单测/集成测试占位（尤其 KB 筛选、API DTO 校验）。
- [ ] 日志采样与开关（避免噪声）；敏感信息当前不脱敏（按确认）。
- [ ] 部署配置：Vercel 环境变量占位、构建命令、Chromium 依赖检查（如需 Playwright）。
