import './i18n';
import './index.css';
import ThemeProvider from './store/ThemeProvider';
import { useAppStore } from './store/useAppStore';
import MainLayout from './components/layout/MainLayout';
import LaunchPage from './pages/LaunchPage';
import DownloadPage from './pages/DownloadPage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';

export default function App() {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <ThemeProvider>
      <MainLayout>
        {activeTab === 'launch' && <LaunchPage />}
        {activeTab === 'download' && <DownloadPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'tools' && <ToolsPage />}
      </MainLayout>
    </ThemeProvider>
  );
}
