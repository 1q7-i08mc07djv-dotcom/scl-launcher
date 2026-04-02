import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import type { NavTab } from '../../store/useAppStore';
import MyRadioButton from '../ui/MyRadioButton';
import MyIconButton from '../ui/MyIconButton';
import StatusBar from '../layout/StatusBar';

const ICONS = {
  launch: 'M52.1,164.5c-1.4,0-3.1-0.5-4.2-1.3c-2.6-1.7-4-4.2-4-7V43.8c0-2.9,1.6-5.8,4.1-7c1.2-0.8,2.7-1.2,4.1-1.2c1.5,0,2.9,0.4,4.2,1.2L153.1,93c0,0,0.1,0,0.1,0.1c2.6,1.7,4,4.2,4,7c0,3-1.7,5.8-4.2,7.1l-96.8,56.2C55.1,164,53.5,164.5,52.1,164.5z M60.4,142.1l72.1-42.1L60.4,58.2V142.1z',
  download: 'M955 610h-59c-15 0-29 13-29 29v196c0 15-13 29-29 29h-649c-15 0-29-13-29-29v-196c0-15-13-29-29-29h-59c-15 0-29 13-29 29V905c0 43 35 78 78 78h787c43 0 78-35 78-78V640c0-15-13-29-29-29zM492 740c11 11 29 11 41 0l265-265c11-11 11-29 0-41l-41-41c-11-11-29-11-41 0l-110 110c-11 11-33 3-33-13V68C571 53 555 39 541 39h-59c-15 0-29 13-29 29v417c0 17-21 25-33 13l-110-110c-11-11-29-11-41 0L226 433c-11 11-11 29 0 41L492 740z',
  settings: 'M940.4 463.7L773.3 174.2c-17.3-30-49.2-48.4-83.8-48.4H340.2c-34.6 0-66.5 18.5-83.8 48.4L89.2 463.7c-17.3 30-17.3 66.9 0 96.8L256.4 850c17.3 30 49.2 48.4 83.8 48.4h349.2c34.6 0 66.5-18.5 83.8-48.4l167.2-289.5c17.3-29.9 17.3-66.8 0-96.8z',
  tools: 'M623.0016 208.5376c-103.6288-103.6288-269.4144-103.6288-352.256-20.736L415.744 332.8512 332.8 415.7952 187.8016 270.6944c-82.944 82.944-82.944 248.6784 20.736 352.3072 66.56 66.6112 158.9248 88.32 276.8896 64.9728l13.2608-2.7648 198.656 198.656a41.472 41.472 0 0 0 54.7328 3.4304l3.8912-3.4304 127.8976-127.8976a41.472 41.472 0 0 0 3.4304-54.7328l-3.4304-3.8912-198.656-198.656c27.648-124.3648 6.912-221.0816-62.208-290.1504z',
  close: 'M1097 584 250 584 562 896C591 925 591 972 562 1001 533 1030 487 1030 458 1001L21 565C6 550-0 531 0 511L0 511 0 511C-0 492 6 472 21 457L458 21C487-7 533-7 562 21 591 50 591 97 562 126L250 438 1097 438C1137 438 1170 471 1170 511 1170 551 1137 584 1097 584L1097 584Z',
  minimize: 'M0,0 h15 v2 h-15 v-2 Z',
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, theme, setTheme } = useAppStore();
  const [version] = useState('2.14.0 (社区版)');

  const tabs: { key: NavTab; icon: string; label: string }[] = [
    { key: 'launch', icon: ICONS.launch, label: t('nav.launch') },
    { key: 'download', icon: ICONS.download, label: t('nav.download') },
    { key: 'settings', icon: ICONS.settings, label: t('nav.settings') },
    { key: 'tools', icon: ICONS.tools, label: t('nav.tools') },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden font-pcl"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Edge effects */}
      <div className="absolute top-0 left-0 right-0 h-2.5 edge-gradient-top z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-2.5 edge-gradient-bottom z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-0 w-2.5 edge-gradient-left z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-2.5 edge-gradient-right z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-4 h-4 corner-tl z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 corner-tr z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 corner-bl z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 corner-br z-10 pointer-events-none" />

      {/* Main window */}
      <div
        className="absolute inset-2 rounded"
        style={{
          backgroundColor: 'var(--color-bg)',
          boxShadow: '0 2px 8px var(--shadow-color)',
        }}
      >
        {/* Title bar */}
        <div
          className="title-bar flex items-center justify-between px-4"
          style={{
            height: 48,
            backgroundColor: 'var(--title-bar-bg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
              SCL
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
            >
              CE
            </span>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center">
            {tabs.map((tab) => (
              <MyRadioButton
                key={tab.key}
                text={tab.label}
                logo={tab.icon}
                logoScale={0.9}
                checked={activeTab === tab.key}
                onChange={() => setActiveTab(tab.key)}
                margin="0 4px"
              />
            ))}
          </div>

          {/* Right: Theme toggle + version + controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {version}
            </span>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <MyIconButton
              logo={ICONS.minimize}
              theme="white"
              size={28}
              onClick={() => {}}
              tooltip="最小化"
            />
            <MyIconButton
              logo={ICONS.close}
              theme="white"
              size={28}
              onClick={() => {}}
              tooltip="关闭"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full" style={{ height: 'calc(100% - 48px)' }}>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <StatusBar />
        </div>
      </div>
    </div>
  );
}
