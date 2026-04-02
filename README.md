# SCL Launcher

一个现代化的 Minecraft 启动器，基于 PCL 社区版设计，采用前后端分离架构。

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## 预览

支持深色和浅色两种主题，设计风格参考自 PCL 社区版。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript | 组件化 UI 开发 |
| 前端 | Vite | 极速构建工具 |
| 前端 | Tailwind CSS | 深色/浅色主题支持 |
| 前端 | React-i18next | 中英双语 |
| 前端 | Zustand | 轻量状态管理 |
| 后端 | Spring Boot 3.2 | REST API 服务 |
| 后端 | Java 21 | 运行环境 |
| 后端 | OkHttp | HTTP 客户端 |

## 功能特性

- 🌙 **双主题** — 深色模式 + 浅色模式，实时切换
- 🎮 **多账户支持** — 离线账户、微软正版登录、第三方皮肤站
- 📦 **版本管理** — 官方版、Fabric、Forge、Quilt、OptiFine、NeoForge 等
- ⚡ **多镜像加速** — BMCLAPI、GitCode（支持 GitHub 加速）、阿里云、腾讯云、MCBBS
- 🧩 **游戏启动** — 自定义内存分配、JVM 参数配置
- ☕ **Java 管理** — 自动检测和下载所需版本的 Java
- 🛠️ **工具箱** — 内存优化、缓存清理、进程管理等
- 🌐 **中英双语** — 实时切换，自动记忆偏好
- 💾 **数据持久化** — 所有配置保存在 `~/.SCL/` 目录

## 快速开始

### 环境要求

- **Java**: JDK 21 或更高版本
- **Node.js**: 18 或更高版本
- **系统**: Windows / macOS / Linux

### 启动开发环境

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

## 项目结构

```
scl-launcher/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── api/               # API 客户端
│   │   ├── components/         # UI 组件
│   │   │   ├── layout/       # 主窗口布局
│   │   │   └── ui/           # PCL 风格组件
│   │   ├── i18n/             # 国际化（zh-CN / en-US）
│   │   ├── pages/             # 页面组件
│   │   └── store/            # 状态管理 + 主题
│   └── ...
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

## API 参考

后端服务运行在 `http://localhost:8765`

### 账户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/accounts` | 获取账户列表 |
| POST | `/api/accounts` | 添加账户 |
| DELETE | `/api/accounts/{id}` | 删除账户 |

### 版本

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/versions` | 获取版本列表 |
| GET | `/api/versions?type=fabric` | 按类型筛选 |
| GET | `/api/versions/downloaded` | 已下载版本 |
| POST | `/api/versions/mark-downloaded` | 标记已下载 |

### 配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取配置 |
| POST | `/api/config` | 保存配置 |

### 启动

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/launch` | 启动游戏 |
| POST | `/api/launch/kill` | 强制关闭游戏 |
| GET | `/api/launch/status` | 游戏运行状态 |

### 工具

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tools/open-folder` | 打开文件夹 |
| POST | `/api/tools/open-log` | 打开日志文件 |
| POST | `/api/tools/clean-cache` | 清理缓存 |
| POST | `/api/tools/memory-opt` | 内存优化 |
| POST | `/api/tools/kill-game` | 关闭游戏进程 |

## 数据存储

配置文件保存在用户目录下：

| 系统 | 路径 |
|------|------|
| Windows | `%USERPROFILE%\.SCL\` |
| macOS | `~/.SCL/` |
| Linux | `~/.SCL/` |

包含文件：
- `accounts.json` — 账户数据
- `config.json` — 全局配置（主题/语言/下载源/Token 等）
- `versions.json` — 已下载版本记录
- `backend.log` — 后端日志

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目仅供学习和研究使用。Minecraft 是 Mojang Studios 的注册商标。
