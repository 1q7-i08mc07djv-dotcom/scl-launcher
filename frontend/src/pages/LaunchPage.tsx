import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { accountApi, versionApi, launchApi, configApi, ApiError } from '../api';
import type { Account, AppConfig } from '../api';
import MyButton from '../components/ui/MyButton';
import MyLoading from '../components/ui/MyLoading';
import MicrosoftLoginDialog from '../components/ui/MicrosoftLoginDialog';
import { User, Plus } from 'lucide-react';

const DEMO_VERSIONS = [
  { id: '1.21.4', name: 'Minecraft 1.21.4', type: 'official', version: '1.21.4', minecraftVersion: '1.21.4', downloaded: false },
  { id: '1.21.3', name: 'Minecraft 1.21.3', type: 'official', version: '1.21.3', minecraftVersion: '1.21.3', downloaded: false },
  { id: '1.20.6', name: 'Minecraft 1.20.6', type: 'official', version: '1.20.6', minecraftVersion: '1.20.6', downloaded: false },
  { id: '1.20.4', name: 'Minecraft 1.20.4', type: 'official', version: '1.20.4', minecraftVersion: '1.20.4', downloaded: true },
  { id: '1.20.2', name: 'Minecraft 1.20.2', type: 'official', version: '1.20.2', minecraftVersion: '1.20.2', downloaded: false },
  { id: '1.19.4', name: 'Minecraft 1.19.4', type: 'official', version: '1.19.4', minecraftVersion: '1.19.4', downloaded: true },
  { id: '1.18.2', name: 'Minecraft 1.18.2', type: 'official', version: '1.18.2', minecraftVersion: '1.18.2', downloaded: false },
  { id: '1.16.5', name: 'Minecraft 1.16.5', type: 'official', version: '1.16.5', minecraftVersion: '1.16.5', downloaded: false },
  { id: '1.12.2', name: 'Minecraft 1.12.2', type: 'official', version: '1.12.2', minecraftVersion: '1.12.2', downloaded: false },
  { id: 'fabric-1.20.4', name: 'Fabric 1.20.4', type: 'fabric', version: '0.15.7', minecraftVersion: '1.20.4', downloaded: false },
  { id: 'forge-1.20.4', name: 'Forge 1.20.4', type: 'forge', version: '49.0.30', minecraftVersion: '1.20.4', downloaded: false },
  { id: 'forge-1.16.5', name: 'Forge 1.16.5', type: 'forge', version: '36.2.39', minecraftVersion: '1.16.5', downloaded: false },
];

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
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [loginType, setLoginType] = useState<'offline' | 'microsoft' | 'thirdparty'>('offline');
  const [username, setUsername] = useState('');
  const [showMicrosoftDialog, setShowMicrosoftDialog] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await accountApi.list();
      setAccounts(data);
      if (data.length > 0 && !currentAccount) {
        useAppStore.getState().setCurrentAccount(data[0]);
      }
      setBackendError(null);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        setBackendError(e.message);
      }
    } finally {
      setLoadingAccounts(false);
    }
  }, [currentAccount]);

  const loadConfig = useCallback(async () => {
    try {
      const cfg: AppConfig = await configApi.get();
      setLanguage(cfg.language ?? 'zh-CN');
      useAppStore.getState().setJavaPath(cfg.javaPath ?? '');
      useAppStore.getState().setMemory(cfg.memory ?? '2G');
      useAppStore.getState().setDownloadSource(cfg.downloadSource ?? 'BMCLAPI');
    } catch (e) {
      // ignore
    }
  }, [setLanguage]);

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const data = await versionApi.list();
      setVersions(data);
      setBackendError(null);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        setBackendError(e.message);
        // Fallback to demo data
        setVersions(DEMO_VERSIONS);
      }
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
      const newAccount = await accountApi.add({ type: loginType, username: username.trim() });
      setAccounts((prev) => [...prev, newAccount]);
      useAppStore.getState().setCurrentAccount(newAccount);
      setUsername('');
      setShowAccountPanel(false);
    } catch (e) {
      console.error('Failed to add account:', e);
    }
  };

  const handleDeleteAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await accountApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (currentAccount?.id === id) useAppStore.getState().setCurrentAccount(null);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) setBackendError((e as ApiError).message);
    }
  };

  const handleLaunch = async () => {
    if (!currentAccount || !selectedVersion) return;
    setIsLaunching(true);
    setLaunchProgress(0);
    setLaunchStep(t('launch.loadingVersions'));

    const steps = [
      { progress: 20, step: '验证账户...' },
      { progress: 40, step: '检查游戏文件...' },
      { progress: 60, step: '启动 Java 虚拟机...' },
      { progress: 80, step: '加载游戏资源...' },
      { progress: 95, step: '启动 Minecraft...' },
    ];

    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 600));
      setLaunchProgress(s.progress);
      setLaunchStep(s.step);
    }

    try {
      const result = await launchApi.launch({ account: currentAccount, version: selectedVersion });
      if (!result.success) alert('启动失败: ' + result.error);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        alert('后端未启动，请运行 start-dev.bat');
      }
    } finally {
      setIsLaunching(false);
    }
  };

  const versionList = useAppStore((s) => s.versions);
  const displayVersions = versionList.length > 0 ? versionList : DEMO_VERSIONS;

  const accountTypes = [
    { key: 'offline', label: t('account.offline') },
    { key: 'microsoft', label: t('account.microsoft') },
    { key: 'thirdparty', label: t('account.thirdParty') },
  ] as const;

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left panel */}
      <div
        className="flex flex-col"
        style={{ width: 300, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {t('account.title')}
            </span>
            <button
              onClick={() => setShowAccountPanel(!showAccountPanel)}
              className="flex items-center gap-1 text-xs cursor-pointer"
              style={{ color: 'var(--color-highlight)' }}
            >
              <Plus size={12} />
              {t('account.add')}
            </button>
          </div>

          <div
            className="flex items-center gap-3 p-3 rounded border cursor-pointer"
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            onClick={() => setShowAccountPanel(!showAccountPanel)}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-gray1)' }}>
              <User size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {currentAccount?.username || t('launch.noAccount')}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {currentAccount ? t(`launch.${currentAccount.type}`) : t('launch.loginRequired')}
              </div>
            </div>
          </div>

          {showAccountPanel && (
            <div className="mt-3 p-3 rounded border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex gap-1 mb-3">
                {accountTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setLoginType(type.key)}
                    className="flex-1 py-1.5 rounded text-xs transition-colors border cursor-pointer"
                    style={{
                      backgroundColor: loginType === type.key
                        ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                        : 'transparent',
                      borderColor: loginType === type.key ? 'var(--color-highlight)' : 'var(--color-border)',
                      color: loginType === type.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    }}
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
                  className="w-full h-8 px-3 rounded border text-sm bg-pcl-semi-transparent text-pcl-text placeholder:text-white/30 focus:outline-none focus:border-pcl-highlight mb-3"
                  style={{ borderColor: 'var(--color-gray1)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                />
              )}

              {loginType === 'microsoft' && (
                <div className="mb-3 space-y-2">
                  <div className="text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
                    使用 Microsoft 账户登录正版 Minecraft
                  </div>
                  <MyButton
                    text="登录 Microsoft 账户"
                    colorType="highlight"
                    height={32}
                    onClick={() => setShowMicrosoftDialog(true)}
                  />
                </div>
              )}

              {loginType === 'thirdparty' && (
                <div className="mb-3 text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
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
            <div className="flex justify-center py-8"><MyLoading size={30} /></div>
          ) : accounts.length === 0 && !backendError ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="text-xs">暂无账户</div>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => useAppStore.getState().setCurrentAccount(account)}
                  className="flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: currentAccount?.id === account.id
                      ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                      : 'var(--color-card)',
                    borderColor: currentAccount?.id === account.id ? 'var(--color-highlight)' : 'var(--color-border)',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-gray1)' }}>
                    <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{account.username}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t(`launch.${account.type}`)}</div>
                  </div>
                  <button onClick={(e) => handleDeleteAccount(account.id, e)} className="text-xs px-2 py-0.5 cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('account.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch button */}
        <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <MyButton
            text={isLaunching ? t('launch.loading') : (selectedVersion ? selectedVersion.name : t('launch.selectInstance'))}
            colorType={isLaunching ? 'black' : 'highlight'}
            height={54}
            disabled={!selectedVersion || isLaunching}
            onClick={handleLaunch}
            className="w-full"
          />
          <div className="text-xs text-center mt-2" style={{ color: 'var(--color-yellow)' }}>
            {selectedVersion
              ? `${selectedVersion.name} - ${selectedVersion.minecraftVersion}`
              : t('launch.loadingVersions')}
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>{t('launch.title')}</h2>
            {backendError && (
              <div className="text-xs mb-2 px-3 py-2 rounded" style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#FACC15' }}>
                ⚠️ {backendError} — 显示演示数据
              </div>
            )}
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {loadingVersions ? t('launch.loadingVersions') : `${displayVersions.length} 个版本`}
            </p>
          </div>

          {loadingVersions ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MyLoading size={50} />
              <div className="text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {displayVersions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => useAppStore.getState().setSelectedVersion(version)}
                  className="p-4 rounded border cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedVersion?.id === version.id
                      ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                      : 'var(--color-card)',
                    borderColor: selectedVersion?.id === version.id ? 'var(--color-highlight)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--color-gray1)' }}>
                      {version.type === 'fabric' ? '🧵' : version.type === 'forge' ? '🔨' : '🎮'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{version.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{version.version}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: version.downloaded ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)', color: version.downloaded ? '#4ADE80' : '#FACC15' }}>
                      {version.downloaded ? '已下载' : '未下载'}
                    </span>
                    <span className="text-xs uppercase" style={{ color: 'var(--color-text-secondary)' }}>{version.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Launching overlay */}
      {isLaunching && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="text-center">
            <MyLoading size={60} className="mx-auto mb-4" />
            <div className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)', transform: 'skewX(-3deg)' }}>
              {t('launch.loading')}
            </div>
            <div className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{selectedVersion?.name}</div>
            <div className="w-64 mx-auto h-1 rounded overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-gray1)' }}>
              <div className="h-full rounded transition-all duration-300" style={{ width: `${launchProgress}%`, background: 'linear-gradient(to right, var(--color-highlight), #60A5FA)' }} />
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              <div>{t('launch.currentStep')}: {launchStep}</div>
              <div>{t('launch.launchProgress')}: {launchProgress}%</div>
            </div>
            <MyButton text={t('launch.cancel')} height={35} className="mt-4" onClick={() => setIsLaunching(false)} />
          </div>
        </div>
      )}

      {showMicrosoftDialog && (
        <MicrosoftLoginDialog
          onLoginSuccess={(account) => {
            setAccounts((prev) => {
              const existing = prev.find((a) => a.uuid === account.uuid);
              if (existing) return prev;
              const newAccount: Account = {
                id: account.uuid,
                type: 'microsoft',
                username: account.username,
                uuid: account.uuid,
                token: account.token,
              };
              useAppStore.getState().setCurrentAccount(newAccount);
              return [...prev, newAccount];
            });
            setShowMicrosoftDialog(false);
            setShowAccountPanel(false);
          }}
          onCancel={() => setShowMicrosoftDialog(false)}
        />
      )}
    </div>
  );
}
