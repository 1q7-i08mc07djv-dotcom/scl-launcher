import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { configApi, ApiError } from '../api';
import type { AppConfig } from '../api';
import MyCard from '../components/ui/MyCard';
import MyTextBox from '../components/ui/MyTextBox';
import MySlider from '../components/ui/MySlider';
import MyCheckBox from '../components/ui/MyCheckBox';
import MyButton from '../components/ui/MyButton';
import MyHint from '../components/ui/MyHint';

const SETTING_TABS = [
  { key: 'general', label: 'settings.general' },
  { key: 'game', label: 'settings.game' },
  { key: 'download', label: 'settings.download' },
  { key: 'account', label: 'settings.account' },
  { key: 'appearance', label: 'settings.appearance' },
  { key: 'about', label: 'settings.about' },
] as const;

type SettingTab = typeof SETTING_TABS[number]['key'];

const DOWNLOAD_SOURCES = [
  { key: 'BMCLAPI', label: 'BMCLAPI', desc: '速度快，无需 Token，推荐' },
  { key: 'GitCode', label: 'GitCode', desc: '需配置 Token，可访问 GitHub 加速' },
  { key: 'MCBBS', label: 'MCBBS', desc: '老牌镜像，速度一般' },
  { key: 'Aliyun', label: '阿里云', desc: '速度快，无需 Token' },
  { key: 'Tencent', label: '腾讯云', desc: '速度较好' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingTab>('general');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    theme, setTheme,
    language, setLanguage,
    javaPath, setJavaPath,
    memory, setMemory,
    jvmArgs, setJvmArgs,
    downloadSource, setDownloadSource,
    gitcodeToken, setGitcodeToken,
    autoJava, setAutoJava,
    customUUID, setCustomUUID,
    customDownloadUrl, setCustomDownloadUrl,
    skinUrl, setSkinUrl,
  } = useAppStore();

  const [localJavaPath, setLocalJavaPath] = useState(javaPath);
  const [localMemory, setLocalMemory] = useState(() => {
    const m = memory.replace('G', '').replace('M', '');
    return parseInt(m) || 2;
  });
  const [localJvmArgs, setLocalJvmArgs] = useState(jvmArgs);
  const [localGitcodeToken, setLocalGitcodeToken] = useState(gitcodeToken);
  const [localAutoJava, setLocalAutoJava] = useState(autoJava);
  const [localDownloadSource, setLocalDownloadSource] = useState(downloadSource);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localTheme, setLocalTheme] = useState(theme);
  const [localCustomUUID, setLocalCustomUUID] = useState(customUUID);
  const [localCustomDownloadUrl, setLocalCustomDownloadUrl] = useState(customDownloadUrl);
  const [localSkinUrl, setLocalSkinUrl] = useState(skinUrl);

  const loadConfig = useCallback(async () => {
    try {
      const cfg: AppConfig = await configApi.get();
      setLocalJavaPath(cfg.javaPath ?? '');
      setLocalMemory(parseInt((cfg.memory ?? '2G').replace('G', '').replace('M', '')) || 2);
      setLocalJvmArgs(cfg.jvmArgs ?? '');
      setLocalGitcodeToken(cfg.gitcodeToken ?? '');
      setLocalAutoJava(cfg.autoJava ?? true);
      setLocalDownloadSource(cfg.downloadSource ?? 'BMCLAPI');
      setLocalLanguage(cfg.language ?? 'zh-CN');
      if (cfg.theme) setLocalTheme(cfg.theme as 'dark' | 'light');
      setLocalCustomUUID(cfg.customUUID ?? '');
      setLocalCustomDownloadUrl(cfg.customDownloadUrl ?? '');
      setLocalSkinUrl(cfg.skinUrl ?? '');
      setJavaPath(cfg.javaPath ?? ''); setMemory(cfg.memory ?? '2G'); setJvmArgs(cfg.jvmArgs ?? '');
      setGitcodeToken(cfg.gitcodeToken ?? ''); setAutoJava(cfg.autoJava ?? true);
      setDownloadSource(cfg.downloadSource ?? 'BMCLAPI'); setLanguage(cfg.language ?? 'zh-CN');
      setCustomUUID(cfg.customUUID ?? ''); setCustomDownloadUrl(cfg.customDownloadUrl ?? ''); setSkinUrl(cfg.skinUrl ?? '');
      i18n.changeLanguage(cfg.language ?? 'zh-CN');
    } catch (e) {
      // use defaults if backend not running
    } finally {
      setLoading(false);
    }
  }, [i18n, setAutoJava, setDownloadSource, setGitcodeToken, setJavaPath, setJvmArgs, setLanguage, setMemory]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    const config: AppConfig = {
      language: localLanguage,
      theme: localTheme,
      javaPath: localJavaPath,
      autoJava: localAutoJava,
      memory: `${localMemory}G`,
      jvmArgs: localJvmArgs,
      downloadSource: localDownloadSource,
      gitcodeToken: localGitcodeToken,
      customUUID: localCustomUUID,
      customDownloadUrl: localCustomDownloadUrl,
      skinUrl: localSkinUrl,
    };
    try {
      await configApi.save(config);
    } catch (e) {
      if (e instanceof ApiError && e.isNetworkError) {
        // Save locally only if backend not running
      }
    }
    setJavaPath(localJavaPath); setMemory(`${localMemory}G`); setJvmArgs(localJvmArgs);
    setGitcodeToken(localGitcodeToken); setAutoJava(localAutoJava);
    setDownloadSource(localDownloadSource); setLanguage(localLanguage);
    setTheme(localTheme);
    setCustomUUID(localCustomUUID); setCustomDownloadUrl(localCustomDownloadUrl); setSkinUrl(localSkinUrl);
    i18n.changeLanguage(localLanguage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Left tabs */}
      <div
        className="flex flex-col"
        style={{ width: 180, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {t('settings.title')}
          </h3>
        </div>
        <div className="flex-1 p-2">
          {SETTING_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors cursor-pointer"
              style={{
                backgroundColor: activeTab === tab.key
                  ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                  : 'transparent',
                color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
              }}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {loading ? (
            <div className="text-center py-20" style={{ color: 'var(--color-text-secondary)' }}>
              {t('common.loading')}
            </div>
          ) : (
            <>
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <MyCard title={t('settings.language')}>
                    <div className="space-y-2">
                      {[
                        { key: 'zh-CN', label: '简体中文' },
                        { key: 'en-US', label: 'English' },
                      ].map((lang) => (
                        <button
                          key={lang.key}
                          onClick={() => setLocalLanguage(lang.key)}
                          className="w-full text-left px-3 py-2 rounded text-sm transition-colors border cursor-pointer"
                          style={{
                            backgroundColor: localLanguage === lang.key
                              ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                              : 'var(--color-card)',
                            borderColor: localLanguage === lang.key ? 'var(--color-highlight)' : 'var(--color-border)',
                            color: localLanguage === lang.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </MyCard>

                  <MyCard title={t('settings.general')}>
                    <div className="space-y-3">
                      <MyCheckBox
                        label={t('settings.autoJava')}
                        checked={localAutoJava}
                        onChange={(v) => setLocalAutoJava(v)}
                      />
                      <MyHint text="启用后，启动器将自动检测并下载所需版本的 Java" theme="blue" />
                    </div>
                  </MyCard>
                </div>
              )}

              {activeTab === 'game' && (
                <div className="space-y-4">
                  <MyCard title={t('settings.javaPath')}>
                    <div className="space-y-3">
                      <MyTextBox
                        value={localJavaPath}
                        onChange={(v) => setLocalJavaPath(v)}
                        placeholder="自动检测"
                      />
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        不填则自动检测已安装的 JDK/JRE
                      </div>
                    </div>
                  </MyCard>

                  <MyCard title={t('settings.memory')}>
                    <div className="space-y-4">
                      <MySlider
                        value={localMemory}
                        onChange={(v) => setLocalMemory(v)}
                        min={1} max={16} step={1}
                        label="最大内存"
                      />
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        建议分配 2-8 GB，过高可能导致游戏崩溃
                      </div>
                    </div>
                  </MyCard>

                  <MyCard title={t('settings.jvmArgs')}>
                    <div className="space-y-3">
                      <MyTextBox
                        value={localJvmArgs}
                        onChange={(v) => setLocalJvmArgs(v)}
                        placeholder="-XX:+UseG1GC -XX:+ParallelRefProcEnabled"
                      />
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        自定义 JVM 参数，不确定请留空
                      </div>
                    </div>
                  </MyCard>
                </div>
              )}

              {activeTab === 'download' && (
                <div className="space-y-4">
                  <MyCard title={t('settings.downloadSource')}>
                    <select
                      value={localDownloadSource}
                      onChange={(e) => setLocalDownloadSource(e.target.value)}
                      className="w-full px-3 py-2.5 rounded text-sm border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {DOWNLOAD_SOURCES.map((source) => (
                        <option key={source.key} value={source.key}>
                          {source.label} — {source.desc}
                        </option>
                      ))}
                    </select>
                  </MyCard>

                  {localDownloadSource === 'GitCode' && (
                    <MyCard title={t('settings.gitcodeToken')}>
                      <div className="space-y-3">
                        <MyTextBox
                          value={localGitcodeToken}
                          onChange={(v) => setLocalGitcodeToken(v)}
                          placeholder="请输入 GitCode Token"
                          type="password"
                        />
                        <MyHint text="Token 用于访问 GitCode 镜像加速，免费获取：https://gitcode.com" theme="yellow" />
                      </div>
                    </MyCard>
                  )}
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-4">
                  <MyCard title="自定义 UUID">
                    <div className="space-y-3">
                      <MyTextBox
                        value={localCustomUUID}
                        onChange={(v) => setLocalCustomUUID(v)}
                        placeholder="不填则自动生成"
                      />
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        自定义玩家 UUID，不填则使用随机生成的离线账户 UUID
                      </div>
                    </div>
                  </MyCard>

                  <MyCard title="皮肤站 URL">
                    <div className="space-y-3">
                      <MyTextBox
                        value={localSkinUrl}
                        onChange={(v) => setLocalSkinUrl(v)}
                        placeholder="https://littleskin.cn"
                      />
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        第三方皮肤站地址，如 LittleSkin、Alexskin 等，留空使用正版皮肤
                      </div>
                    </div>
                  </MyCard>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <MyCard title={t('settings.theme')}>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setLocalTheme('dark')}
                        className="flex-1 py-3 rounded border text-sm cursor-pointer transition-colors"
                        style={{
                          backgroundColor: localTheme === 'dark' ? 'var(--color-card)' : 'transparent',
                          borderColor: localTheme === 'dark' ? 'var(--color-highlight)' : 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        🌙 {t('settings.dark')}
                      </button>
                      <button
                        onClick={() => setLocalTheme('light')}
                        className="flex-1 py-3 rounded border text-sm cursor-pointer transition-colors"
                        style={{
                          backgroundColor: localTheme === 'light' ? 'var(--color-card)' : 'transparent',
                          borderColor: localTheme === 'light' ? 'var(--color-highlight)' : 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        ☀️ 浅色
                      </button>
                    </div>
                  </MyCard>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-4">
                  <MyCard title="关于 SCL 启动器">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base" style={{ color: 'var(--color-text)' }}>SCL Launcher</span>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
                        >
                          CE
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        版本 1.0.0
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        基于 React + Node.js 构建
                      </div>
                    </div>
                  </MyCard>

                  <MyCard title="开源协议">
                    <div className="space-y-2">
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        本软件采用 <span className="font-medium" style={{ color: 'var(--color-text)' }}>GPL v3</span> 开源协议。
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        详细协议内容请参阅项目根目录 LICENSE 文件。
                      </div>
                    </div>
                  </MyCard>

                  <MyCard title="隐私协议">
                    <div className="space-y-3">
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        我们高度重视您的个人隐私保护。
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        本软件不会上传您的任何个人数据。所有配置和账户信息均存储在本地。
                      </div>
                      <MyButton
                        text="查看完整隐私协议"
                        colorType="black"
                        height={32}
                        onClick={() => {
                          useAppStore.getState().setPrivacyAgreed(false);
                        }}
                      />
                    </div>
                  </MyCard>

                  <MyCard title="项目链接">
                    <div className="space-y-2">
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        GitHub:{' '}
                        <a
                          href="https://github.com/1q7-i08mc07djv-dotcom/scl-launcher"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          style={{ color: 'var(--color-highlight)' }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.electronAPI?.openFolder('https://github.com/1q7-i08mc07djv-dotcom/scl-launcher');
                          }}
                        >
                          github.com/1q7-i08mc07djv-dotcom/scl-launcher
                        </a>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        GitCode:{' '}
                        <a
                          href="https://gitcode.com/My_CSDN_Doudou/scl-launcher"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          style={{ color: 'var(--color-highlight)' }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.electronAPI?.openFolder('https://gitcode.com/My_CSDN_Doudou/scl-launcher');
                          }}
                        >
                          gitcode.com/My_CSDN_Doudou/scl-launcher
                        </a>
                      </div>
                    </div>
                  </MyCard>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex items-center gap-4">
            <MyButton
              text={t('settings.save')}
              colorType="highlight"
              height={36}
              onClick={handleSave}
            />
            {saved && (
              <span className="text-sm" style={{ color: '#4ADE80' }}>✓ 保存成功</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
