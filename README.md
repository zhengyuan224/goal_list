# 🎯 Goal Tracker Widget

一个基于 **Electron.js** 构建的高性能、极简主义桌面悬浮组件，用于管理日常目标与任务。界面采用 **工业感纯色银灰 (Industrial Silver-Grey)** 铝制金属质感，窗口无边框、始终置顶，并支持丝滑的拖拽排序与数据自动持久化。

---

## 📁 项目结构

```
reminder2/
├── main.js          # Electron 主进程（窗口管理与持久化）
├── preload.js       # 安全 IPC 桥接层
├── package.json     # 项目配置与依赖
└── src/
    ├── index.html   # 组件 UI 布局 (语义化 HTML5)
    ├── index.css    # 工业风样式系统 (Vanilla CSS)
    └── renderer.js  # 核心任务逻辑与拖拽交互
```

---

## 📄 核心模块说明

### `main.js` — 窗口与存储
- **智能定位**：窗口（360×600）启动时自动**吸附至屏幕右上角**。
- **持久化**：集成 `electron-store`，所有任务数据自动保存至本地 JSON 文件，重启无缝恢复。
- **无状态窗口**：无边框 (frameless)、始终置顶 (always-on-top)，确保工具随时可见。

### `src/index.css` — 视觉系统
- **工业美学**：
  - 基调：`#F5F5F7` (Apple Silver) + `#EBEBED` (Matte Aluminum)。
  - 强调色：**纯黑 (#000000)** 用于交互反馈；**翡翠绿 (#10B981)** 用于进度条。
- **动态交互**：
  - 任务卡片悬浮时的微调位移与阴影。
  - 拖拽状态下的 `scale(1.02)` 缩放与深色边框高亮。
  - 顺滑的 `slideIn` 与 `fadeOut` 添加/删除动画。

### `src/renderer.js` — 任务逻辑与拖拽
- **增强型 Drag & Drop**：
  - **手柄触发**：点击左侧 6 点阵 (⠿) 手柄方可拖拽，避免误操作。
  - **精准排序**：通过数组索引重排逻辑，确保 UI 与底层数据严格同步。
  - **吸底功能**：支持将任务直接拖拽至列表底部空白区域，实现跨越式重排。
- **状态同步**：每次修改（新增、勾选、删除、重排）均触发 `await saveTasks()`。

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 进入项目目录
cd "c:\Users\Yuanz\Desktop\interesting project\reminder2"

# 安装依赖
npm install
```

### 2. 启动应用

```bash
npm start
```

---

## ✨ 功能特性

| 功能 | 操作细节 | 视觉反馈 |
|------|---------|---------|
| **新增任务** | 底部输入框敲击 `Enter` 或点击 `+` | 向下平滑滑入动画 |
| **完成状态** | 点击左侧复选框 | 文字灰色中划线 + 进度条增长 |
| **删除任务** | 悬停点击右侧 🗑️ 图标 | 向右平滑淡出动画 |
| **拖拽排序** | 抓取左侧 ⠿ 句柄 | 行缩放 + 目标位置高亮 |
| **智能吸底** | 拖至列表下方空白处 | 直接移动至队列末尾 |
| **置顶切换** | 点击标题栏 📌 图标 | 按钮高亮状态切换 |
| **窗口吸附** | 启动或移动至靠近边缘 | 自动保持屏幕右上角位置 |
| **数据同步** | 自动实时保存 | 重启后任务与顺序完全一致 |

---

## 🛠️ 技术栈清单

- **框架**: Electron 29
- **存储**: [electron-store](https://github.com/sindresorhus/electron-store) (JSON-based)
- **字体**: Inter (Variable Font)
- **UI 组件**: 原生 HTML5 / CSS3 (Grid & Flexbox)
- **交互**: HTML5 Drag & Drop API

---

*Premium desktop utility for focused goal tracking.*

