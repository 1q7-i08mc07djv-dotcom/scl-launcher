const API_BASE = 'http://localhost:8765/api';

// ─── API Error ──────────────────────────────────────────────
export class ApiError {
  constructor(
    public message: string,
    public isNetworkError: boolean = false
  ) {}
}

// ─── Shared types ────────────────────────────────────────────
export interface Account {
  id: string;
  type: string;
  username: string;
  uuid?: string;
  token?: string;
}

export interface GameVersion {
  id: string;
  name: string;
  type: string;
  version: string;
  minecraftVersion: string;
  downloaded: boolean;
  path?: string;
}

export interface AppConfig {
  language?: string;
  theme?: string;
  javaPath?: string;
  autoJava?: boolean;
  memory?: string;
  jvmArgs?: string;
  downloadSource?: string;
  gitcodeToken?: string;
  customUUID?: string;
  customDownloadUrl?: string;
  skinUrl?: string;
  privacyAgreed?: boolean;
}

// ─── Request helper ─────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof TypeError) {
      throw new ApiError('后端服务未启动，请先运行 start-dev.bat 启动后端', true);
    }
    throw new ApiError((e as Error).message || '请求失败');
  }
}

// ─── Accounts ───────────────────────────────────────────────
export const accountApi = {
  list: () => request<Account[]>('/accounts'),
  add: (account: Partial<Account>) => request<Account>('/accounts', { method: 'POST', body: JSON.stringify(account) }),
  delete: (id: string) => request('/accounts/' + id, { method: 'DELETE' }),
};

// ─── Versions ────────────────────────────────────────────────
export const versionApi = {
  list: (type?: string) => request<GameVersion[]>(`/versions${type ? '?type=' + type : ''}`),
  downloaded: () => request<GameVersion[]>('/versions/downloaded'),
  markDownloaded: (v: GameVersion) => request('/versions/mark-downloaded', { method: 'POST', body: JSON.stringify(v) }),
  removeDownloaded: (id: string) => request('/versions/downloaded/' + id, { method: 'DELETE' }),
};

// ─── Config ──────────────────────────────────────────────────
export const configApi = {
  get: () => request<AppConfig>('/config'),
  save: (cfg: AppConfig) => request('/config', { method: 'POST', body: JSON.stringify(cfg) }),
};

// ─── Launch ──────────────────────────────────────────────────
export interface LaunchRequest {
  account: Account;
  version: GameVersion;
}

export interface LaunchResult {
  success: boolean;
  error?: string;
  pid?: number;
  message?: string;
}

export const launchApi = {
  launch: (req: LaunchRequest) => request<LaunchResult>('/launch', { method: 'POST', body: JSON.stringify(req) }),
  kill: () => request<{ success: boolean; message?: string }>('/launch/kill', { method: 'POST' }),
  status: () => request<{ running: boolean }>('/launch/status'),
};

// ─── Tools ───────────────────────────────────────────────────
export const toolsApi = {
  openFolder: (path?: string) => request('/tools/open-folder', { method: 'POST', body: JSON.stringify({ path }) }),
  openLog: () => request('/tools/open-log', { method: 'POST' }),
  cleanCache: () => request<{ success: boolean; cleaned?: number; message?: string }>('/tools/clean-cache', { method: 'POST' }),
  memoryOpt: () => request<{ success: boolean; message?: string }>('/tools/memory-opt', { method: 'POST' }),
  killGame: () => request('/tools/kill-game', { method: 'POST' }),
  about: () => request<{ name: string; version: string }>('/tools/about'),
};
