// 版本 API — 从镜像源获取版本列表、管理已下载版本
const express = require('express');
const router = express.Router();
const store = require('../store');
const fetch = require('node-fetch');

// ─── 镜像源映射 ────────────────────────────────────
const MIRRORS = {
  BMCLAPI: 'https://bmclapi2.bangbang93.com',
  GitCode: 'https://gitcode.net/mirrors',
  MCBBS: 'https://download.mcbbs.xyz',
  Aliyun: 'https://mirrors.aliyun.com/minecraft',
  Tencent: 'https://launchermeta.mirrores.net'
};

function getMirrorBase() {
  const config = store.loadConfig();
  return MIRRORS[config.downloadSource] || MIRRORS.BMCLAPI;
}

function ua() {
  return 'SCL/1.0 (Minecraft Launcher)';
}

async function httpGet(url) {
  const res = await fetch(url, { headers: { 'User-Agent': ua() }, timeout: 15000 });
  if (!res.ok) throw new Error(`HTTP ${res.code}: ${url}`);
  return res.json();
}

// ─── Demo fallback 数据 ────────────────────────────
function demoOfficial() {
  return [
    { id: '1.21.4', name: 'Minecraft 1.21.4', type: 'official', version: '1.21.4', minecraftVersion: '1.21.4' },
    { id: '1.21.3', name: 'Minecraft 1.21.3', type: 'official', version: '1.21.3', minecraftVersion: '1.21.3' },
    { id: '1.21.1', name: 'Minecraft 1.21.1', type: 'official', version: '1.21.1', minecraftVersion: '1.21.1' },
    { id: '1.20.6', name: 'Minecraft 1.20.6', type: 'official', version: '1.20.6', minecraftVersion: '1.20.6' },
    { id: '1.20.4', name: 'Minecraft 1.20.4', type: 'official', version: '1.20.4', minecraftVersion: '1.20.4' },
    { id: '1.20.2', name: 'Minecraft 1.20.2', type: 'official', version: '1.20.2', minecraftVersion: '1.20.2' },
    { id: '1.19.4', name: 'Minecraft 1.19.4', type: 'official', version: '1.19.4', minecraftVersion: '1.19.4' },
    { id: '1.18.2', name: 'Minecraft 1.18.2', type: 'official', version: '1.18.2', minecraftVersion: '1.18.2' },
    { id: '1.16.5', name: 'Minecraft 1.16.5', type: 'official', version: '1.16.5', minecraftVersion: '1.16.5' },
    { id: '1.12.2', name: 'Minecraft 1.12.2', type: 'official', version: '1.12.2', minecraftVersion: '1.12.2' }
  ];
}

function demoFabric() {
  return [
    { id: 'fabric-1.21.4', name: 'Fabric 1.21.4', type: 'fabric', version: '1.0.1', minecraftVersion: '1.21.4' },
    { id: 'fabric-1.20.4', name: 'Fabric 1.20.4', type: 'fabric', version: '0.15.7', minecraftVersion: '1.20.4' },
    { id: 'fabric-1.19.4', name: 'Fabric 1.19.4', type: 'fabric', version: '0.14.21', minecraftVersion: '1.19.4' },
    { id: 'fabric-1.18.2', name: 'Fabric 1.18.2', type: 'fabric', version: '0.14.21', minecraftVersion: '1.18.2' }
  ];
}

function demoForge() {
  return [
    { id: 'forge-1.21.4', name: 'Forge 1.21.4', type: 'forge', version: '52.0', minecraftVersion: '1.21.4' },
    { id: 'forge-1.20.4', name: 'Forge 1.20.4', type: 'forge', version: '49.0.30', minecraftVersion: '1.20.4' },
    { id: 'forge-1.16.5', name: 'Forge 1.16.5', type: 'forge', version: '36.2.39', minecraftVersion: '1.16.5' },
    { id: 'forge-1.12.2', name: 'Forge 1.12.2', type: 'forge', version: '14.23.5.2859', minecraftVersion: '1.12.2' }
  ];
}

// ─── 获取官方版本 ──────────────────────────────────
async function fetchOfficialVersions() {
  const base = getMirrorBase();
  try {
    const data = await httpGet(base + '/Minecraft/version');
    return data
      .filter(v => v.type !== 'old_alpha' && v.type !== 'old_beta')
      .map(v => ({
        id: v.id,
        name: 'Minecraft ' + v.id,
        type: 'official',
        version: v.id,
        minecraftVersion: v.id
      }));
  } catch (e) {
    console.error('[Versions] 官方版本获取失败:', e.message);
    return demoOfficial();
  }
}

// ─── 获取 Fabric 版本 ──────────────────────────────
async function fetchFabricVersions() {
  const base = getMirrorBase();
  try {
    const data = await httpGet(base + '/fabric/meta');
    const versions = [];
    for (const gv of (data.gameVersions || [])) {
      for (const loader of (data.loaders || [])) {
        versions.push({
          id: `fabric-${gv}-${loader.version}`,
          name: `Fabric ${gv}`,
          type: 'fabric',
          version: loader.version,
          minecraftVersion: gv
        });
      }
    }
    return versions;
  } catch (e) {
    console.error('[Versions] Fabric 版本获取失败:', e.message);
    return demoFabric();
  }
}

// ─── 获取 Forge 版本 ───────────────────────────────
async function fetchForgeVersions() {
  const base = getMirrorBase();
  try {
    // 先获取 MC 版本列表
    const mcData = await httpGet(base + '/Minecraft/version');
    const mcVersions = mcData
      .filter(v => v.type !== 'old_alpha' && v.type !== 'old_beta')
      .map(v => v.id)
      .slice(0, 5); // 只取最近 5 个

    const versions = [];
    for (const mcVer of mcVersions) {
      try {
        const forgeData = await httpGet(base + '/forge/version/' + mcVer);
        for (const f of forgeData) {
          versions.push({
            id: 'forge-' + mcVer,
            name: 'Forge ' + mcVer,
            type: 'forge',
            version: f.version || mcVer,
            minecraftVersion: mcVer
          });
        }
      } catch (ignored) {}
    }
    return versions.length > 0 ? versions : demoForge();
  } catch (e) {
    console.error('[Versions] Forge 版本获取失败:', e.message);
    return demoForge();
  }
}

// ─── 路由 ──────────────────────────────────────────

// 获取版本列表
router.get('/', async (req, res) => {
  const type = req.query.type || 'official';
  const downloaded = store.loadDownloadedVersions();
  const downloadedIds = new Set(downloaded.map(v => v.id));

  let fetched;
  try {
    switch (type) {
      case 'fabric': fetched = await fetchFabricVersions(); break;
      case 'forge':  fetched = await fetchForgeVersions(); break;
      default:       fetched = await fetchOfficialVersions(); break;
    }
  } catch (e) {
    fetched = type === 'fabric' ? demoFabric() : type === 'forge' ? demoForge() : demoOfficial();
  }

  // 标记已下载状态
  fetched.forEach(v => { v.downloaded = downloadedIds.has(v.id); });
  res.json(fetched);
});

// 已下载版本列表
router.get('/downloaded', (req, res) => {
  res.json(store.loadDownloadedVersions());
});

// 标记已下载
router.post('/mark-downloaded', (req, res) => {
  const version = req.body;
  const downloaded = store.loadDownloadedVersions();
  if (!downloaded.find(v => v.id === version.id)) {
    downloaded.push(version);
    store.saveDownloadedVersions(downloaded);
  }
  res.json({ success: true });
});

// 移除已下载标记
router.delete('/downloaded/:id', (req, res) => {
  const downloaded = store.loadDownloadedVersions();
  store.saveDownloadedVersions(downloaded.filter(v => v.id !== req.params.id));
  res.json({ success: true });
});

module.exports = router;
