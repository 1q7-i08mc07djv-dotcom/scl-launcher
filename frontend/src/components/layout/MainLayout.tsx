import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Rocket, Download, Settings, Wrench } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { NavTab } from '../../store/useAppStore';
import StatusBar from '../layout/StatusBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, theme, setTheme } = useAppStore();
  const [version] = useState('1.0.0');

  const tabs: { key: NavTab; label: string; icon: React.ReactNode }[] = [
    { key: 'launch', label: t('nav.launch'), icon: <Rocket size={18} /> },
    { key: 'download', label: t('nav.download'), icon: <Download size={18} /> },
    { key: 'settings', label: t('nav.settings'), icon: <Settings size={18} /> },
    { key: 'tools', label: t('nav.tools'), icon: <Wrench size={18} /> },
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
          <div className="flex items-center" style={{ gap: 4 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: activeTab === tab.key ? 'var(--color-highlight)' : 'var(--color-border)',
                  backgroundColor: activeTab === tab.key
                    ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
                    : 'transparent',
                  color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.key) {
                    (e.target as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-highlight) 10%, transparent)';
                    (e.target as HTMLElement).style.borderColor = 'var(--color-highlight)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.key) {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Backend start + Theme toggle + version + controls */}
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              onClick={async () => {
                if (window.electronAPI) {
                  await window.electronAPI.startBackend();
                } else {
                  const bat = 'C:\\Users\\Doudou\\WorkBuddy\\20260401175534\\start-backend.bat';
                  window.open(`cmd.exe /c start /min "" "${bat}"`, '_blank');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 28,
                padding: '0 10px',
                borderRadius: 3,
                border: '1px solid var(--color-highlight)',
                backgroundColor: 'color-mix(in srgb, var(--color-highlight) 20%, transparent)',
                color: 'var(--color-highlight)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              title="启动后端服务"
            >
              <Play size={11} />
              启动后端
            </button>

            <span className="text-xs" style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
              {version}
            </span>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                outline: 'none',
                fontSize: 14,
                fontFamily: 'sans-serif',
              }}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>

            {/* Minimize */}
            <button
              onClick={() => window.electronAPI?.minimize()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                outline: 'none',
                fontSize: 16,
                fontFamily: 'sans-serif',
              }}
              title="最小化"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              ─
            </button>

            {/* Close */}
            <button
              onClick={() => window.electronAPI?.close()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                outline: 'none',
                fontSize: 16,
                fontFamily: 'sans-serif',
              }}
              title="关闭"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.8)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'; }}
            >
              ✕
            </button>
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
