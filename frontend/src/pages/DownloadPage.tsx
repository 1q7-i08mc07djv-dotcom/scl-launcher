import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { versionApi } from '../api';
import type { GameVersion } from '../api';
import { Search, Download, CheckCircle } from 'lucide-react';

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

export default function DownloadPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadVersions = useCallback(async (type: CategoryKey) => {
    setLoading(true);
    try {
      const data = await versionApi.list(type);
      setVersions(data);
    } catch (e) {
      console.error('Failed to load versions:', e);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVersions(activeCategory); }, [activeCategory, loadVersions]);

  const filteredVersions = versions.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.minecraftVersion.includes(searchQuery)
  );

  const handleDownload = async (version: GameVersion) => {
    setDownloading(version.id);
    try {
      await versionApi.markDownloaded(version);
      setVersions((prev) =>
        prev.map((v) => (v.id === version.id ? { ...v, downloaded: true } : v))
      );
    } catch (e) {
      console.error('Failed to mark downloaded:', e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left sidebar */}
      <div
        className="flex flex-col overflow-y-auto"
        style={{ width: 200, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {t('download.title')}
          </h3>
        </div>
        <div className="flex-1 p-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors cursor-pointer"
              style={{
                backgroundColor: activeCategory === cat.key
                  ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                  : 'transparent',
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('download.search')}
              className="
                w-full h-9 pl-9 pr-4 rounded border text-sm
                bg-pcl-semi-transparent text-pcl-text
                placeholder:text-white/30 focus:outline-none focus:border-pcl-highlight
              "
              style={{ borderColor: 'var(--color-gray1)' }}
            />
          </div>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {t('common.loading')}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center gap-4 p-4 rounded border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-gray1)' }}
                  >
                    {TYPE_ICONS[activeCategory] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {version.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Minecraft {version.minecraftVersion} · {version.version}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(version)}
                    disabled={downloading === version.id}
                    className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors flex-shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: version.downloaded || downloading === version.id
                        ? 'rgba(34,197,94,0.2)'
                        : 'var(--color-highlight)',
                      color: version.downloaded || downloading === version.id ? '#4ADE80' : 'white',
                    }}
                  >
                    {version.downloaded || downloading === version.id ? (
                      <><CheckCircle size={16} /> 已添加</>
                    ) : (
                      <><Download size={16} /> {t('download.install')}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredVersions.length === 0 && (
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
