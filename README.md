# SCL Launcher 🎮

一个现代化的 Minecraft 启动器，采用前后端分离架构。

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Electron](https://img.shields.io/badge/Electron-41-purple)
![License](https://img.shields.io/badge/License-GPL%20v3-blue)

## ✨ 预览

支持深色和浅色两种主题，采用PCL-CE风格的现代化UI设计。

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────┐
│               SCL Launcher                   │
└─────────────────────────────────────────────┘
├── Frontend (Electron)
│   ├── React 18 + TypeScript
│   ├── Vite (极速构建工具)
│   ├── Tailwind CSS (现代化CSS框架)
│   ├── React-i18next (国际化支持)
│   └── Zustand (轻量状态管理)
├── Backend (Spring Boot)
│   ├── Spring Boot 3.2
│   ├── Java 21
│   └── OkHttp (HTTP客户端)
└── 核心功能
    ├── 账户管理
    ├── 版本管理
    ├── 游戏启动
    ├── 配置管理
    └── 工具功能
```

## 📊 功能特性

### 🎨 界面特性
- 🌙 **双主题支持** — 深色模式 + 浅色模式，实时切换
- 🌐 **中英双语** — 国际化支持，自动记忆偏好
- 💻 **现代化UI** — 采用PCL-CE风格设计

### 🎮 游戏特性
- 📦 **版本管理** — 官方版、Fabric、Forge、Quilt、OptiFine、NeoForge等
- ⚡ **多镜像加速** — BMCLAPI、GitCode（支持GitHub加速）、阿里云、腾讯云、MCBBS
- 🧩 **游戏启动** — 自定义内存分配、JVM参数配置

### ⚙️ 工具特性
- ☕ **Java管理** — 自动检测和下载所需版本的Java
- 🛠️ **工具箱** — 内存优化、缓存清理、进程管理
- 🔒 **隐私保护** — 不上传任何个人数据，完全本地存储
- 💾 **数据持久化** — 所有配置保存在用户目录

## 📥 下载发布版

### 🚀 单文件便携版（推荐）
```
frontend\release\SCL-Launcher-1.0.0-portable.exe
```
双击即用，无需安装。解压后自动运行后端服务和主程序。

### 🖥️ 直接运行版
```
frontend\dist\dist\win-unpacked\SCL Launcher.exe
```

### 📦 压缩包
```
frontend\release\SCL-Launcher-1.0.0-win-unpacked.zip
```

## 🏃 快速开始

### 📋 环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Java | JDK 21 或更高 | 后端运行环境 |
| Node.js | 18 或更高 | 前端运行环境 |
| 操作系统 | Windows / macOS / Linux | 跨平台支持 |

### 🚀 启动开发环境

**方式一：一键启动**
```batch
start-dev.bat
```

**方式二：分别启动**

终端 1 — 后端：
```batch
cd backend
..\gradlew.bat bootRun
```

终端 2 — 前端：
```batch
cd frontend
npm install
npm run dev
```

启动后访问 **http://localhost:5173**

### 🏗️ 从源码构建发布版

```batch
cd frontend
npm install
npm run build
node scripts/build-electron.js
npx electron-builder --projectDir dist --win --dir
```

构建产物输出到 `frontend\release\`。

## 📁 项目结构

```
scl-launcher/
├── frontend/                    # Electron 前端
│   ├── src/
│   │   ├── api/               # API 客户端
│   │   ├── components/        # UI 组件
│   │   │   ├── layout/        # 主窗口布局
│   │   │   └── ui/            # 通用 UI 组件
│   │   ├── i18n/              # 国际化（zh-CN / en-US）
│   │   ├── pages/             # 页面组件
│   │   └── store/             # 状态管理 + 主题
│   ├── electron/               # Electron 主进程
│   ├── scripts/                # 构建脚本
│   └── release/                # 发布产物
│
├── backend/                    # Spring Boot 后端
│   └── src/main/java/com/scl/backend/
│       ├── controller/         # REST API 控制器
│       ├── service/           # 业务逻辑 + 多镜像支持
│       ├── model/             # 数据模型
│       └── config/            # CORS 等配置
│
├── start-dev.bat               # 前端 + 后端一键启动
├── start-backend.bat           # 仅启动后端
└── README.md
```

## 🔧 API 参考

后端服务运行在 `http://localhost:8765`

### 📝 账户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| ✅ GET | `/api/accounts` | 获取账户列表 |
| ✅ POST | `/api/accounts` | 添加账户 |
| ✅ DELETE | `/api/accounts/{id}` | 删除账户 |

### 📦 版本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| ✅ GET | `/api/versions` | 获取版本列表 |
| ✅ GET | `/api/versions?type=fabric` | 按类型筛选 |
| ✅ GET | `/api/versions/downloaded` | 已下载版本 |
| ✅ POST | `/api/versions/mark-downloaded` | 标记已下载 |

### ⚙️ 配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| ✅ GET | `/api/config` | 获取配置 |
| ✅ POST | `/api/config` | 保存配置 |

### 🎮 游戏启动

| 方法 | 路径 | 说明 |
|------|------|------|
| ✅ POST | `/api/launch` | 启动游戏 |
| ✅ POST | `/api/launch/kill` | 强制关闭游戏 |
| ✅ GET | `/api/launch/status` | 游戏运行状态 |

### 🛠️ 工具箱

| 方法 | 路径 | 说明 |
|------|------|------|
| ✅ POST | `/api/tools/open-folder` | 打开文件夹 |
| ✅ POST | `/api/tools/open-log` | 打开日志文件 |
| ✅ POST | `/api/tools/clean-cache` | 清理缓存 |
| ✅ POST | `/api/tools/memory-opt` | 内存优化 |
| ✅ POST | `/api/tools/kill-game` | 关闭游戏进程 |

## 💾 数据存储

配置文件保存在用户目录下：

| 系统 | 路径 |
|------|------|
| 🪟 Windows | `%USERPROFILE%\.SCL\` |
| 🍎 macOS | `~/.SCL/` |
| 🐧 Linux | `~/.SCL/` |

包含文件：
- `accounts.json` — 账户数据
- `config.json` — 全局配置（主题/语言/下载源/Token等）
- `versions.json` — 已下载版本记录
- `backend.log` — 后端日志

## 📈 工作流程

1. 🎯 用户打开启动器
2. 👤 选择或创建账户
3. 📦 选择游戏版本
4. ⚙️ 配置游戏设置
5. 🎮 启动游戏
6. 📊 监控游戏状态

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 **GPL v3** 开源协议，详细内容请参阅 [LICENSE](LICENSE) 文件。

> ⚠️ 特别条款：未经项目所有者书面授权，禁止将本项目用于任何商业目的或修改开源协议。

Minecraft 是 Mojang Studios 的注册商标。

---

**SCL Launcher** - 一个现代化、开源、跨平台的Minecraft启动器，致力于提供最佳的游戏体验 🎮