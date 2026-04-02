# SCL 启动器 - 前端 + 后端

基于 PCL 社区版设计的 Minecraft 启动器，采用前后端分离架构。

## 技术栈

**前端**
- React 18 + TypeScript
- Vite
- Tailwind CSS（深色主题）
- React-i18next（多语言）
- Zustand（状态管理）
- Lucide React（图标）

**后端**
- Spring Boot 3.2
- Java 21
- OkHttp（HTTP 客户端）
- Gson（JSON 处理）

## 快速开始

### 1. 编译后端

```batch
cd backend
..\gradlew.bat build
```

### 2. 启动后端

```batch
..\gradlew.bat bootRun
```

后端将在 `http://localhost:8765` 启动。

### 3. 启动前端

```batch
cd frontend
npm install   # 首次需要安装依赖
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 4. 一键启动（开发模式）

```batch
start-dev.bat
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/accounts | 获取账户列表 |
| POST | /api/accounts | 添加账户 |
| DELETE | /api/accounts/{id} | 删除账户 |
| GET | /api/versions | 获取版本列表 |
| GET | /api/versions?type=fabric | 获取特定类型版本 |
| GET | /api/versions/downloaded | 获取已下载版本 |
| POST | /api/versions/mark-downloaded | 标记版本已下载 |
| GET | /api/config | 获取配置 |
| POST | /api/config | 保存配置 |
| POST | /api/launch | 启动游戏 |
| POST | /api/launch/kill | 关闭游戏 |
| POST | /api/tools/open-folder | 打开文件夹 |
| POST | /api/tools/clean-cache | 清理缓存 |
| POST | /api/tools/memory-opt | 内存优化 |
| POST | /api/tools/kill-game | 关闭游戏进程 |

## 数据存储

- Windows: `%USERPROFILE%/.SCL/`
- macOS: `~/.SCL/`
- Linux: `~/.SCL/`

包含文件：
- `accounts.json` - 账户数据
- `config.json` - 全局配置
- `versions.json` - 已下载版本记录
- `backend.log` - 后端日志

## 支持的语言

- 简体中文（zh-CN）
- English（en-US）

切换语言后会自动保存，并在下次启动时恢复。

## 功能

- ✅ 账户管理（离线/微软/第三方）
- ✅ 版本管理（官方/Fabric/Forge/Quilt/OptiFine/NeoForge 等）
- ✅ 多镜像下载源（BMCLAPI/MCBBS/阿里云/腾讯云/GitCode）
- ✅ 游戏启动（支持内存/JVM 参数配置）
- ✅ Java 自动检测和下载
- ✅ 工具箱（内存优化/清理缓存/关闭游戏）
- ✅ 中英文切换
- ✅ 深色主题（PCL 风格）
