该项目目前还在制作阶段可能出现问题
# SCL

一个现代化的 Minecraft 启动器，支持正版、离线、第三方登录。

## 功能特性

- 🎮 **版本管理** - 支持所有官方 Minecraft 版本
- 👤 **多账户支持** - 正版微软账户、离线账户、第三方皮肤站
- ⚙️ **灵活配置** - 自定义 Java 路径、内存分配、JVM 参数
- 🎨 **精美界面** - 深色主题，类 PCL2 风格
- 📦 **版本隔离** - 每个版本独立配置

## 系统要求

- **Java**: JDK 21 或更高版本
- **系统**: Windows / macOS / Linux
- **内存**: 推荐 4GB 或以上

## 快速开始

### 1. 安装 Java

确保已安装 JDK 21。如果没有，请从以下地址下载：
- [Eclipse Adoptium (推荐)](https://adoptium.net/)
- [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)

### 2. 编译运行

Windows:
```batch
.\start.bat
```

或者手动执行：
```batch
gradle run
```

### 3. 首次使用

1. 添加账户（推荐先添加离线账户测试）
2. 在"版本"页面下载游戏版本
3. 选择版本后点击"启动游戏"

## 项目结构

```
SCL/
├── src/main/java/com/SCL/
│   ├── Main.java              # 程序入口
│   ├── Launcher.java          # 启动器主类
│   ├── ui/                    # UI层
│   ├── core/                  # 核心模块
│   │   ├── auth/              # 认证模块
│   │   ├── version/           # 版本管理
│   │   └── game/              # 游戏启动
│   ├── data/                  # 数据模型
│   └── utils/                 # 工具类
└── src/main/resources/
    ├── fxml/                  # 界面布局
    └── css/                   # 样式文件
```

## 账户类型说明

### 离线账户
- 无需网络连接
- 使用自定义用户名
- UUID 由用户名生成
- 适合测试和单机游戏

### 正版账户（微软）
- 需要微软账号
- 支持正版皮肤和capes
- 支持Realms和多人游戏

### 第三方账户
- 支持 LittleSkin 等皮肤站
- 自定义皮肤和capes
- Yggdrasil API 兼容

## 配置说明

配置文件位于 `~/.SCL/` 目录：
- `config.json` - 全局设置
- `accounts.json` - 账户信息

游戏文件默认存储在：
- Windows: `%APPDATA%\.minecraft`
- macOS: `~/Library/Application Support/minecraft`
- Linux: `~/.minecraft`

## 开发说明

### 构建项目
```bash
gradle build
```

### 打包可执行 JAR
```bash
gradle jar
```

### 清理构建
```bash
gradle clean
```

## 常见问题

### Q: 启动失败，提示"无法加载主类"
A: 确保已安装 JDK 21，并配置好 JAVA_HOME 环境变量。

### Q: 游戏无法启动
A: 检查以下几点：
1. 是否已安装游戏版本
2. Java 路径是否正确
3. 内存分配是否合理

### Q: 下载速度慢
A: 可以在设置中切换下载源。

## 许可证

本项目仅供学习和研究使用。Minecraft 是 Mojang Studios 的注册商标。

## 更新日志

### v1.0.0 (2026-04-01)
- 初始版本发布
- 支持离线账户
- 支持版本管理
- 支持游戏启动
