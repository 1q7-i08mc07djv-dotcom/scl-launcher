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

  useEffect(() => {
    loadVersions(activeCategory);
  }, [activeCategory, loadVersions]);

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

  const typeIcons: Record<string, string> = {
    fabric: '🧵',
    forge: '🔨',
    optifine: '✨',
    quilt: '🪺',
    neoforge: '🦊',
    official: '🎮',
  };

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Left sidebar */}
      <div
        className="flex flex-col border-r border-pcl-border overflow-y-auto"
        style={{ width: 200, backgroundColor: '#1E1E1A' }}
      >
        <div className="p-4 border-b border-pcl-border">
          <h3 className="text-sm font-medium text-white/60">{t('download.title')}</h3>
        </div>
        <div className="flex-1 p-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors
                ${activeCategory === cat.key
                  ? 'bg-pcl-highlight/20 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-pcl-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('download.search')}
              className="
                w-full h-9 pl-9 pr-4 rounded border border-pcl-gray1
                bg-pcl-semi-transparent text-white text-sm
                placeholder:text-white/30 focus:outline-none focus:border-pcl-highlight
              "
            />
          </div>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-white/40 text-sm">{t('common.loading')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className="
                    flex items-center gap-4 p-4 rounded border
                    bg-pcl-card border-pcl-border hover:bg-pcl-card-hover transition-colors
                  "
                >
                  <div
                    className="w-14 h-14 rounded flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: '#2D2D2D' }}
                  >
                    {typeIcons[activeCategory] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{version.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      Minecraft {version.minecraftVersion} · {version.version}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(version)}
                    disabled={downloading === version.id}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded text-sm
                      transition-colors flex-shrink-0
                      ${version.downloaded || downloading === version.id
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-pcl-highlight hover:bg-pcl-highlight-hover text-white'
                      }
                    `}
                  >
                    {version.downloaded || downloading === version.id ? (
                      <>
                        <CheckCircle size={16} />
                        已添加
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        {t('download.install')}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredVersions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-sm">{t('download.noVersion')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
