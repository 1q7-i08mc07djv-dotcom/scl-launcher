# SCL Launcher 🎮

A modern Minecraft launcher built with a frontend-backend separation architecture.

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Electron](https://img.shields.io/badge/Electron-41-purple)
![License](https://img.shields.io/badge/License-GPL%20v3-blue)

## ✨ Preview

Dark and light themes supported, featuring PCL-CE style modern UI design.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│               SCL Launcher                   │
└─────────────────────────────────────────────┘
├── Frontend (Electron)
│   ├── React 18 + TypeScript
│   ├── Vite (Fast build tool)
│   ├── Tailwind CSS (Modern CSS framework)
│   ├── React-i18next (Internationalization)
│   └── Zustand (Lightweight state management)
├── Backend (Spring Boot)
│   ├── Spring Boot 3.2
│   ├── Java 21
│   └── OkHttp (HTTP client)
└── Core Features
    ├── Account management
    ├── Version management
    ├── Game launching
    ├── Configuration management
    └── Tool functions
```

## 📊 Features

### 🎨 Interface Features
- 🌙 **Dual Themes** — Dark mode + light mode with instant switching
- 🌐 **Internationalization** — Chinese and English support
- 💻 **Modern UI** — PCL-CE style design

### 🎮 Game Features
- 📦 **Version Management** — Official, Fabric, Forge, Quilt, OptiFine, NeoForge and more
- ⚡ **Multi-mirror** — BMCLAPI, GitCode (GitHub acceleration), Aliyun, Tencent, MCBBS
- 🧩 **Game Launch** — Custom memory allocation and JVM arguments

### ⚙️ Tool Features
- ☕ **Java Management** — Auto-detect and download required Java versions
- 🛠️ **Toolbox** — Memory optimization, cache cleaning, process management
- 🔒 **Privacy** — No personal data uploaded, fully local storage
- 💾 **Persistence** — All settings saved to user directory

## 📥 Download Release

### 🚀 Single-file Portable (Recommended)
```
frontend\release\SCL-Launcher-1.0.0-portable.exe
```
Double-click to run. Extracts and launches automatically.

### 🖥️ Direct Run
```
frontend\dist\dist\win-unpacked\SCL Launcher.exe
```

### 📦 Archive
```
frontend\release\SCL-Launcher-1.0.0-win-unpacked.zip
```

## 🏃 Quick Start

### 📋 Requirements

| Component | Version | Description |
|-----------|---------|-------------|
| Java | JDK 21 or higher | Backend runtime |
| Node.js | 18 or higher | Frontend runtime |
| OS | Windows / macOS / Linux | Cross-platform |

### 🚀 Launch Dev Environment

**Option 1: One-click start**
```batch
start-dev.bat
```

**Option 2: Start separately**

Terminal 1 — Backend:
```batch
cd backend
..\gradlew.bat bootRun
```

Terminal 2 — Frontend:
```batch
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### 🏗️ Build Release from Source

```batch
cd frontend
npm install
npm run build
node scripts/build-electron.js
npx electron-builder --projectDir dist --win --dir
```

Artifacts output to `frontend\release\`.

## 📁 Project Structure

```
scl-launcher/
├── frontend/                    # Electron frontend
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # UI components
│   │   │   ├── layout/        # Main layout
│   │   │   └── ui/            # Reusable UI components
│   │   ├── i18n/              # i18n (zh-CN / en-US)
│   │   ├── pages/              # Page components
│   │   └── store/             # State + theme
│   ├── electron/               # Electron main process
│   ├── scripts/                # Build scripts
│   └── release/                # Release artifacts
│
├── backend/                    # Spring Boot backend
│   └── src/main/java/com/scl/backend/
│       ├── controller/         # REST API controllers
│       ├── service/             # Business logic + mirrors
│       ├── model/              # Data models
│       └── config/             # CORS config
│
├── start-dev.bat               # Start both frontend + backend
├── start-backend.bat           # Start backend only
└── README.md
```

## 🔧 API Reference

Backend runs at `http://localhost:8765`

### 📝 Account Management

| Method | Path | Description |
|--------|------|-------------|
| ✅ GET | `/api/accounts` | List accounts |
| ✅ POST | `/api/accounts` | Add account |
| ✅ DELETE | `/api/accounts/{id}` | Delete account |

### 📦 Version Management

| Method | Path | Description |
|--------|------|-------------|
| ✅ GET | `/api/versions` | List versions |
| ✅ GET | `/api/versions?type=fabric` | Filter by type |
| ✅ GET | `/api/versions/downloaded` | Downloaded versions |
| ✅ POST | `/api/versions/mark-downloaded` | Mark as downloaded |

### ⚙️ Configuration Management

| Method | Path | Description |
|--------|------|-------------|
| ✅ GET | `/api/config` | Get config |
| ✅ POST | `/api/config` | Save config |

### 🎮 Game Launching

| Method | Path | Description |
|--------|------|-------------|
| ✅ POST | `/api/launch` | Launch game |
| ✅ POST | `/api/launch/kill` | Force kill game |
| ✅ GET | `/api/launch/status` | Game running status |

### 🛠️ Toolbox

| Method | Path | Description |
|--------|------|-------------|
| ✅ POST | `/api/tools/open-folder` | Open folder |
| ✅ POST | `/api/tools/open-log` | Open log file |
| ✅ POST | `/api/tools/clean-cache` | Clean cache |
| ✅ POST | `/api/tools/memory-opt` | Memory optimization |
| ✅ POST | `/api/tools/kill-game` | Kill game process |

## 💾 Data Storage

Config stored in user home directory:

| OS | Path |
|----|------|
| 🪟 Windows | `%USERPROFILE%\.SCL\` |
| 🍎 macOS | `~/.SCL/` |
| 🐧 Linux | `~/.SCL/` |

Files:
- `accounts.json` — Account data
- `config.json` — Global config (theme/language/mirror/Token)
- `versions.json` — Downloaded version records
- `backend.log` — Backend log

## 📈 Workflow

1. 🎯 User opens launcher
2. 👤 Select or create account
3. 📦 Choose game version
4. ⚙️ Configure game settings
5. 🎮 Launch game
6. 📊 Monitor game status

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

This project is licensed under **GPL v3**. See [LICENSE](LICENSE) for details.

> ⚠️ Special provision: Without explicit written permission from the project owner, this project may NOT be used for any commercial purpose or have its license modified.

Minecraft is a trademark of Mojang Studios.

---

**SCL Launcher** - A modern, open-source, cross-platform Minecraft launcher dedicated to providing the best gaming experience 🎮