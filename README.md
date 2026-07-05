# Web-Gateway

如果你发现当前的 AI 联网工具不能覆盖你的检索和网页操作需求，可以看一下 `Web-Gateway`：这是一个汇总并路由现有 AI 联网工具能力的 Skill。

`Web-Gateway` 面向 Codex / Claude Code 等 AI Agent。它会根据网页类型和任务需求（例如是否需要浏览器登录态、是否需要页面交互），在 OpenCLI、Agent 自带检索 / 网页读取，以及 Web Access 这三类能力之间选择合适路径。

和常见 AI 联网工具对比：

| AI 联网工具 | 任意网页可用 | 登录态访问（如查看知乎收藏夹） | 动态页面读取 | 页面交互（如表单填写） | 无需反复浏览器授权 | 站点定制化（如小红书 / 知乎适配） | 内容清洗 | 组合覆盖以上能力 |
| ------------ | ------------ | -------------------------------- | ------------ | ---------------------- | ------------------ | ---------------------------------- | -------- | ---------------- |
| OpenCLI | ✕ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ |
| Web Access | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Agent 自带检索 / 网页读取 | ✓ | ✕ | ✕ | ✕ | ✓ | ✕ | ✓ | ✕ |
| Web-Gateway | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

`Web-Gateway` 的核心目标是把这些能力组合起来，基于不同任务做路由：OpenCLI 能覆盖的特定站点优先使用 OpenCLI；公开网页、无需登录态和交互时优先使用 Agent 自带检索 / 网页读取；需要登录态、动态页面、DOM 读取、表单填写、文件上传、视频帧采样等能力时，再使用 Web Access。

本 fork 在 [Web Access repo](https://github.com/eze-is/web-access) 基础上，增加了浏览器扩展后端和本地路由策略。扩展后端一次安装授权后，可以减少后续任务中反复进行浏览器授权操作的成本。

## 使用方式

### 1. 安装 Skill

将仓库克隆或复制到 Agent 的 skill 目录。目录名建议保持为 `web-gateway`，这是当前 skill 的技术 ID。

```powershell
git clone https://github.com/sleepyy-dog/web-gateway "$HOME\.agents\skills\web-gateway"
```

### 2. 安装浏览器扩展

打开 `chrome://extensions` 或 `edge://extensions`，启用 Developer mode，然后选择 **Load unpacked**，加载本仓库的 `extension/` 目录。

### 3. 检查扩展后端

运行检查脚本，确认本地 daemon 和浏览器扩展已经连通。

```powershell
node "$HOME\.agents\skills\web-gateway\scripts\check-webext.mjs"
```

如果输出 `webext: ready`，说明扩展后端可用；后续浏览器自动化任务会优先使用该后端。若扩展暂未连接，等待几秒后重试；仍不可用时再检查浏览器扩展是否已启用并授权。

### 4. 做一次任务验证

让 Agent 执行一个需要网页读取或页面交互的任务，例如读取一个公开页面、打开需要登录态的页面，或测试一次简单的 DOM 读取。确认任务能按路由策略进入 OpenCLI、Agent 自带检索 / 网页读取，或浏览器自动化后端。

## 借鉴

`Web-Gateway` 借鉴了 OpenCLI 的站点 adapter 思路：对有明确平台语义的网站，优先使用结构化、定制化的读取和操作方式，而不是直接抓取完整页面。

它也借鉴了 Web Access 的浏览器自动化能力，用它作为需要登录态、动态页面或页面交互任务的兜底后端；`Web-Gateway` 的重点是把这些能力组织成统一路由，而不是替代其中任何一个工具。
