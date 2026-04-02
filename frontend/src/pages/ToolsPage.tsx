import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toolsApi } from '../api';
import MyCard from '../components/ui/MyCard';
import MyHint from '../components/ui/MyHint';

const TOOLS = [
  {
    id: 'memory',
    icon: '💾',
    title: 'tools.memoryOpt',
    desc: '优化内存占用，减少游戏崩溃',
    action: '立即优化',
  },
  {
    id: 'clean',
    icon: '🧹',
    title: 'tools.cleanCache',
    desc: '清理下载缓存、临时文件',
    action: '开始清理',
  },
  {
    id: 'kill',
    icon: '⛔',
    title: 'tools.killGame',
    desc: '强制关闭正在运行的 Minecraft',
    action: '关闭游戏',
  },
  {
    id: 'folder',
    icon: '📁',
    title: 'tools.openFolder',
    desc: '打开游戏数据存储目录',
    action: '打开目录',
  },
  {
    id: 'log',
    icon: '📋',
    title: 'tools.openLog',
    desc: '查看最近的启动日志',
    action: '查看日志',
  },
];

export default function ToolsPage() {
  const { t } = useTranslation();

  const handleTool = useCallback(async (id: string) => {
    try {
      switch (id) {
        case 'memory': {
          const r = await toolsApi.memoryOpt() as { success: boolean; message?: string };
          alert(r.success ? r.message : '优化失败');
          break;
        }
        case 'clean': {
          const r = await toolsApi.cleanCache() as { success: boolean; message?: string };
          alert(r.success ? r.message : '清理失败');
          break;
        }
        case 'kill': {
          const r = await toolsApi.killGame() as { success: boolean };
          alert(r.success ? '游戏已关闭' : '关闭失败');
          break;
        }
        case 'folder': {
          await toolsApi.openFolder();
          break;
        }
        case 'log': {
          await toolsApi.openLog();
          break;
        }
      }
    } catch (e) {
      console.error('Tool error:', e);
      alert('操作失败: ' + (e as Error).message);
    }
  }, []);

  return (
    <div className="flex w-full h-full" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Left sidebar */}
      <div
        className="flex flex-col border-r border-pcl-border"
        style={{ width: 200, backgroundColor: '#1E1E1A' }}
      >
        <div className="p-4 border-b border-pcl-border">
          <h3 className="text-sm font-medium text-white/60">{t('tools.title')}</h3>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleTool(tool.id)}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded
                  text-sm text-white/50 hover:text-white/80 hover:bg-white/5
                  transition-colors text-left
                "
              >
                <span className="text-base">{tool.icon}</span>
                <span>{t(tool.title)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-1">{t('tools.title')}</h2>
            <p className="text-sm text-white/40">常用工具和快捷操作</p>
          </div>

          <div className="space-y-4">
            {TOOLS.map((tool) => (
              <MyCard key={tool.id} title={t(tool.title)}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: '#2D2D2D' }}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/70">{tool.desc}</div>
                  </div>
                  <button
                    onClick={() => handleTool(tool.id)}
                    className="
                      px-4 py-2 rounded text-sm
                      bg-pcl-highlight hover:bg-pcl-highlight-hover
                      text-white transition-colors
                    "
                  >
                    {tool.action}
                  </button>
                </div>
              </MyCard>
            ))}

            {/* About */}
            <MyCard title={t('tools.about')}>
              <div className="space-y-3 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>SCL 启动器</span>
                  <span className="text-white/40">v2.13.4 CE</span>
                </div>
                <div className="flex justify-between">
                  <span>前端版本</span>
                  <span className="text-white/40">React + Vite</span>
                </div>
                <div className="flex justify-between">
                  <span>后端版本</span>
                  <span className="text-white/40">Spring Boot 3.2</span>
                </div>
                <MyHint
                  text="SCL 是独立开发的 Minecraft 启动器，设计灵感来自 PCL 社区版，但代码完全独立。"
                  theme="blue"
                  className="mt-2"
                />
              </div>
            </MyCard>
          </div>
        </div>
      </div>
    </div>
  );
}
