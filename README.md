# 数字中枢 (dsh-digital-hub)

DSH 的分级记忆 / 情绪 / 技能中枢：把「记住什么、什么时候忘」做成一套可配置的六层结构与双轨保留策略，每轮对话按需注入相关记忆，不打扰闲聊。

## 做了什么

- **六层分级记忆**：即时（DL0）→ 巩固（DL1）→ 长期（DL2）→ 深层（DL3），另有永久层与遗忘轨
- **检索策略**：当前上下文 → DL3 摘要 → DL2 原文 → DL1 流水账，缺信息才检索
  - 每轮自动组装记忆上下文，命中不了就不注入，避免噪声
- **情绪追踪**：记录对话里的情绪走向，供记忆权重与回复语气参考
- **技能目录**：把可复用的操作沉淀成条目，便于在新会话里直接调用
- **会话模式**：输入框旁可给单个会话切三种模式——
  - 记忆接管（默认）：注入记忆，并用记忆替代历史
  - 工作模式：不注入、不压缩，但照常记录
  - **静默模式（1.1.0 新增）**：聊天**不写进记忆**（不记 L1/L2、不建向量、不做整理），但上下文**照常压缩**，更早的轮次直接收起、占位改为「（更早的历史已收起：静默模式不记记忆）」；适合用完即忘的临时对话
- **配置页**：DSH「设置 → 数字中枢」内一个 section，字段由服务端 `GET /digital-hub/api/config` 的 schema 驱动，服务端加配置项页面自动出现
- **本地存储**：数据落在 `<DSH_HOME>/digital-hub/`，配置在同目录 `config.json`，保存后重载插件生效

## 安装

```bash
dsh plugin --profile <profile> add https://github.com/qiumingzhi2006-web/dsh-digital-hub/releases/download/v1.1.0/dsh-digital-hub-1.1.0.tgz
```

或把上面这个 tgz 的 URL 作为 `spec` 交给插件市场 / 手动写进 profile 的 `package.json`：

```json
"dependencies": { "dsh-digital-hub": "https://github.com/qiumingzhi2006-web/dsh-digital-hub/releases/download/v1.1.0/dsh-digital-hub-1.1.0.tgz" }
```

并把 `dsh-digital-hub` 加进 `dsh.profile.bundles`，重启 DSH。

## 包结构

- `index.mjs` — dsh 适配层（服务注册、API 路由、每轮记忆注入）
- `memory.mjs` — 六层记忆、双轨保留、分层检索
- `llm.mjs` — 记忆/摘要用的模型调用层
- `settings.mjs` — 配置 schema 与读写
- `client.mjs` — 配置页（客户端半边，`window.__ModuleLoader__.load`）
- `star.mjs` — 星标/重要条目
- `emotion.mjs` — 情绪追踪
- `skills.mjs` — 技能目录
- `cordis.patch.yml` — bundle 补丁，`name` 必须与包名一致

## 说明

- 本仓库是从本地 `@local/dsh-digital-hub` 整理出来的公开发行版，包名改为 `dsh-digital-hub`，`cordis.patch.yml` 与 `client.mjs` 的注册 id 已同步修改。
- 不联网、不传数据；记忆与配置都只写本机 `<DSH_HOME>/digital-hub/`。
- 老用户如果原来是 `link:` 方式装的 `@local/...`，换成本包后相当于一次重装；旧数据目录不变，配置项名称若不同需要在新页面里重设一遍。

## 许可

MIT

