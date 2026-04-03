# 🎮 SCL Launcher

**一个现代化的 Minecraft 启动器**，采用前后端分离架构，支持深色/浅色主题、多账户管理、版本管理与多镜像加速。

---

## ⚡ 功能特性

| 状态 | 功能 | 说明 |
|------|------|------|
| 🟢 | 双主题 | 深色 + 浅色模式，实时切换 |
| 🟢 | 多账户 | 离线、微软正版、第三方皮肤站 |
| 🟢 | 版本管理 | 官方、Fabric、Forge、Quilt、OptiFine 等 |
| 🟢 | 多镜像加速 | BMCLAPI、GitCode、阿里云、腾讯云、MCBBS |
| 🟢 | 游戏启动 | 自定义内存、JVM 参数 |
| 🟢 | Java 管理 | 自动检测和下载所需版本 |
| 🟢 | 工具箱 | 内存优化、缓存清理、进程管理 |
| 🟢 | 中英双语 | 实时切换，自动记忆偏好 |
| 🟢 | 隐私保护 | 不上传任何个人数据 |

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────┐
│                    SCL Launcher                        │
├─────────────────────┬────────────────────────────────┤
│  ┌───────────────┐  │  ┌────────────────────────┐    │
│  │  React + Vite │  │  │   Electron 41          │    │
│  │  (前端界面)    │◄─┼─►│   (主进程 + IPC)      │    │
│  └───────────────┘  │  └──────────┬─────────────┘    │
│         │           │             │                   │
│         │           │  ┌─────────▼─────────────┐    │
│         │           │  │  Spring Boot 3.2      │    │
│         │           │  │  (REST API :8765)     │    │
│         │           │  └──────────┬─────────────┘    │
└─────────────────────┴────────────┼───────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      Minecraft 游戏核心       │
                    │   (.minecraft/versions/)    │
                    └─────────────────────────────┘
```

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 🔵 前端框架 | React + TypeScript | 18 / 5 |
| ⚡ 构建工具 | Vite | 8.x |
| 🎨 样式 | Tailwind CSS | 3.x |
| 📦 状态管理 | Zustand | 5.x |
| 🌐 国际化 | React-i18next | 17.x |
| 💻 桌面 | Electron | 41.x |
| ☕ 后端 | Spring Boot | 3.2 |
| ☕ 运行时 | Java | 21 |
| 🌐 HTTP | OkHttp | 4.x |

---

## 📥 下载

| 类型 | 文件 | 大小 |
|------|------|------|
| 🔴 **便携版（推荐）** | `frontend/release/SCL-Launcher-1.0.0-portable.exe` | ~104 MB |
| 🟡 解压运行 | `frontend/release/SCL-Launcher-1.0.0-win-unpacked.zip` | ~153 MB |
| 🟢 直接运行 | `frontend/dist/dist/win-unpacked/SCL Launcher.exe` | — |

> 便携版双击即用，无需安装。解压后自动启动后端服务和主程序。

---

## 🚀 快速开始

### 环境要求

| 要求 | 最低版本 |
|------|---------|
| Java | JDK 21+ |
| Node.js | 18+ |
| 系统 | Windows / macOS / Linux |

### 启动开发环境

**一键启动：**
```batch
start-dev.bat
```

**分别启动：**
```batch
:: 终端 1 — 后端
cd backend && ..\gradlew.bat bootRun
:: 终端 2 — 前端
cd frontend && npm install && npm run dev
```

启动后访问 **http://localhost:5173**

### 从源码构建

```batch
cd frontend
npm install
npm run build
node scripts/build-electron.js
npx electron-builder --projectDir dist --win --dir
```

---

## 📂 项目结构

```
scl-launcher/
├── frontend/                      # Electron 前端
│   ├── src/
│   │   ├── api/                  # API 客户端
│   │   ├── components/           # UI 组件
│   │   │   ├── layout/          # 主窗口布局
│   │   │   └── ui/              # 通用组件
│   │   ├── i18n/                # 国际化（zh-CN / en-US）
│   │   ├── pages/               # 页面（Launch / Download / Settings / Tools）
│   │   └── store/               # Zustand 状态 + 主题管理
│   ├── electron/                 # Electron 主进程
│   ├── scripts/                 # 构建脚本
│   └── release/                 # 发布产物
│
├── backend/                      # Spring Boot 后端
│   └── src/main/java/com/scl/backend/
│       ├── controller/          # REST API 控制器
│       ├── service/            # 业务逻辑 + 多镜像下载
│       ├── model/              # 数据模型
│       └── config/            # CORS 配置
│
├── start-dev.bat                # 前端 + 后端一键启动
├── start-backend.bat           # 仅启动后端
└── README.md
```

---

## 🌐 API 参考

后端运行于 `http://localhost:8765`

### 账户

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/accounts` | 获取账户列表 |
| `POST` | `/api/accounts` | 添加账户 |
| `DELETE` | `/api/accounts/{id}` | 删除账户 |

### 版本

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/versions` | 获取版本列表 |
| `GET` | `/api/versions?type=fabric` | 按类型筛选 |
| `GET` | `/api/versions/downloaded` | 已下载版本 |
| `POST` | `/api/versions/mark-downloaded` | 标记已下载 |

### 配置

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取配置 |
| `POST` | `/api/config` | 保存配置 |

### 启动

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/launch` | 启动游戏 |
| `POST` | `/api/launch/kill` | 强制关闭游戏 |
| `GET` | `/api/launch/status` | 游戏运行状态 |

### 工具

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/tools/open-folder` | 打开文件夹 |
| `POST` | `/api/tools/open-log` | 打开日志 |
| `POST` | `/api/tools/clean-cache` | 清理缓存 |
| `POST` | `/api/tools/memory-opt` | 内存优化 |
| `POST` | `/api/tools/kill-game` | 关闭游戏进程 |

---

## 💾 数据存储

| 系统 | 路径 |
|------|------|
| Windows | `%USERPROFILE%\.SCL\` |
| macOS / Linux | `~/.SCL/` |

| 文件 | 内容 |
|------|------|
| `accounts.json` | 账户数据 |
| `config.json` | 全局配置（主题/语言/下载源/Token） |
| `versions.json` | 已下载版本记录 |
| `backend.log` | 后端日志 |

---

## 🤝 贡献

欢迎提交 [Issue](https://github.com/1q7-i08mc07djv-dotcom/scl-launcher/issues) 和 Pull Request！

---

## 📄 许可证

本项目采用 **GPL v3** 开源协议。详细内容请参阅 [LICENSE](LICENSE) 文件。

> **特别条款**：未经项目所有者书面授权，禁止将本项目用于任何商业目的或修改开源协议。

---

*Minecraft 是 Mojang Studios 的注册商标。*
