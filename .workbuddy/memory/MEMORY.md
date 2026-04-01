# MEMORY.md - 长期记忆

## 用户信息
- 用户名：Doudou
- 使用Windows系统

## 项目记录

### SCL - Minecraft启动器
- 创建时间：2026-04-01
- 技术栈：Java 21 + JavaFX 21 + Gradle 8.5
- 功能：支持离线/正版/第三方登录的Minecraft启动器
- 状态：完整功能版本

## 新增功能（2026-04-01 更新）
- ✅ Java自动下载（无需预装JDK）
- ✅ EXE打包支持（Launch4j）
- ✅ 多镜像源支持（BMCLAPI/MCBBS/阿里云/GitCode）
- ✅ GitCode Token配置（已配置：a7eD_6djT_cshDa32_5dJy3F）

## 技术偏好
- UI风格：深色主题，类似PCL2
- 构建工具：Gradle + Launch4j
- 架构：MVVM + 模块化

## 打包命令（独立版 - 无需安装软件）
- **快速打包（推荐）**：双击 `quick_build.bat`
- **完整打包**：`build_all.bat`
- **Gradle方式**：`gradle jar`（需要安装Gradle）

## 打包脚本
- `build_all.bat` - 完整打包，包含详细日志
- `quick_build.bat` - 快速打包，简化版本

## 下载源配置
- 默认：BMCLAPI（国内镜像，速度快）
- 可选：MCBBS、阿里云、腾讯云、GitCode
- GitCode Token已保存用于认证下载
