# jypora vs. Mainstream Markdown Editors

Survey of leading Markdown editors, where jypora stands, and a prioritized
improvement backlog. Editors surveyed: **Typora**(付费, 闭源), **Obsidian**
(免费个人, 闭源, 插件生态), **MarkText**(开源, 停滞), **iA Writer**(付费,
极简写作), **Zettlr**(开源, 学术), **Bear**(付费, Apple 生态), **VS Code +
Markdown 插件**(开源, 开发者向)。

## Feature matrix

| 能力 | Typora | Obsidian | MarkText | iA Writer | Zettlr | jypora (0.2.3) |
|---|---|---|---|---|---|---|
| 单栏所见即所得 | ✅ | ✅(Live Preview) | ✅ | 🟡(语法高亮式) | 🟡 | ✅ |
| 源码模式 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 文件树/工作区 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 文件模糊搜索 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **全文内容搜索(跨文件)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 大纲/目录导航 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 数学 KaTeX | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Mermaid 图表 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 主题/自定义主题 | ✅ CSS | ✅ CSS+社区 | ✅ | 🟡 | ✅ | ✅ JSON 可插拔 |
| **自动保存** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡(设置有,未生效)|
| **最近文件** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡(仅最近工作区)|
| **图片粘贴落盘(assets/)** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡(内联 base64)|
| **Copy as Markdown/HTML** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 导出 PDF/HTML/Word | ✅ | 🟡 PDF | ✅ | ✅ | ✅ | ✅ |
| **多标签/多窗口** | ✅ 窗口 | ✅ 标签 | ✅ 标签 | ✅ | ✅ | ❌ 单文档 |
| 双链/知识图谱 | ❌ | ✅ | ❌ | ❌ | ✅ | ❌(非目标) |
| 插件生态 | ❌ | ✅✅ | ❌ | ❌ | ✅ | ❌(主题可插拔) |
| 内嵌终端 | ❌ | 🟡 插件 | ❌ | ❌ | ❌ | ✅(独有) |
| 拖拽缩放面板 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 版本/同步 | 🟡 | ✅ Sync | ❌ | ✅ iCloud | ❌ | ❌(交给 git) |

## jypora 当前差距(按用户价值排序)

### P0 — 日常编辑的硬缺口
1. **自动保存未生效**:设置项存在但计时器未接线。所有主流编辑器默认可用。
2. **Copy as Markdown / Copy as HTML**:分享内容的高频操作,缺失。
3. **最近文件**:只有最近工作区;单文件打开无历史,重开成本高。

### P1 — 补齐 Typora 级体验(✅ 已全部实施)
4. ✅ **跨文件全文搜索**:侧边栏搜索现在同时返回文件名命中与行级内容命中(带预览),上限 100 条。
5. ✅ **图片粘贴落盘**:粘贴/上传图片保存为 `<文档目录>/assets/<时间戳>-<名称>`,写入相对路径;未保存文档回退 base64。
6. ✅ **Find 面板增强**:基于 Electron 原生 findInPage 的高亮 + 上一个/下一个(Enter / Shift+Enter)+ n/m 计数。
7. ✅ **未保存关闭确认**:关窗时脏文档弹 Save / Don't Save / Cancel;Save 完成后自动关闭。

### P2 — 增强与差异化
8. ✅ **多标签编辑**:标签栏 + 每标签独立文档/脏标记;`Cmd+T` 新标签、`Cmd+W` 关标签(脏文档确认)、`Ctrl+Tab` 切换;同文件去重激活。
9. ✅ **导出样式定制**:HTML/PDF 导出跟随当前主题调色板(bg/fg/border/accent)。
10. ✅ **拼写检查开关**(Edit ▸ Spell Check,持久化);打字机滚动精调、footnote UI 待做。
11. **插件机制**:主题已可插拔,后续可扩展到渲染器/命令层(待设计)。

## 已实施
**P0 批次(v0.3.0)**
- ✅ 自动保存:接线防抖计时器,File ▸ Auto Save 菜单勾选,设置持久化
- ✅ Copy as Markdown / Copy as HTML(Edit 菜单)
- ✅ 最近文件:打开/另存自动记录,File ▸ Open Recent 分「文件/工作区」两组

**P1 批次(v0.4.0)**
- ✅ 跨文件全文搜索(侧边栏 Content 分组,行级预览)
- ✅ 图片粘贴落盘 assets/(相对路径,未保存文档回退 base64)
- ✅ Find 高亮 + 上/下跳转 + n/m(原生 findInPage)
- ✅ 关窗脏文档确认(Save / Don't Save / Cancel)

**P2 批次(v0.5.0)**
- ✅ 多标签编辑(标签栏、每标签脏标记、快捷键、同文件去重)
- ✅ 导出样式跟随主题调色板
- ✅ 拼写检查开关

> 剩余:插件机制(需独立设计)、打字机滚动精调、footnote UI。
