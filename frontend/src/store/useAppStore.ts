import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavTab = 'launch' | 'download' | 'settings' | 'tools';

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
}

export interface AppState {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Accounts
  accounts: Account[];
  currentAccount: Account | null;
  addAccount: (account: Account) => void;
  removeAccount: (id: string) => void;
  setCurrentAccount: (account: Account | null) => void;

  // Game versions
  versions: GameVersion[];
  selectedVersion: GameVersion | null;
  setVersions: (versions: GameVersion[]) => void;
  setSelectedVersion: (version: GameVersion | null) => void;

  // Settings
  language: string;
  setLanguage: (lang: string) => void;
  javaPath: string;
  setJavaPath: (path: string) => void;
  memory: string;
  setMemory: (mem: string) => void;
  jvmArgs: string;
  setJvmArgs: (args: string) => void;
  downloadSource: string;
  setDownloadSource: (source: string) => void;
  gitcodeToken: string;
  setGitcodeToken: (token: string) => void;
  autoJava: boolean;
  setAutoJava: (auto: boolean) => void;

  // Launching state
  isLaunching: boolean;
  setIsLaunching: (launching: boolean) => void;
  launchStep: string;
  setLaunchStep: (step: string) => void;
  launchProgress: number;
  setLaunchProgress: (progress: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      activeTab: 'launch',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Accounts
      accounts: [],
      currentAccount: null,
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          currentAccount:
            state.currentAccount?.id === id ? null : state.currentAccount,
        })),
      setCurrentAccount: (account) => set({ currentAccount: account }),

      // Game versions
      versions: [],
      selectedVersion: null,
      setVersions: (versions) => set({ versions }),
      setSelectedVersion: (version) => set({ selectedVersion: version }),

      // Settings
      language: localStorage.getItem('scl-lang') || 'zh-CN',
      setLanguage: (lang) => {
        localStorage.setItem('scl-lang', lang);
        set({ language: lang });
      },
      javaPath: '',
      setJavaPath: (javaPath) => set({ javaPath }),
      memory: '2G',
      setMemory: (memory) => set({ memory }),
      jvmArgs: '',
      setJvmArgs: (jvmArgs) => set({ jvmArgs }),
      downloadSource: 'BMCLAPI',
      setDownloadSource: (downloadSource) => set({ downloadSource }),
      gitcodeToken: '',
      setGitcodeToken: (gitcodeToken) => set({ gitcodeToken }),
      autoJava: true,
      setAutoJava: (autoJava) => set({ autoJava }),

      // Launching state
      isLaunching: false,
      setIsLaunching: (isLaunching) => set({ isLaunching }),
      launchStep: '',
      setLaunchStep: (launchStep) => set({ launchStep }),
      launchProgress: 0,
      setLaunchProgress: (launchProgress) => set({ launchProgress }),
    }),
    {
      name: 'scl-storage',
      partialize: (state) => ({
        language: state.language,
        javaPath: state.javaPath,
        memory: state.memory,
        jvmArgs: state.jvmArgs,
        downloadSource: state.downloadSource,
        gitcodeToken: state.gitcodeToken,
        autoJava: state.autoJava,
        accounts: state.accounts,
        currentAccount: state.currentAccount,
      }),
    }
  )
);
