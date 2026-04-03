# 🎮 SCL Launcher

**A modern Minecraft launcher** with a frontend-backend architecture, supporting dark/light themes, multi-account management, version management and multi-mirror acceleration.

---

## ⚡ Features

| Status | Feature | Description |
|--------|---------|-------------|
| 🟢 | Dual Themes | Dark + light mode with instant switching |
| 🟢 | Multi-Account | Offline, Microsoft, third-party skin servers |
| 🟢 | Version Management | Official, Fabric, Forge, Quilt, OptiFine, etc. |
| 🟢 | Multi-Mirror | BMCLAPI, GitCode, Aliyun, Tencent Cloud, MCBBS |
| 🟢 | Game Launch | Custom memory allocation and JVM arguments |
| 🟢 | Java Management | Auto-detect and download required Java versions |
| 🟢 | Toolbox | Memory optimization, cache cleaning, process management |
| 🟢 | i18n | Chinese and English with instant switching |
| 🟢 | Privacy | No personal data uploaded, fully local storage |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    SCL Launcher                        │
├─────────────────────┬────────────────────────────────┤
│  ┌───────────────┐  │  ┌────────────────────────┐    │
│  │  React + Vite │  │  │   Electron 41          │    │
│  │  (Frontend)   │◄─┼─►│   (Main Process + IPC)│    │
│  └───────────────┘  │  └──────────┬─────────────┘    │
│         │           │             │                   │
│         │           │  ┌─────────▼─────────────┐    │
│         │           │  │  Spring Boot 3.2      │    │
│         │           │  │  (REST API :8765)    │    │
│         │           │  └──────────┬─────────────┘    │
└─────────────────────┴────────────┼───────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │     Minecraft Game Core      │
                    │   (.minecraft/versions/)   │
                    └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| 🔵 Frontend | React + TypeScript | 18 / 5 |
| ⚡ Build | Vite | 8.x |
| 🎨 Styling | Tailwind CSS | 3.x |
| 📦 State | Zustand | 5.x |
| 🌐 i18n | React-i18next | 17.x |
| 💻 Desktop | Electron | 41.x |
| ☕ Backend | Spring Boot | 3.2 |
| ☕ Runtime | Java | 21 |
| 🌐 HTTP | OkHttp | 4.x |

---

## 📥 Download

| Type | File | Size |
|------|------|------|
| 🔴 **Portable (Recommended)** | `frontend/release/SCL-Launcher-1.0.0-portable.exe` | ~104 MB |
| 🟡 Archive | `frontend/release/SCL-Launcher-1.0.0-win-unpacked.zip` | ~153 MB |
| 🟢 Direct Run | `frontend/dist/dist/win-unpacked/SCL Launcher.exe` | — |

> Portable version runs with a single click. Extracts and launches automatically.

---

## 🚀 Quick Start

### Requirements

| Requirement | Minimum |
|-------------|---------|
| Java | JDK 21+ |
| Node.js | 18+ |
| OS | Windows / macOS / Linux |

### Launch Dev Environment

**One-click start:**
```batch
start-dev.bat
```

**Start separately:**
```batch
:: Terminal 1 — Backend
cd backend && ..\gradlew.bat bootRun
:: Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**

### Build from Source

```batch
cd frontend
npm install
npm run build
node scripts/build-electron.js
npx electron-builder --projectDir dist --win --dir
```

---

## 📂 Project Structure

```
scl-launcher/
├── frontend/                      # Electron Frontend
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── components/           # UI components
│   │   │   ├── layout/         # Main layout
│   │   │   └── ui/             # Reusable components
│   │   ├── i18n/               # i18n (zh-CN / en-US)
│   │   ├── pages/               # Pages (Launch / Download / Settings / Tools)
│   │   └── store/              # Zustand state + theme
│   ├── electron/                 # Electron main process
│   ├── scripts/                 # Build scripts
│   └── release/                 # Release artifacts
│
├── backend/                     # Spring Boot Backend
│   └── src/main/java/com/scl/backend/
│       ├── controller/            # REST API controllers
│       ├── service/            # Business logic + mirrors
│       ├── model/             # Data models
│       └── config/           # CORS config
│
├── start-dev.bat                # Start both frontend + backend
├── start-backend.bat           # Start backend only
└── README.md
```

---

## 🌐 API Reference

Backend runs at `http://localhost:8765`

### Accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/accounts` | List accounts |
| `POST` | `/api/accounts` | Add account |
| `DELETE` | `/api/accounts/{id}` | Delete account |

### Versions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/versions` | List versions |
| `GET` | `/api/versions?type=fabric` | Filter by type |
| `GET` | `/api/versions/downloaded` | Downloaded versions |
| `POST` | `/api/versions/mark-downloaded` | Mark as downloaded |

### Config

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Get config |
| `POST` | `/api/config` | Save config |

### Launch

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/launch` | Launch game |
| `POST` | `/api/launch/kill` | Force kill game |
| `GET` | `/api/launch/status` | Game running status |

### Tools

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tools/open-folder` | Open folder |
| `POST` | `/api/tools/open-log` | Open log file |
| `POST` | `/api/tools/clean-cache` | Clean cache |
| `POST` | `/api/tools/memory-opt` | Memory optimization |
| `POST` | `/api/tools/kill-game` | Kill game process |

---

## 💾 Data Storage

| OS | Path |
|----|------|
| Windows | `%USERPROFILE%\.SCL\` |
| macOS / Linux | `~/.SCL/` |

| File | Content |
|------|---------|
| `accounts.json` | Account data |
| `config.json` | Global config (theme/language/mirror/Token) |
| `versions.json` | Downloaded version records |
| `backend.log` | Backend log |

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

## 📄 License

This project is licensed under **GPL v3**. See [LICENSE](LICENSE) for details.

> **Special provision**: Without explicit written permission from the project owner, this project may NOT be used for any commercial purpose or have its license modified.

---

*Minecraft is a trademark of Mojang Studios.*
