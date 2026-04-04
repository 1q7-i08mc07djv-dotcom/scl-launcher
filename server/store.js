// 数据存储模块 — accounts.json / config.json / versions.json 的读写
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.SCL');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── 配置默认值 ─────────────────────────────────────
const DEFAULT_CONFIG = {
  language: 'zh-CN',
  theme: 'dark',
  javaPath: '',
  autoJava: true,
  memory: '2G',
  jvmArgs: '',
  downloadSource: 'BMCLAPI',
  gitcodeToken: '',
  skinUrl: '',
  customUuid: '',
  customUUID: '',
  customDownloadUrl: '',
  privacyAgreed: false
};

// ─── 通用 JSON 读写 ─────────────────────────────────
function readJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error('[Store] 读取失败:', filePath, e.message);
  }
  return fallback;
}

function writeJson(filePath, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Store] 写入失败:', filePath, e.message);
  }
}

// ─── 账户 ──────────────────────────────────────────
function loadAccounts() {
  return readJson(ACCOUNTS_FILE, []);
}

function saveAccounts(accounts) {
  writeJson(ACCOUNTS_FILE, accounts);
}

// ─── 配置 ──────────────────────────────────────────
function loadConfig() {
  return { ...DEFAULT_CONFIG, ...readJson(CONFIG_FILE, {}) };
}

function saveConfig(config) {
  writeJson(CONFIG_FILE, config);
}

// ─── 已下载版本 ────────────────────────────────────
function loadDownloadedVersions() {
  return readJson(VERSIONS_FILE, []);
}

function saveDownloadedVersions(versions) {
  writeJson(VERSIONS_FILE, versions);
}

// ─── 路径 ──────────────────────────────────────────
function getDataDir() {
  return DATA_DIR;
}

function getMinecraftDir() {
  const os = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE;
  if (os === 'win32') {
    return path.join(process.env.APPDATA || home, '.minecraft');
  } else if (os === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'minecraft');
  } else {
    return path.join(home, '.minecraft');
  }
}

// ─── UUID 工具 ─────────────────────────────────────
function generateOfflineUUID(username) {
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + username).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
}

module.exports = {
  DATA_DIR,
  loadAccounts,
  saveAccounts,
  loadConfig,
  saveConfig,
  loadDownloadedVersions,
  saveDownloadedVersions,
  getDataDir,
  getMinecraftDir,
  generateOfflineUUID
};
