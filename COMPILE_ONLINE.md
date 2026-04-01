# SCL - SUPER CRAFT LAUNCHER

## Minecraft启动器 - C++ Win32原生版本

### 功能特性

- ✅ 原生EXE文件，无需安装Java
- ✅ 支持多镜像下载（BMCLAPI/MCBBS/阿里云）
- ✅ 离线账户登录
- ✅ 版本管理（下载/安装/启动）
- ✅ 精美的深色UI界面
- ✅ 体积小巧 (~100KB)

---

## 快速开始

### 方法1: 使用Replit在线编译（推荐）

1. 访问 https://replit.com
2. 创建新项目 (C++)
3. 删除默认代码
4. 将 `scl.cpp` 的内容复制粘贴进去
5. 点击 Run 按钮

### 方法2: 使用Visual Studio

1. 下载 Visual Studio Community: https://visualstudio.microsoft.com/
2. 安装时选择 "C++ 桌面开发"
3. 创建新项目 -> 空项目
4. 添加 `scl.cpp` 文件
5. 生成 -> 编译

### 方法3: 使用命令行

1. 安装 Visual Studio
2. 打开 "x64 Native Tools Command Prompt for VS"
3. 运行: `compile.bat`

---

## 使用说明

1. 首次运行会下载版本列表
2. 添加离线账户（输入任意用户名）
3. 选择版本并点击"下载版本"
4. 下载完成后点击"启动游戏"

---

## 编译命令

```batch
cl /EHsc /O2 /Fe:SCL.exe scl.cpp winhttp.lib comctl32.lib shlwapi.lib user32.lib gdi32.lib
```

## 项目结构

```
SCL/
├── scl.cpp          # 主程序源码
├── compile.bat      # Windows编译脚本
└── README.md       # 说明文档
```

---

## 技术说明

- **语言**: C++17
- **框架**: Win32 API
- **网络**: WinHTTP
- **界面**: 原生控件 + 自定义绘制
- **体积**: ~100KB
- **依赖**: 仅Windows系统库

## 许可证

本项目仅供学习和研究使用。Minecraft是Mojang Studios的注册商标。
