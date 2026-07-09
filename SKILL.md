---
name: web-gateway
description: 所有需要联网检索、搜索、网页读取、平台查询、登录态网页、动态页面或网页交互的任务入口；包括用户明确要求搜索，或在任务完成过程中隐含需要实时联网信息的情形。触发后按 GitHub、OpenCLI、web-access、原生网页工具分层路由。
---

# Web-Gateway

当前我们有以下四个各有侧重的 Agent 网页检索和交互工具：

* GitHub 插件（实现 GitHub 站点的检索和交互）
* OpenCLI（实现多数主流站点的检索和交互）
* web-access（实现所有站点的检索和交互，但是对于主流站点交互能力不如 OpenCLI）
* Agent 原生检索工具（实现不带登录态的检索；前三类工具则在此基础上支持登录态访问和网页交互/修改）

Web-Gateway 的核心设计思想是融合这四者的能力。具体做法是：**按照以下步骤为每个站点匹配最合适的交互工具。一旦在某一步骤匹配成功，则直接终止该站点的工具匹配流程**。

匹配优先级为：**GitHub 插件 > OpenCLI > web-access > Agent 原生检索工具**。

## 任务准备

首先需要分解检索任务，并根据任务类型选择适配的站点渠道。例如：

* **技术类任务**（如 AI 使用、Bug 修复、产品推荐等）：可以使用 LINUX DO、NodeSeek、GitHub、Stack Exchange 等技术类网站；
* **评价与社交类任务**（如调查老师风评、搜索商品价格等）：可以使用知乎、小红书、研控、淘宝等平台；
* **学术类任务**：应优先使用学术文献类网站。

总而言之，你需要**模拟正常人类执行检索和网页操作的过程**，针对任务找到最合适的检索渠道，并逐个进行有用信息检索。当然，若任务中已经明确指定了检索站点，则直接锁定该站点范围即可。锁定范围后，按照以下步骤完成工具与渠道的匹配。

对于网页交互任务，通常会由用户指定好具体网页供你继续匹配以下工具。一般来说，GitHub 直接使用 GitHub 插件来交互即可，主流站点都可以通过 OpenCLI 来直接操作，web-access 则是对一些非主流站点如学校报名网站来做兜底操作，这也在我们下面的流程说明中体现。

## GitHub 插件层

对于 GitHub URL、repo、issue、PR、release、review、CI、代码或开源项目检索：优先检查 GitHub 插件是否能完成。若无法完成，则进入下一步。

## OpenCLI 层

读取 `opencli/skills/opencli-usage/SKILL.md`，并将 `opencli/` 视为 OpenCLI skill 的根目录。

如果 OpenCLI 能为当前 URL、平台、搜索、查询、查找或研究任务匹配到合适命令，则优先显式调用 OpenCLI；若无法完成（例如目标站点不在 OpenCLI 覆盖范围内），则进入下一层。

## web-access 层

读取 `web-access/SKILL.md`，并将 `web-access/` 视为 web-access skill 的根目录。

使用 CDP 命令通过插件开展网页检索和交互（注意非必要不做视觉捕获）。只有在 `web-access` 不可用时，才降级使用 WebSearch、WebFetch、curl、Jina 等原生轻量网页工具。

## Agent 原生检索工具层

在 `web-access` 不可用的情况下，使用 Agent 原生搜索等检索工具作为最终的兜底方案。
