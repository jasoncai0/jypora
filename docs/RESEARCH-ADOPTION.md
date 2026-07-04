# 二轮调研:外部工具能力引入评估

基于三路并行调研(2026-07):Obsidian 生态(4000+ 插件、下载榜)、块编辑器交互范式
(Notion/Craft)与新兴开源编辑器(MarkEdit/AFFiNE/Anytype/Logseq/SiYuan)、
AI 辅助写作与实用功能。评估维度:用户价值(有证据的口碑)× 引入成本 × 与 jypora
「文件优先、干净 Markdown、内嵌终端」定位的契合度。

## 市场判断(影响所有决策)

- **生态位空缺**:MarkText 自 2022 年停更、Typora 付费闭源、Logseq 重写停滞 —
  「持续维护的开源 Typora」是真实空缺,jypora 恰在此位。
- **性能标杆**:MarkEdit(4MB、10MB 大文件流畅)证明"快而克制"本身就能赢得口碑。
- **反面教训**:Anytype/SiYuan 因导出失真(MD round-trip 丢内容)被用户punish —
  **任何破坏 .md 可移植性的块特性都要慎重**。
- **AI 疲劳是实证趋势**:环境式/强推 AI 已成负面信号;用户只认可**主动调用**的 AI。
- **jypora 结构性优势**:内嵌终端 = Claude Code CLI 即开即用,所有高价值 AI 交互
  可以零 API-key、零 RAG 基建实现 — 竞品需要数月做的事我们是胶水代码。

## 决策矩阵

### ✅ 引入 — 第一批(高价值 × 低成本)
| 能力 | 证据 | 成本 |
|---|---|---|
| **粘贴 URL 到选中文本→链接** | VS Code 已内置、四大编辑器社区反复请求,零学习成本 | ~1 天 |
| **命令面板 Cmd+Shift+P** | VS Code/Obsidian 肌肉记忆;键盘流核心 | 低(fuzzy 弹层 + 命令注册表) |
| **快速打开器强化(create-on-miss)** | Obsidian Quick Switcher:没有就创建,消除记录摩擦 | 低(复用 Cmd+P 基建) |
| **Callouts `> [!note]`** | Obsidian 核心;痛点在插入 UX,接入 `/` 菜单即反超 | 低-中 |
| **表格 UI 打磨** | Typora 表格编辑是购买理由;Crepe 表格组件已有行列拖拽/对齐 | 低(大半是配置) |
| **字数目标/写作统计** | Ulysses 头牌付费功能,"a great motivator" | 低(3-5 天) |
| **模板 + 每日笔记** | Templater 4.7M 下载(#2);零摩擦捕捉入口 | 低(静态模板变量) |

### ✅ 引入 — 第二批(差异化,发挥终端优势)
| 能力 | 证据 | 成本 |
|---|---|---|
| **选中文本 AI 改写(Cmd+K 式)** | Cursor 模式是公认最有价值的 AI 交互;经内嵌 Claude CLI 实现,无需 API key | 中(1-2 周,浮层+diff 接受/拒绝) |
| **文档→终端上下文桥** | "把当前文档/选区发给终端 agent" — 别人要做 RAG,我们是管道 | 低(days) |
| **AI 内容标记(iA Writer Authorship)** | 逆 AI 疲劳潮流的口碑差异化;标记 AI 插入的 span | 中-高(可随改写功能一起做) |
| **本地快照/版本历史** | Obsidian File Recovery "never lose a note again";信任型功能 | 中(1-2 周,含 diff UI) |
| **标题折叠(视图态)** | 长文档强需求;选视图态方案**不污染 MD 文件** | 中(1-3 周) |

### 🟡 有条件引入(取决于产品定位走向)
| 能力 | 条件 |
|---|---|
| **Wiki-links `[[]]` + 反链面板 + 局部关系图** | Obsidian 口碑第一的"identity feature",但价值依赖 vault 定位;需要工作区级链接索引服务(一次建成可解锁反链/图谱/dataview-lite 三件事)。**若 jypora 走「个人知识库」方向则必做**,纯文档编辑器方向则缓 |
| **Dataview-lite** | 同上,依赖元数据索引;先看 wiki-links 是否立项 |

### ❌ 不引入
| 能力 | 理由 |
|---|---|
| **Synced blocks** | 文件优先定位强冲突;MD 无原生 transclusion,破坏可移植性;SiYuan/Anytype 的导出失真被用户punish |
| **Canvas 无限画布** | High 成本;Excalidraw 需求真实但属独立产品面;远期可评估 JSON Canvas 开放格式 |
| **Continue-writing / 环境式 AI 补全** | 实证为 hype;iA Writer 靠反其道而行拿设计大奖;逐键调用成本高 |
| **编辑器内 markdown lint** | WYSIWYG 序列化本身就产出规范 MD,消除了大部分 lint 类别;需要时在内嵌终端跑 `markdownlint-cli2` 即可 |
| **Graph View 全局图** | 情绪价值>实用价值(社区自认);局部图随 wiki-links 顺带,全局图不单独立项 |

## 建议执行顺序

1. **Round 1(速赢包)**:粘贴 URL 成链、命令面板 + 快速打开、Callouts(接入 `/` 菜单)、
   字数统计/目标、模板与每日笔记 — 全部低成本,合计约 1-2 周。
2. **Round 2(差异化包)**:AI 选中改写 + 文档→终端桥 + AI 标记、本地快照。
3. **决策点**:是否走 vault/知识库定位 → 决定 wiki-links 索引服务立项与否。

> 状态更新记录在本文件;完成项移入 COMPARISON.md 的已实施清单。
