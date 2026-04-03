import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Play } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      startBackend: () => Promise<{ success: boolean }>;
      openFolder: (path?: string) => Promise<{ success: boolean; error?: string }>;
      openLog: () => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export default function StatusBar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8765/api/tools/about', {
        signal: AbortSignal.timeout(2000),
      });
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      checkBackend();
      timer = setTimeout(loop, 8000);
    };
    checkBackend();
    loop();
    return () => clearTimeout(timer);
  }, [checkBackend]);

  const handleStartBackend = async () => {
    setStarting(true);
    try {
      // Use Electron IPC if available, otherwise fallback
      if (window.electronAPI) {
        await window.electronAPI.startBackend();
      } else {
        // Web fallback
        const bat = 'C:\\Users\\Doudou\\WorkBuddy\\20260401175534\\start-backend.bat';
        window.open(`cmd.exe /c start /min "" "${bat}"`, '_blank');
      }
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  };

  if (connected === null) return null;

  if (!connected) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2 text-sm"
        style={{
          backgroundColor: 'rgba(234,179,8,0.12)',
          borderTop: '1px solid rgba(234,179,8,0.25)',
          color: '#FACC15',
        }}
      >
        <WifiOff size={14} className="flex-shrink-0" />
        <span className="flex-1">后端服务未连接</span>
        <button
          onClick={handleStartBackend}
          disabled={starting}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium cursor-pointer transition-opacity disabled:opacity-60"
          style={{
            backgroundColor: 'rgba(234,179,8,0.2)',
            border: '1px solid rgba(234,179,8,0.4)',
            color: '#FACC15',
          }}
        >
          <Play size={11} />
          {starting ? '启动中...' : '启动后端'}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 text-xs"
      style={{
        backgroundColor: 'rgba(34,197,94,0.08)',
        borderTop: '1px solid rgba(34,197,94,0.15)',
        color: '#4ADE80',
      }}
    >
      <Wifi size={12} className="flex-shrink-0" />
      <span>后端已连接</span>
    </div>
  );
}
