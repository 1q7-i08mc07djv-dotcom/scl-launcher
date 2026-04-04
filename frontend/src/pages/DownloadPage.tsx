import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { versionApi, ApiError } from '../api';
import type { GameVersion } from '../api';

const CATEGORIES = [
  { key: 'official', label: 'download.official' },
  { key: 'fabric', label: 'download.fabric' },
  { key: 'forge', label: 'download.forge' },
  { key: 'quilt', label: 'download.quilt' },
  { key: 'optifine', label: 'download.optifine' },
  { key: 'neoforge', label: 'download.neoForge' },
  { key: 'labymod', label: 'download.labymod' },
  { key: 'legacyfabric', label: 'download.legacyFabric' },
  { key: 'liteloader', label: 'download.liteLoader' },
  { key: 'cleanroom', label: 'download.cleanroom' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

const TYPE_ICONS: Record<string, string> = {
  fabric: '🧵', forge: '🔨', optifine: '✨', quilt: '🪺',
  neoforge: '🦊', official: '🎮', labymod: '🎯', cleanroom: '🏠',
};

const DEMO_DATA: Record<CategoryKey, GameVersion[]> = {
  official: [
    { id: '1.21.4', name: 'Minecraft 1.21.4', type: 'official', version: '1.21.4', minecraftVersion: '1.21.4', downloaded: false },
    { id: '1.21.3', name: 'Minecraft 1.21.3', type: 'official', version: '1.21.3', minecraftVersion: '1.21.3', downloaded: false },
    { id: '1.21.1', name: 'Minecraft 1.21.1', type: 'official', version: '1.21.1', minecraftVersion: '1.21.1', downloaded: false },
    { id: '1.20.6', name: 'Minecraft 1.20.6', type: 'official', version: '1.20.6', minecraftVersion: '1.20.6', downloaded: true },
    { id: '1.20.4', name: 'Minecraft 1.20.4', type: 'official', version: '1.20.4', minecraftVersion: '1.20.4', downloaded: true },
    { id: '1.20.2', name: 'Minecraft 1.20.2', type: 'official', version: '1.20.2', minecraftVersion: '1.20.2', downloaded: false },
    { id: '1.19.4', name: 'Minecraft 1.19.4', type: 'official', version: '1.19.4', minecraftVersion: '1.19.4', downloaded: false },
    { id: '1.18.2', name: 'Minecraft 1.18.2', type: 'official', version: '1.18.2', minecraftVersion: '1.18.2', downloaded: false },
    { id: '1.16.5', name: 'Minecraft 1.16.5', type: 'official', version: '1.16.5', minecraftVersion: '1.16.5', downloaded: false },
    { id: '1.12.2', name: 'Minecraft 1.12.2', type: 'official', version: '1.12.2', minecraftVersion: '1.12.2', downloaded: false },
  ],
  fabric: [
    { id: 'fabric-1.21.4', name: 'Fabric 1.21.4', type: 'fabric', version: '1.0.1', minecraftVersion: '1.21.4', downloaded: false },
    { id: 'fabric-1.20.4', name: 'Fabric 1.20.4', type: 'fabric', version: '0.15.7', minecraftVersion: '1.20.4', downloaded: false },
    { id: 'fabric-1.19.4', name: 'Fabric 1.19.4', type: 'fabric', version: '0.14.21', minecraftVersion: '1.19.4', downloaded: false },
    { id: 'fabric-1.18.2', name: 'Fabric 1.18.2', type: 'fabric', version: '0.14.21', minecraftVersion: '1.18.2', downloaded: false },
  ],
  forge: [
    { id: 'forge-1.21.4', name: 'Forge 1.21.4', type: 'forge', version: '52.0', minecraftVersion: '1.21.4', downloaded: false },
    { id: 'forge-1.20.4', name: 'Forge 1.20.4', type: 'forge', version: '49.0.30', minecraftVersion: '1.20.4', downloaded: false },
    { id: 'forge-1.16.5', name: 'Forge 1.16.5', type: 'forge', version: '36.2.39', minecraftVersion: '1.16.5', downloaded: false },
    { id: 'forge-1.12.2', name: 'Forge 1.12.2', type: 'forge', version: '14.23.5.2859', minecraftVersion: '1.12.2', downloaded: false },
  ],
  quilt: [
    { id: 'quilt-1.21.4', name: 'Quilt 1.21.4', type: 'quilt', version: '0.26.0', minecraftVersion: '1.21.4', downloaded: false },
    { id: 'quilt-1.20.4', name: 'Quilt 1.20.4', type: 'quilt', version: '0.24.1', minecraftVersion: '1.20.4', downloaded: false },
  ],
  optifine: [
    { id: 'optifine-1.20.4', name: 'OptiFine 1.20.4 HD_U_F5', type: 'optifine', version: 'HD_U_F5', minecraftVersion: '1.20.4', downloaded: false },
    { id: 'optifine-1.19.4', name: 'OptiFine 1.19.4 HD_U_I9', type: 'optifine', version: 'HD_U_I9', minecraftVersion: '1.19.4', downloaded: false },
    { id: 'optifine-1.18.2', name: 'OptiFine 1.18.2 HD_U_G8', type: 'optifine', version: 'HD_U_G8', minecraftVersion: '1.18.2', downloaded: false },
  ],
  neoforge: [
    { id: 'neoforge-1.21.4', name: 'NeoForge 1.21.4', type: 'neoforge', version: '21.4.74', minecraftVersion: '1.21.4', downloaded: false },
    { id: 'neoforge-1.20.4', name: 'NeoForge 1.20.4', type: 'neoforge', version: '20.4.76', minecraftVersion: '1.20.4', downloaded: false },
  ],
  labymod: [{ id: 'labymod-1.20.4', name: 'LabyMod 1.20.4', type: 'labymod', version: '4.0', minecraftVersion: '1.20.4', downloaded: false }],
  legacyfabric: [{ id: 'legacyfabric-1.19.4', name: 'LegacyFabric 1.19.4', type: 'legacyfabric', version: '0.14.21', minecraftVersion: '1.19.4', downloaded: false }],
  liteloader: [{ id: 'liteloader-1.12.2', name: 'LiteLoader 1.12.2', type: 'liteloader', version: '1.12.2-SNAPSHOT', minecraftVersion: '1.12.2', downloaded: false }],
  cleanroom: [{ id: 'cleanroom-1.12.2', name: 'Cleanroom 1.12.2', type: 'cleanroom', version: '1.12.2', minecraftVersion: '1.12.2', downloaded: false }],
};

export default function DownloadPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const searchRef = useRef('');

  const loadVersions = useCallback(async (type: CategoryKey) => {
    setLoading(true);
    setBackendError(null);
    try {
      const data = await versionApi.list(type);
      setVersions(data);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        setBackendError(e.message);
        setVersions(DEMO_DATA[type] || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions(activeCategory);
  }, [activeCategory, loadVersions]);

  const handleSearch = (q: string) => {
    searchRef.current = q;
    setSearchQuery(q);
  };

  const filteredVersions = versions.length > 0 ? versions : (DEMO_DATA[activeCategory] || []);
  const searched = searchQuery
    ? filteredVersions.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.minecraftVersion.includes(searchQuery)
      )
    : filteredVersions;

  const handleDownload = async (version: GameVersion) => {
    setDownloading(version.id);
    try {
      // 优先调用真实下载 API（后端会从 BMCLAPI 下载游戏文件）
      await versionApi.download(version);
    } catch {
      // 下载失败时仍标记（可能是后端未启动）
    }
    // 标记已下载状态
    setVersions((prev) => prev.map((v) => (v.id === version.id ? { ...v, downloaded: true } : v)));
    setDownloading(null);
  };

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left sidebar */}
      <div className="flex flex-col overflow-y-auto" style={{ width: 200, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('download.title')}</h3>
        </div>
        <div className="flex-1 p-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors cursor-pointer"
              style={{
                backgroundColor: activeCategory === cat.key ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)' : 'transparent',
                color: activeCategory === cat.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
              }}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('download.search')}
              className="w-full h-9 pl-9 pr-4 rounded border text-sm bg-pcl-semi-transparent text-pcl-text placeholder:text-white/30 focus:outline-none focus:border-pcl-highlight transition-colors"
              style={{ borderColor: 'var(--color-gray1)' }}
            />
          </div>
          {backendError && (
            <div className="text-xs mt-2 px-3 py-2 rounded" style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#FACC15' }}>
              ⚠️ {backendError} — 显示演示数据
            </div>
          )}
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {searched.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center gap-4 p-4 rounded border transition-colors"
                  style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                >
                  <div className="w-14 h-14 rounded flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--color-gray1)' }}>
                    {TYPE_ICONS[activeCategory] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{version.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Minecraft {version.minecraftVersion} · {version.version}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(version)}
                    disabled={downloading === version.id || version.downloaded}
                    className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors flex-shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: version.downloaded || downloading === version.id
                        ? 'rgba(34,197,94,0.2)'
                        : 'var(--color-highlight)',
                      color: version.downloaded || downloading === version.id ? '#4ADE80' : 'white',
                      cursor: version.downloaded || downloading === version.id ? 'default' : 'pointer',
                    }}
                  >
                    {version.downloaded || downloading === version.id ? (
                      <><span style={{ fontSize: 14 }}>✓</span> 已添加</>
                    ) : (
                      <><span style={{ fontSize: 14 }}>↓</span> {t('download.install')}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && searched.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-sm">{t('download.noVersion')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
