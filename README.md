# Web-Gateway

如果你发现当前的 AI 联网工具不能覆盖你的检索和网页操作需求，可以看一下 `Web-Gateway`：这是一个汇总并路由现有所有 AI 联网工具能力的 Skill。

`Web-Gateway` 面向 Codex / Claude Code 等 AI Agent。它会根据网页类型和任务需求（例如是否需要浏览器登录态、是否需要页面交互），在 OpenCLI、Agent 自带检索 / 网页读取，以及 Web Access 这三类能力之间选择合适路径。

和常见 AI 联网工具对比：

| AI 联网工具 | 任意网页可用 | 登录态访问（如查看知乎收藏夹） | 动态页面读取 | 页面交互（如表单填写） | 无需反复浏览器授权 | 站点定制化（如小红书 / 知乎适配） | 内容清洗 | 组合覆盖以上能力 |
| ------------ | ------------ | -------------------------------- | ------------ | ---------------------- | ------------------ | ---------------------------------- | -------- | ---------------- |
| OpenCLI | ✕ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✕ |
| Web Access | ✓ | ✓ | ✓ | ✓ | ✕ | ✕ | ✕ | ✕ |
| Agent 自带检索 / 网页读取 | ✓ | ✕ | ✕ | ✕ | ✓ | ✕ | ✓ | ✕ |
| Web-Gateway | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

`Web-Gateway` 的核心目标是把这些能力组合起来，基于不同任务做路由：OpenCLI 能覆盖的特定站点优先使用 OpenCLI；公开网页、无需登录态和交互时优先使用 Agent 自带检索 / 网页读取；需要登录态、动态页面、DOM 读取、表单填写、文件上传、视频帧采样等能力时，再进入统一的 CDP 模式。

`Web-Gateway` fork 了 [Web Access repo](https://github.com/eze-is/web-access)，并增加了 CDP extension transport 和本地路由策略。extension transport 一次安装授权后，可以通过 `chrome.debugger` 传递 CDP 命令，减少后续任务中反复进行浏览器 remote-debugging 授权操作的成本。

## 使用方式

### 1. 安装 Skill

将仓库克隆或复制到 Agent 的 skill 目录。目录名建议保持为 `web-gateway`，这是当前 skill 的技术 ID。

```powershell
git clone https://github.com/sleepyy-dog/web-gateway "$HOME\.agents\skills\web-gateway"
```

### 2. 安装 CDP Extension Transport

打开 `chrome://extensions` 或 `edge://extensions`，启用 Developer mode，然后分别选择 **Load unpacked**：

1. 加载 `extension/`，用于 Web-Gateway CDP extension transport；
2. 加载 `extension/opencli/`，用于 OpenCLI Browser Bridge。

这两个目录是两套独立扩展，浏览器里需要分别加载一次。

### 3. 检查 CDP Extension Transport

运行检查脚本，确认 Web-Gateway 本地 daemon 和 CDP extension transport 已经连通。

```powershell
node "$HOME\.agents\skills\web-gateway\scripts\check-cdp.mjs"
```

如果输出 `cdp-extension: ready`，说明 extension transport 可用；后续 CDP 模式会优先使用该 transport。若扩展暂未连接，等待几秒后重试；仍不可用时再检查浏览器扩展是否已启用并授权。

再检查 OpenCLI Browser Bridge：

```powershell
opencli doctor
```

如果 `Extension` 和 `Connectivity` 均为 OK，说明 OpenCLI 中依赖浏览器桥接的 adapter 也可用。

### 4. 做一次任务验证

提示词：

```text
请使用 Web-Gateway 完成两个验证任务：

1. 找出我最近在浏览器里访问过的小红书帖子，告诉我标题、作者和链接，并切换点赞状态：未点赞就点赞，已点赞就取消点赞。

2. 打开 https://www.selenium.dev/selenium/web/web-form.html，在 Text input 填写 Web-Gateway smoke test，在 Textarea 填写 hello from Web-Gateway，不要点击 Submit，最后告诉我两个字段当前的值。
```

## 借鉴

`Web-Gateway` 借鉴了 OpenCLI 的站点 adapter 思路：对有明确平台语义的网站，优先使用结构化、定制化的读取和操作方式，而不是直接抓取完整页面。

它也借鉴了 Web Access 的 CDP 自动化能力，用统一 CDP 模式承接需要登录态、动态页面或页面交互的任务；`Web-Gateway` 的重点是把这些能力组织成统一路由，而不是替代其中任何一个工具。
