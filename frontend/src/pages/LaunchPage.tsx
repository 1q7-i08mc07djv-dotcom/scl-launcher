import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { accountApi, versionApi, launchApi, configApi } from '../api';
import type { Account, GameVersion, AppConfig } from '../api';
import MyButton from '../components/ui/MyButton';
import MyLoading from '../components/ui/MyLoading';
import { User, Plus } from 'lucide-react';

export default function LaunchPage() {
  const { t } = useTranslation();
  const {
    currentAccount,
    selectedVersion,
    isLaunching,
    setIsLaunching,
    launchStep,
    setLaunchStep,
    launchProgress,
    setLaunchProgress,
    setVersions,
    setLanguage,
  } = useAppStore();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [versions, setLocalVersions] = useState<GameVersion[]>([]);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [loginType, setLoginType] = useState<'offline' | 'microsoft' | 'thirdparty'>('offline');
  const [username, setUsername] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Load accounts from backend
  const loadAccounts = useCallback(async () => {
    try {
      const data = await accountApi.list();
      setAccounts(data);
      if (data.length > 0 && !currentAccount) {
        useAppStore.getState().setCurrentAccount(data[0]);
      }
    } catch (e) {
      console.error('Failed to load accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  }, [currentAccount]);

  // Load config (for language)
  const loadConfig = useCallback(async () => {
    try {
      const cfg: AppConfig = await configApi.get();
      setLanguage(cfg.language);
      useAppStore.getState().setJavaPath(cfg.javaPath);
      useAppStore.getState().setMemory(cfg.memory);
      useAppStore.getState().setDownloadSource(cfg.downloadSource);
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }, [setLanguage]);

  // Load versions from backend
  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const data = await versionApi.list();
      setVersions(data);
      setLocalVersions(data);
    } catch (e) {
      console.error('Failed to load versions:', e);
      // Fall back to demo data
      setLocalVersions([
        { id: '1.20.4', name: 'Minecraft 1.20.4', type: 'official', version: '1.20.4', minecraftVersion: '1.20.4', downloaded: false },
        { id: '1.19.4', name: 'Minecraft 1.19.4', type: 'official', version: '1.19.4', minecraftVersion: '1.19.4', downloaded: false },
        { id: '1.18.2', name: 'Minecraft 1.18.2', type: 'official', version: '1.18.2', minecraftVersion: '1.18.2', downloaded: false },
        { id: '1.16.5', name: 'Minecraft 1.16.5', type: 'official', version: '1.16.5', minecraftVersion: '1.16.5', downloaded: false },
        { id: '1.12.2', name: 'Minecraft 1.12.2', type: 'official', version: '1.12.2', minecraftVersion: '1.12.2', downloaded: false },
      ]);
    } finally {
      setLoadingVersions(false);
    }
  }, [setVersions]);

  useEffect(() => {
    loadAccounts();
    loadConfig();
    loadVersions();
  }, [loadAccounts, loadConfig, loadVersions]);

  const handleAddAccount = async () => {
    if (!username.trim()) return;
    try {
      const newAccount = await accountApi.add({
        type: loginType,
        username: username.trim(),
      });
      setAccounts((prev) => [...prev, newAccount]);
      useAppStore.getState().setCurrentAccount(newAccount);
      setUsername('');
      setShowAccountPanel(false);
    } catch (e) {
      console.error('Failed to add account:', e);
    }
  };

  const handleSelectAccount = (account: Account) => {
    useAppStore.getState().setCurrentAccount(account);
  };

  const handleDeleteAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await accountApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (currentAccount?.id === id) {
        useAppStore.getState().setCurrentAccount(null);
      }
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
  };

  const handleLaunch = async () => {
    if (!currentAccount || !selectedVersion) return;
    setIsLaunching(true);
    setLaunchProgress(0);
    setLaunchStep(t('launch.loadingVersions'));

    // Simulate progress
    const steps = [
      { progress: 20, step: '验证账户...' },
      { progress: 40, step: '检查游戏文件...' },
      { progress: 60, step: '启动 Java 虚拟机...' },
      { progress: 80, step: '加载游戏资源...' },
      { progress: 95, step: '启动 Minecraft...' },
    ];

    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 800));
      setLaunchProgress(s.progress);
      setLaunchStep(s.step);
    }

    try {
      const result = await launchApi.launch({
        account: currentAccount,
        version: selectedVersion,
      });
      if (!result.success) {
        alert('启动失败: ' + result.error);
      }
    } catch (e) {
      console.error('Launch failed:', e);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSelectVersion = (version: GameVersion) => {
    useAppStore.getState().setSelectedVersion(version);
  };

  const accountTypes = [
    { key: 'offline', label: t('account.offline') },
    { key: 'microsoft', label: t('account.microsoft') },
    { key: 'thirdparty', label: t('account.thirdParty') },
  ] as const;

  return (
    <div className="flex w-full h-full">
      {/* Left panel */}
      <div
        className="flex flex-col border-r border-pcl-border"
        style={{ width: 300, backgroundColor: '#1E1E1A' }}
      >
        {/* Account section */}
        <div className="p-5 border-b border-pcl-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">{t('account.title')}</span>
            <button
              onClick={() => setShowAccountPanel(!showAccountPanel)}
              className="flex items-center gap-1 text-xs text-pcl-highlight hover:text-pcl-highlight-hover"
            >
              <Plus size={12} />
              {t('account.add')}
            </button>
          </div>

          {/* Current account */}
          <div
            className="flex items-center gap-3 p-3 rounded border border-pcl-border bg-pcl-card cursor-pointer hover:bg-pcl-card-hover transition-colors"
            onClick={() => setShowAccountPanel(!showAccountPanel)}
          >
            <div className="w-10 h-10 rounded-full bg-pcl-gray1 flex items-center justify-center">
              <User size={20} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {currentAccount?.username || t('launch.noAccount')}
              </div>
              <div className="text-xs text-white/40">
                {currentAccount ? t(`launch.${currentAccount.type}`) : t('launch.loginRequired')}
              </div>
            </div>
          </div>

          {/* Add account panel */}
          {showAccountPanel && (
            <div className="mt-3 p-3 border border-pcl-border rounded bg-pcl-card">
              <div className="flex gap-1 mb-3">
                {accountTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setLoginType(type.key)}
                    className={`
                      flex-1 py-1.5 rounded text-xs transition-colors border
                      ${loginType === type.key
                        ? 'bg-pcl-highlight/20 border-pcl-highlight text-white'
                        : 'bg-transparent border-pcl-border text-white/50 hover:text-white/80'
                      }
                    `}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {loginType === 'offline' && (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('account.username')}
                  className="
                    w-full h-8 px-3 rounded border border-pcl-gray1
                    bg-pcl-semi-transparent text-white text-sm
                    placeholder:text-white/30 focus:outline-none focus:border-pcl-highlight mb-3
                  "
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                />
              )}

              {loginType === 'microsoft' && (
                <div className="mb-3 text-xs text-white/50 text-center py-2">
                  {t('launch.microsoft')} - {t('common.loading')}
                </div>
              )}

              {loginType === 'thirdparty' && (
                <div className="mb-3 text-xs text-white/50 text-center py-2">
                  {t('launch.thirdParty')} - {t('common.loading')}
                </div>
              )}

              <MyButton
                text={t('account.add')}
                colorType="highlight"
                height={32}
                onClick={handleAddAccount}
                disabled={loginType === 'offline' ? !username.trim() : false}
              />
            </div>
          )}
        </div>

        {/* Account list */}
        <div className="flex-1 overflow-y-auto p-5">
          {loadingAccounts ? (
            <div className="flex justify-center py-8">
              <MyLoading size={30} />
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  className={`
                    flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors
                    ${currentAccount?.id === account.id
                      ? 'bg-pcl-highlight/20 border-pcl-highlight'
                      : 'bg-pcl-card border-pcl-border hover:bg-pcl-card-hover'
                    }
                  `}
                >
                  <div className="w-8 h-8 rounded-full bg-pcl-gray1 flex items-center justify-center">
                    <User size={16} className="text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{account.username}</div>
                    <div className="text-xs text-white/40">{t(`launch.${account.type}`)}</div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteAccount(account.id, e)}
                    className="text-white/30 hover:text-red-400 text-xs px-2 py-0.5"
                  >
                    {t('account.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch button */}
        <div className="p-5 border-t border-pcl-border">
          <MyButton
            text={isLaunching ? t('launch.loading') : (selectedVersion ? selectedVersion.name : t('launch.selectInstance'))}
            colorType={isLaunching ? 'black' : 'highlight'}
            height={54}
            disabled={!currentAccount || !selectedVersion || isLaunching}
            onClick={handleLaunch}
            className="w-full"
          />
          <div className="text-xs text-center mt-2" style={{ color: '#8C7721' }}>
            {selectedVersion
              ? `${selectedVersion.name} - ${selectedVersion.minecraftVersion}`
              : t('launch.loadingVersions')}
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-1">{t('launch.title')}</h2>
            <p className="text-sm text-white/40">
              {loadingVersions ? t('launch.loadingVersions') : `${versions.length} 个版本`}
            </p>
          </div>

          {loadingVersions ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MyLoading size={50} />
              <div className="text-sm text-white/40 mt-4">{t('common.loading')}</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {versions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => handleSelectVersion(version)}
                  className={`
                    p-4 rounded border cursor-pointer transition-all
                    ${selectedVersion?.id === version.id
                      ? 'bg-pcl-highlight/20 border-pcl-highlight'
                      : 'bg-pcl-card border-pcl-border hover:bg-pcl-card-hover'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center text-2xl"
                      style={{ backgroundColor: '#2D2D2D' }}
                    >
                      🎮
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{version.name}</div>
                      <div className="text-xs text-white/40">{version.version}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-xs px-2 py-0.5 rounded
                      ${version.downloaded
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                      }
                    `}>
                      {version.downloaded ? '已下载' : '未下载'}
                    </span>
                    <span className="text-xs text-white/30 uppercase">{version.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Launching overlay */}
      {isLaunching && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
          <div className="text-center">
            <MyLoading size={60} className="mx-auto mb-4" />
            <div
              className="text-xl font-medium text-white mb-2"
              style={{ fontFamily: 'inherit', transform: 'skewX(-3deg)' }}
            >
              {t('launch.loading')}
            </div>
            <div className="text-sm text-white/60 mb-4">
              {selectedVersion?.name}
            </div>
            <div className="w-64 mx-auto h-1 bg-pcl-gray1 rounded overflow-hidden mb-4">
              <div
                className="h-full rounded transition-all duration-300"
                style={{
                  width: `${launchProgress}%`,
                  background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
                }}
              />
            </div>
            <div className="text-xs text-white/40 space-y-1">
              <div>{t('launch.currentStep')}: {launchStep}</div>
              <div>{t('launch.launchProgress')}: {launchProgress}%</div>
            </div>
            <MyButton
              text={t('launch.cancel')}
              height={35}
              className="mt-4"
              onClick={() => setIsLaunching(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
