# SCL Launcher

A modern Minecraft launcher inspired by PCL Community Edition, built with a frontend-backend separation architecture.

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## Preview

Dark and light themes supported, inspired by PCL Community Edition design.

## Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| Frontend | React 18 + TypeScript | Component-based UI |
| Frontend | Vite | Fast build tool |
| Frontend | Tailwind CSS | Dark/light theming |
| Frontend | React-i18next | Chinese & English |
| Frontend | Zustand | Lightweight state management |
| Backend | Spring Boot 3.2 | REST API service |
| Backend | Java 21 | Runtime |
| Backend | OkHttp | HTTP client |

## Features

- 🌙 **Dual Themes** — Dark mode + light mode with instant switching
- 🎮 **Multi-account** — Offline, Microsoft, and third-party skin accounts
- 📦 **Version Management** — Official, Fabric, Forge, Quilt, OptiFine, NeoForge and more
- ⚡ **Multi-mirror** — BMCLAPI, GitCode (GitHub acceleration), Aliyun, Tencent, MCBBS
- 🧩 **Game Launch** — Custom memory allocation and JVM arguments
- ☕ **Java Management** — Auto-detect and download required Java versions
- 🛠️ **Toolbox** — Memory optimization, cache cleaning, process management
- 🌐 **i18n** — Chinese and English with instant switching
- 💾 **Persistence** — All settings saved to `~/.SCL/`

## Quick Start

### Requirements

- **Java**: JDK 21 or higher
- **Node.js**: 18 or higher
- **OS**: Windows / macOS / Linux

### Launch Dev Environment

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

## Project Structure

```
scl-launcher/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/         # UI components
│   │   │   ├── layout/      # Main layout
│   │   │   └── ui/          # PCL-style components
│   │   ├── i18n/            # i18n (zh-CN / en-US)
│   │   ├── pages/            # Page components
│   │   └── store/           # State + theme
│   └── ...
│
├── backend/                  # Spring Boot backend
│   └── src/main/java/com/scl/backend/
│       ├── controller/        # REST API controllers
│       ├── service/          # Business logic + mirrors
│       ├── model/           # Data models
│       └── config/          # CORS config
│
├── start-dev.bat             # Start both frontend + backend
├── start-backend.bat          # Start backend only
└── README.md / README-en.md
```

## API Reference

Backend runs at `http://localhost:8765`

### Accounts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Add account |
| DELETE | `/api/accounts/{id}` | Delete account |

### Versions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/versions` | List versions |
| GET | `/api/versions?type=fabric` | Filter by type |
| GET | `/api/versions/downloaded` | Downloaded versions |
| POST | `/api/versions/mark-downloaded` | Mark as downloaded |

### Config

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Get config |
| POST | `/api/config` | Save config |

### Launch

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/launch` | Launch game |
| POST | `/api/launch/kill` | Force kill game |
| GET | `/api/launch/status` | Game running status |

### Tools

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tools/open-folder` | Open folder |
| POST | `/api/tools/open-log` | Open log file |
| POST | `/api/tools/clean-cache` | Clean cache |
| POST | `/api/tools/memory-opt` | Memory optimization |
| POST | `/api/tools/kill-game` | Kill game process |

## Data Storage

Config stored in user home directory:

| OS | Path |
|----|------|
| Windows | `%USERPROFILE%\.SCL\` |
| macOS | `~/.SCL/` |
| Linux | `~/.SCL/` |

Files:
- `accounts.json` — Account data
- `config.json` — Global config (theme/language/mirror/Token)
- `versions.json` — Downloaded version records
- `backend.log` — Backend log

## Contributing

Issues and Pull Requests are welcome!

## License

This project is for educational purposes only. Minecraft is a trademark of Mojang Studios.
