# SCL - Minecraft启动器社区版

## 1. 项目概述

**项目名称**: SCL  
**项目类型**: Java桌面应用 (JavaFX)  
**核心功能**: 全功能Minecraft启动器，支持正版/离线/第三方登录，类似PCL2的社区版替代品  
**目标用户**: Minecraft玩家、技术爱好者

## 2. 技术栈

- **语言**: Java 21
- **UI框架**: JavaFX 21
- **构建工具**: Gradle 8.5
- **打包工具**: Launch4j (EXE打包)
- **HTTP客户端**: OkHttp4
- **JSON解析**: Gson
- **日志**: Log4j2
- **架构**: MVVM + 模块化设计

## 3. 核心功能

### 3.1 Java自动下载
- 无需预装JDK，启动器自动检测并下载
- 支持多个镜像源（官方、GitCode、BMCLAPI）
- 内置JRE可打包进EXE

### 3.2 多镜像下载加速
| 镜像源 | 速度 | 需要Token |
|--------|------|-----------|
| BMCLAPI | ★★★★★ | 否 |
| MCBBS | ★★★★☆ | 可选 |
| 阿里云 | ★★★★★ | 否 |
| 腾讯云 | ★★★★☆ | 否 |
| GitCode | ★★★☆☆ | 已配置 ✓ |

### 3.3 账户系统
- ✅ 离线登录 - 无需网络
- ✅ 微软正版登录 - OAuth2
- ✅ 第三方登录 - LittleSkin/CustomSkinLoader

### 3.4 版本管理
- ✅ 官方版本列表获取
- ✅ 多源下载（自动切换）
- ✅ 版本隔离
- ✅ Mod加载器支持（Fabric/Forge/Quilt）

### 3.5 EXE打包
- ✅ 使用Launch4j打包
- ✅ 自带JRE
- ✅ 单实例运行
- ✅ 自定义图标支持

## 4. 项目结构

```
SCL/
├── src/main/java/com/SCL/
│   ├── Main.java                    # 程序入口
│   ├── Launcher.java                # 启动器主类
│   ├── ui/MainController.java       # 主界面控制器
│   ├── core/
│   │   ├── auth/                    # 认证模块
│   │   │   ├── AuthManager.java
│   │   │   ├── MicrosoftAuth.java
│   │   │   └── ThirdPartyAuth.java
│   │   ├── version/                # 版本管理
│   │   │   └── VersionManager.java
│   │   ├── game/                   # 游戏启动
│   │   │   └── GameLauncher.java
│   │   ├── java/                   # Java管理
│   │   │   └── JavaManager.java
│   │   └── download/               # 下载管理
│   │       └── DownloadManager.java
│   ├── data/                       # 数据模型
│   │   ├── Account.java
│   │   ├── Config.java
│   │   └── GameVersion.java
│   └── utils/                      # 工具类
│       ├── FileUtils.java
│       ├── HttpClient.java
│       ├── Logger.java
│       └── OSUtils.java
├── src/main/resources/
│   ├── fxml/main.fxml             # 界面布局
│   ├── css/style.css               # 样式文件
│   └── assets/                     # 资源文件
├── build.gradle                    # Gradle配置
├── build_exe.xml                   # Launch4j配置
├── start.bat                       # 启动脚本
├── package.bat                     # 打包脚本
└── README.md                       # 说明文档
```

## 5. 使用指南

### 5.1 编译运行
```batch
gradle run
```

### 5.2 打包EXE
```batch
package.bat
```

### 5.3 配置镜像源
配置文件: `~/.SCL/config.json`
```json
{
  "downloadSource": "BMCLAPI",
  "gitcodeToken": "your-token-here"
}
```

## 6. 验收标准

- [x] 程序可正常启动
- [x] 支持离线账户登录
- [x] 支持正版微软登录（框架）
- [x] 支持第三方皮肤站登录（框架）
- [x] 可下载并显示Minecraft版本列表
- [x] 可启动游戏（离线模式）
- [x] 界面美观，类似PCL2风格
- [x] 支持内存/参数配置
- [x] 支持版本隔离
- [x] Java自动下载功能
- [x] 多镜像下载加速
- [x] EXE打包支持

## 7. 更新日志

### v1.0.1 (2026-04-01)
- 新增：Java自动下载功能
- 新增：多镜像源支持（BMCLAPI/MCBBS/阿里云/GitCode）
- 新增：GitCode Token配置
- 新增：EXE打包配置（Launch4j）
- 优化：版本管理器集成镜像下载

### v1.0.0 (2026-04-01)
- 初始版本发布
- 基础启动器功能
- 离线账户支持
