#include <windows.h>
#include <wininet.h>
#include <shlwapi.h>
#include <commctrl.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <direct.h>
#include <process.h>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "comctl32.lib")

#define APP_NAME L"SCL - SUPER CRAFT LAUNCHER"
#define APP_VERSION L"v1.0.0"
#define WM_TRAYICON (WM_APP + 1)
#define ID_TRAY_EXIT 1001

#define THEME_COUNT 5

typedef struct {
    COLORREF bgColor;
    COLORREF sidebarColor;
    COLORREF accentColor;
    COLORREF textColor;
    COLORREF buttonColor;
    COLORREF hoverColor;
    COLORREF cardColor;
    COLORREF borderColor;
    COLORREF successColor;
    COLORREF warningColor;
    COLORREF errorColor;
} Theme;

typedef enum {
    THEME_BLUE,
    THEME_GREEN,
    THEME_PURPLE,
    THEME_ORANGE,
    THEME_RED
} ThemeID;

typedef struct {
    WCHAR id[64];
    WCHAR name[128];
    WCHAR type[32];
    BOOL isInstalled;
} GameVersion;

typedef struct {
    WCHAR name[64];
    WCHAR javaPath[MAX_PATH];
    WCHAR memory[16];
    WCHAR gameDir[MAX_PATH];
} Account;

typedef struct {
    HWND hwnd;
    HWND hwndSidebar;
    HWND hwndMain;
    HWND hwndStatus;
    
    HWND btnHome;
    HWND btnVersions;
    HWND btnAccounts;
    HWND btnSettings;
    HWND btnTheme;
    
    HWND btnLaunch;
    HWND btnRefresh;
    
    HWND comboVersions;
    HWND comboAccounts;
    HWND editMemory;
    
    HWND pageHome;
    HWND pageVersions;
    HWND pageAccounts;
    HWND pageSettings;
    HWND hwndTabs;
    HWND lvVersions;
    HWND lvAccounts;
    
    int currentPage;
    int currentTheme;
    
    GameVersion versions[100];
    int verCount;
    
    Account accounts[20];
    int accCount;
    
    BOOL isDarkTheme;
    Theme themes[THEME_COUNT];
    
    HBRUSH hbrBackground;
    HBRUSH hbrSidebar;
    HFONT hFontTitle;
    HFONT hFontText;
    HFONT hFontButton;
} LauncherUI;

static LauncherUI g_ui = {0};
static NOTIFYICONDATA g_nid = {0};

Theme g_themeBlue = {
    RGB(30, 30, 40), RGB(25, 25, 35), RGB(52, 152, 219),
    RGB(240, 240, 240), RGB(41, 128, 185), RGB(52, 152, 219),
    RGB(40, 40, 50), RGB(60, 60, 70), RGB(46, 204, 113), RGB(241, 196, 15), RGB(231, 76, 60)
};

Theme g_themeGreen = {
    RGB(30, 40, 30), RGB(25, 35, 25), RGB(39, 174, 96),
    RGB(240, 240, 240), RGB(33, 150, 83), RGB(39, 174, 96),
    RGB(40, 50, 40), RGB(60, 70, 60), RGB(46, 204, 113), RGB(241, 196, 15), RGB(231, 76, 60)
};

Theme g_themePurple = {
    RGB(35, 30, 40), RGB(30, 25, 35), RGB(155, 89, 182),
    RGB(240, 240, 240), RGB(136, 74, 163), RGB(155, 89, 182),
    RGB(45, 40, 50), RGB(65, 60, 70), RGB(46, 204, 113), RGB(241, 196, 15), RGB(231, 76, 60)
};

Theme g_themeOrange = {
    RGB(40, 35, 30), RGB(35, 30, 25), RGB(230, 126, 34),
    RGB(240, 240, 240), RGB(207, 113, 30), RGB(230, 126, 34),
    RGB(50, 45, 40), RGB(70, 65, 60), RGB(46, 204, 113), RGB(241, 196, 15), RGB(231, 76, 60)
};

Theme g_themeRed = {
    RGB(40, 30, 30), RGB(35, 25, 25), RGB(231, 76, 60),
    RGB(240, 240, 240), RGB(208, 68, 54), RGB(231, 76, 60),
    RGB(50, 40, 40), RGB(70, 60, 60), RGB(46, 204, 113), RGB(241, 196, 15), RGB(230, 126, 34)
};

static void ShowError(LPCWSTR msg) {
    MessageBoxW(NULL, msg, APP_NAME, MB_OK | MB_ICONERROR);
}

static void ShowInfo(LPCWSTR msg) {
    MessageBoxW(NULL, msg, APP_NAME, MB_OK | MB_ICONINFORMATION);
}

static BOOL FileExists(LPCWSTR path) {
    return GetFileAttributesW(path) != INVALID_FILE_ATTRIBUTES;
}

static BOOL DirectoryExists(LPCWSTR path) {
    DWORD attr = GetFileAttributesW(path);
    return (attr != INVALID_FILE_ATTRIBUTES) && (attr & FILE_ATTRIBUTE_DIRECTORY);
}

static BOOL EnsureDirectory(LPCWSTR path) {
    if (!DirectoryExists(path)) {
        return CreateDirectoryW(path, NULL);
    }
    return TRUE;
}

static HFONT CreateAppFont(int height, BOOL bold) {
    return CreateFontW(
        height, 0, 0, 0,
        bold ? FW_BOLD : FW_NORMAL,
        FALSE, FALSE, FALSE,
        DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS,
        CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY,
        DEFAULT_PITCH | FF_SWISS,
        L"Segoe UI"
    );
}

static void ApplyTheme(ThemeID themeId) {
    g_ui.currentTheme = themeId;
    Theme* theme = &g_ui.themes[themeId];
    
    if (g_ui.hbrBackground) DeleteObject(g_ui.hbrBackground);
    if (g_ui.hbrSidebar) DeleteObject(g_ui.hbrSidebar);
    
    g_ui.hbrBackground = CreateSolidBrush(theme->bgColor);
    g_ui.hbrSidebar = CreateSolidBrush(theme->sidebarColor);
    
    InvalidateRect(g_ui.hwnd, NULL, TRUE);
    UpdateWindow(g_ui.hwnd);
}

static void LoadConfig() {
    WCHAR configPath[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", configPath, MAX_PATH);
    PathCombineW(configPath, configPath, L"SCL");
    PathCombineW(configPath, configPath, L"config.ini");
    
    g_ui.isDarkTheme = GetPrivateProfileIntW(L"Settings", L"DarkTheme", 1, configPath);
    g_ui.currentTheme = GetPrivateProfileIntW(L"Settings", L"Theme", 0, configPath);
    
    if (g_ui.currentTheme >= THEME_COUNT) g_ui.currentTheme = 0;
}

static void SaveConfig() {
    WCHAR configPath[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", configPath, MAX_PATH);
    PathCombineW(configPath, configPath, L"SCL");
    EnsureDirectory(configPath);
    PathCombineW(configPath, configPath, L"config.ini");
    
    WCHAR buf[16];
    wsprintfW(buf, L"%d", g_ui.isDarkTheme);
    WritePrivateProfileStringW(L"Settings", L"DarkTheme", buf, configPath);
    
    wsprintfW(buf, L"%d", g_ui.currentTheme);
    WritePrivateProfileStringW(L"Settings", L"Theme", buf, configPath);
}

static void SwitchPage(int page) {
    g_ui.currentPage = page;
    
    ShowWindow(g_ui.pageHome, (page == 0) ? SW_SHOW : SW_HIDE);
    ShowWindow(g_ui.pageVersions, (page == 1) ? SW_SHOW : SW_HIDE);
    ShowWindow(g_ui.pageAccounts, (page == 2) ? SW_SHOW : SW_HIDE);
    ShowWindow(g_ui.pageSettings, (page == 3) ? SW_SHOW : SW_HIDE);
    // 新增：MC下载页面
    HWND pageDownload = g_ui.hwndTabs + 4;
    ShowWindow(pageDownload, (page == 4) ? SW_SHOW : SW_HIDE);
    
    InvalidateRect(g_ui.hwnd, NULL, TRUE);
}

static void RefreshVersions() {
    SendMessageW(g_ui.comboVersions, CB_RESETCONTENT, 0, 0);
    
    g_ui.verCount = 0;
    
    WCHAR mcPath[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", mcPath, MAX_PATH);
    PathCombineW(mcPath, mcPath, L".minecraft");
    PathCombineW(mcPath, mcPath, L"versions");
    
    if (DirectoryExists(mcPath)) {
        WIN32_FIND_DATAW fd;
        WCHAR searchPath[MAX_PATH];
        PathCombineW(searchPath, mcPath, L"*");
        
        HANDLE hFind = FindFirstFileW(searchPath, &fd);
        if (hFind != INVALID_HANDLE_VALUE) {
            do {
                if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY && wcscmp(fd.cFileName, L".") != 0 && wcscmp(fd.cFileName, L"..") != 0) {
                    if (g_ui.verCount < 100) {
                        wcscpy_s(g_ui.versions[g_ui.verCount].id, 64, fd.cFileName);
                        wcscpy_s(g_ui.versions[g_ui.verCount].name, 128, fd.cFileName);
                        wcscpy_s(g_ui.versions[g_ui.verCount].type, 32, L"local");
                        g_ui.versions[g_ui.verCount].isInstalled = TRUE;
                        g_ui.verCount++;
                        
                        SendMessageW(g_ui.comboVersions, CB_ADDSTRING, 0, (LPARAM)fd.cFileName);
                    }
                }
            } while (FindNextFileW(hFind, &fd));
            FindClose(hFind);
        }
    }
    
    if (g_ui.verCount > 0) {
        SendMessageW(g_ui.comboVersions, CB_SETCURSEL, 0, 0);
    }
}

static void RefreshAccounts() {
    SendMessageW(g_ui.comboAccounts, CB_RESETCONTENT, 0, 0);
    
    g_ui.accCount = 0;
    
    WCHAR configPath[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", configPath, MAX_PATH);
    PathCombineW(configPath, configPath, L"SCL");
    PathCombineW(configPath, configPath, L"accounts.ini");
    
    if (FileExists(configPath)) {
        WCHAR accountName[64];
        for (int i = 0; i < 20; i++) {
            WCHAR key[32];
            wsprintfW(key, L"Account%d", i);
            GetPrivateProfileStringW(L"Accounts", key, L"", accountName, 64, configPath);
            
            if (wcslen(accountName) > 0) {
                wcscpy_s(g_ui.accounts[g_ui.accCount].name, 64, accountName);
                g_ui.accCount++;
                SendMessageW(g_ui.comboAccounts, CB_ADDSTRING, 0, (LPARAM)accountName);
            }
        }
    }
    
    if (g_ui.accCount == 0) {
        wcscpy_s(g_ui.accounts[0].name, 64, L"Offline Player");
        g_ui.accCount = 1;
        SendMessageW(g_ui.comboAccounts, CB_ADDSTRING, 0, (LPARAM)L"Offline Player");
    }
    
    SendMessageW(g_ui.comboAccounts, CB_SETCURSEL, 0, 0);
}

static void LaunchGame() {
    int verIdx = (int)SendMessageW(g_ui.comboVersions, CB_GETCURSEL, 0, 0);
    int accIdx = (int)SendMessageW(g_ui.comboAccounts, CB_GETCURSEL, 0, 0);
    
    if (verIdx == CB_ERR) {
        ShowError(L"Please select a game version first.");
        return;
    }
    
    if (accIdx == CB_ERR) {
        ShowError(L"Please select an account first.");
        return;
    }
    
    WCHAR javaPath[MAX_PATH];
    WCHAR memory[16];
    WCHAR gameDir[MAX_PATH];
    
    GetEnvironmentVariableW(L"APPDATA", gameDir, MAX_PATH);
    PathCombineW(gameDir, gameDir, L".minecraft");
    
    WCHAR configPath[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", configPath, MAX_PATH);
    PathCombineW(configPath, configPath, L"SCL");
    PathCombineW(configPath, configPath, L"launcher.ini");
    
    GetPrivateProfileStringW(L"Java", L"Path", L"java", javaPath, MAX_PATH, configPath);
    GetPrivateProfileStringW(L"Game", L"Memory", L"2G", memory, 16, configPath);
    GetPrivateProfileStringW(L"Game", L"Directory", gameDir, gameDir, MAX_PATH, configPath);
    
    WCHAR version[64];
    SendMessageW(g_ui.comboVersions, CB_GETLBTEXT, verIdx, (LPARAM)version);
    
    SetWindowTextW(g_ui.hwndStatus, L"Launching game...");
    
    SHELLEXECUTEINFOW sei = {0};
    sei.cbSize = sizeof(sei);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.hwnd = g_ui.hwnd;
    sei.lpVerb = L"open";
    sei.lpFile = javaPath;
    
    WCHAR args[4096];
    wsprintfW(args, L"-Xms%s -Xmx%s -Dfile.encoding=UTF-8 -Djava.library.path=\"%%APPDATA%%\\.minecraft\\versions\\%s\\%s-natives\" -cp \"%%APPDATA%%\\.minecraft\\libraries\\*;%%APPDATA%%\\.minecraft\\versions\\%s\\%s.jar\" net.minecraft.client.main.Main --version %s --gameDir \"%s\" --assetsDir \"%%APPDATA%%\\.minecraft\\assets\"",
        memory, memory, version, version, version, version, version, gameDir);
    
    sei.lpParameters = args;
    sei.lpDirectory = NULL;
    sei.nShow = SW_SHOWNORMAL;
    
    if (ShellExecuteExW(&sei)) {
        CloseHandle(sei.hProcess);
        SetWindowTextW(g_ui.hwndStatus, L"Game launched!");
    } else {
        SetWindowTextW(g_ui.hwndStatus, L"Launch failed!");
        ShowError(L"Could not launch game, check Java path!");
    }
}

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            g_ui.hwnd = hwnd;
            g_ui.currentPage = 0;
            g_ui.isDarkTheme = TRUE;
            
            g_ui.themes[0] = g_themeBlue;
            g_ui.themes[1] = g_themeGreen;
            g_ui.themes[2] = g_themePurple;
            g_ui.themes[3] = g_themeOrange;
            g_ui.themes[4] = g_themeRed;
            
            LoadConfig();
            ApplyTheme((ThemeID)g_ui.currentTheme);
            
            INITCOMMONCONTROLSEX icex = {0};
            icex.dwSize = sizeof(icex);
            icex.dwICC = ICC_STANDARD_CLASSES | ICC_TAB_CLASSES | ICC_LISTVIEW_CLASSES;
            InitCommonControlsEx(&icex);
            
            g_ui.hFontTitle = CreateAppFont(24, TRUE);
            g_ui.hFontText = CreateAppFont(16, FALSE);
            g_ui.hFontButton = CreateAppFont(14, FALSE);
            
            int sidebarWidth = 220;
            int margin = 20;
            
            g_ui.hwndSidebar = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                0, 0, sidebarWidth, 600,
                hwnd, NULL, GetModuleHandle(NULL), NULL
            );
            
            g_ui.hwndMain = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                sidebarWidth, 0, 780, 600,
                hwnd, NULL, GetModuleHandle(NULL), NULL
            );
            
            int y = 40;
            g_ui.btnHome = CreateWindowExW(
                0, L"BUTTON", L"Home",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, y, sidebarWidth, 50,
                g_ui.hwndSidebar, (HMENU)101, GetModuleHandle(NULL), NULL
            );
            y += 55;
            
            g_ui.btnVersions = CreateWindowExW(
                0, L"BUTTON", L"Versions",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, y, sidebarWidth, 50,
                g_ui.hwndSidebar, (HMENU)102, GetModuleHandle(NULL), NULL
            );
            y += 55;
            
            g_ui.btnAccounts = CreateWindowExW(
                0, L"BUTTON", L"Accounts",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, y, sidebarWidth, 50,
                g_ui.hwndSidebar, (HMENU)103, GetModuleHandle(NULL), NULL
            );
            y += 55;
            
            g_ui.btnSettings = CreateWindowExW(
                0, L"BUTTON", L"Settings",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, y, sidebarWidth, 50,
                g_ui.hwndSidebar, (HMENU)104, GetModuleHandle(NULL), NULL
            );
            
            g_ui.btnTheme = CreateWindowExW(
                0, L"BUTTON", L"Theme",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                20, 520, 180, 40,
                g_ui.hwndSidebar, (HMENU)105, GetModuleHandle(NULL), NULL
            );
            
            int mainMargin = 20;
            int contentWidth = 740;

            g_ui.hwndTabs = CreateWindowExW(
                0, WC_TABCONTROLW, L"",
                WS_CHILD | WS_VISIBLE | TCS_TABS,
                mainMargin, mainMargin, contentWidth, 520,
                g_ui.hwndMain, (HMENU)301, GetModuleHandle(NULL), NULL
            );

            // create pages as children of the tab control (will be shown/hidden)
            g_ui.pageHome = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 520,
                g_ui.hwndTabs, NULL, GetModuleHandle(NULL), NULL
            );
            
            CreateWindowExW(
                0, L"STATIC", L"SCL Launcher",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 40,
                g_ui.pageHome, NULL, GetModuleHandle(NULL), NULL
            );
            
            CreateWindowExW(
                0, L"STATIC", L"Version:",
                WS_CHILD | WS_VISIBLE,
                0, 60, 120, 30,
                g_ui.pageHome, NULL, GetModuleHandle(NULL), NULL
            );
            
            g_ui.comboVersions = CreateWindowExW(
                0, L"COMBOBOX", L"",
                WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST | WS_VSCROLL,
                0, 90, contentWidth, 300,
                g_ui.pageHome, NULL, GetModuleHandle(NULL), NULL
            );
            
            CreateWindowExW(
                0, L"STATIC", L"Account:",
                WS_CHILD | WS_VISIBLE,
                0, 140, 120, 30,
                g_ui.pageHome, NULL, GetModuleHandle(NULL), NULL
            );
            
            g_ui.comboAccounts = CreateWindowExW(
                0, L"COMBOBOX", L"",
                WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST | WS_VSCROLL,
                0, 170, contentWidth, 300,
                g_ui.pageHome, NULL, GetModuleHandle(NULL), NULL
            );
            
            g_ui.btnLaunch = CreateWindowExW(
                0, L"BUTTON", L"Launch Game",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, 260, contentWidth, 60,
                g_ui.pageHome, (HMENU)201, GetModuleHandle(NULL), NULL
            );
            
            g_ui.btnRefresh = CreateWindowExW(
                0, L"BUTTON", L"Refresh",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                0, 340, contentWidth, 40,
                g_ui.pageHome, (HMENU)202, GetModuleHandle(NULL), NULL
            );
            
            g_ui.pageVersions = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 520,
                g_ui.hwndTabs, NULL, GetModuleHandle(NULL), NULL
            );
            ShowWindow(g_ui.pageVersions, SW_HIDE);

            // Versions list view
            g_ui.lvVersions = CreateWindowExW(
                0, WC_LISTVIEWW, L"",
                WS_CHILD | WS_VISIBLE | LVS_REPORT | LVS_SINGLESEL,
                10, 10, contentWidth - 20, 500,
                g_ui.pageVersions, (HMENU)401, GetModuleHandle(NULL), NULL
            );

            g_ui.pageAccounts = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 520,
                g_ui.hwndTabs, NULL, GetModuleHandle(NULL), NULL
            );
            ShowWindow(g_ui.pageAccounts, SW_HIDE);

            // Accounts list view
            g_ui.lvAccounts = CreateWindowExW(
                0, WC_LISTVIEWW, L"",
                WS_CHILD | WS_VISIBLE | LVS_REPORT | LVS_SINGLESEL,
                10, 10, contentWidth - 20, 500,
                g_ui.pageAccounts, (HMENU)402, GetModuleHandle(NULL), NULL
            );

            g_ui.pageSettings = CreateWindowExW(
                0, L"STATIC", L"Settings - Under development",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 520,
                g_ui.hwndTabs, NULL, GetModuleHandle(NULL), NULL
            );
            ShowWindow(g_ui.pageSettings, SW_HIDE);

            // 新增：MC下载页面
            HWND pageDownload = CreateWindowExW(
                0, L"STATIC", L"",
                WS_CHILD | WS_VISIBLE,
                0, 0, contentWidth, 520,
                g_ui.hwndTabs, NULL, GetModuleHandle(NULL), NULL
            );
            ShowWindow(pageDownload, SW_HIDE);

            HWND btnDownload = CreateWindowExW(
                0, L"BUTTON", L"Download Minecraft",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                20, 20, 200, 40,
                pageDownload, (HMENU)501, GetModuleHandle(NULL), NULL
            );
            HWND lblDownload = CreateWindowExW(
                0, L"STATIC", L"Download official Minecraft client or server.",
                WS_CHILD | WS_VISIBLE,
                20, 70, 400, 30,
                pageDownload, NULL, GetModuleHandle(NULL), NULL
            );

            // 插入新Tab
            TCITEMW tie = {0};
            tie.mask = TCIF_TEXT;
            tie.pszText = L"Home";
            TabCtrl_InsertItem(g_ui.hwndTabs, 0, &tie);
            tie.pszText = L"Versions";
            TabCtrl_InsertItem(g_ui.hwndTabs, 1, &tie);
            tie.pszText = L"Accounts";
            TabCtrl_InsertItem(g_ui.hwndTabs, 2, &tie);
            tie.pszText = L"Settings";
            TabCtrl_InsertItem(g_ui.hwndTabs, 3, &tie);
            tie.pszText = L"Download";
            TabCtrl_InsertItem(g_ui.hwndTabs, 4, &tie);

            // configure listviews (columns)
            if (g_ui.lvVersions) {
                LVCOLUMNW col = {0};
                col.mask = LVCF_TEXT | LVCF_WIDTH;
                col.pszText = L"Version";
                col.cx = contentWidth - 40;
                ListView_InsertColumn(g_ui.lvVersions, 0, &col);
            }
            if (g_ui.lvAccounts) {
                LVCOLUMNW col = {0};
                col.mask = LVCF_TEXT | LVCF_WIDTH;
                col.pszText = L"Account";
                col.cx = contentWidth - 40;
                ListView_InsertColumn(g_ui.lvAccounts, 0, &col);
            }
            
            g_ui.hwndStatus = CreateWindowExW(
                0, L"STATIC", L"Ready",
                WS_CHILD | WS_VISIBLE,
                sidebarWidth, 560, 780, 40,
                hwnd, NULL, GetModuleHandle(NULL), NULL
            );
            
            RefreshVersions();
            RefreshAccounts();
            
            SendMessageW(g_ui.btnHome, BM_SETSTYLE, BS_PUSHBUTTON, TRUE);
            SetFocus(g_ui.btnHome);
        }
        break;
        
        case WM_COMMAND: {
            int id = LOWORD(wParam);
            int notify = HIWORD(wParam);
            
            switch (id) {
                case 101:
                    SwitchPage(0);
                    break;
                case 102:
                    SwitchPage(1);
                    break;
                case 103:
                    SwitchPage(2);
                    break;
                case 104:
                    SwitchPage(3);
                    break;
                case 105:
                    g_ui.currentTheme = (g_ui.currentTheme + 1) % THEME_COUNT;
                    ApplyTheme((ThemeID)g_ui.currentTheme);
                    SaveConfig();
                    break;
                case 201:
                    LaunchGame();
                    break;
                case 202:
                    RefreshVersions();
                    ShowInfo(L"Version list refreshed!");
                    break;
                // 新增：下载按钮响应
                case 501:
                    ShellExecuteW(g_ui.hwnd, L"open", L"https://www.minecraft.net/en-us/download", NULL, NULL, SW_SHOWNORMAL);
                    break;
            }
        }
        break;
        
        case WM_CTLCOLORSTATIC: {
            HDC hdc = (HDC)wParam;
            HWND hwndCtl = (HWND)lParam;
            
            Theme* theme = &g_ui.themes[g_ui.currentTheme];
            
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, theme->textColor);
            
            if (hwndCtl == g_ui.hwndSidebar) {
                return (LRESULT)g_ui.hbrSidebar;
            } else if (hwndCtl == g_ui.hwndMain) {
                return (LRESULT)g_ui.hbrBackground;
            } else if (hwndCtl == g_ui.pageHome || hwndCtl == g_ui.pageVersions || 
                       hwndCtl == g_ui.pageAccounts || hwndCtl == g_ui.pageSettings) {
                return (LRESULT)g_ui.hbrBackground;
            } else {
                SetBkColor(hdc, theme->cardColor);
                return (LRESULT)CreateSolidBrush(theme->cardColor);
            }
        }
        
        case WM_CTLCOLORBTN: {
            HDC hdc = (HDC)wParam;
            Theme* theme = &g_ui.themes[g_ui.currentTheme];
            
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, theme->textColor);
            
            return (LRESULT)CreateSolidBrush(theme->buttonColor);
        }
        
        case WM_DESTROY: {
            SaveConfig();
            
            if (g_ui.hFontTitle) DeleteObject(g_ui.hFontTitle);
            if (g_ui.hFontText) DeleteObject(g_ui.hFontText);
            if (g_ui.hFontButton) DeleteObject(g_ui.hFontButton);
            if (g_ui.hbrBackground) DeleteObject(g_ui.hbrBackground);
            if (g_ui.hbrSidebar) DeleteObject(g_ui.hbrSidebar);
            
            Shell_NotifyIconW(NIM_DELETE, &g_nid);
            PostQuitMessage(0);
        }
        break;
        
        default:
            return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
    return 0;
}

static void RegisterMainClass() {
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.cbClsExtra = 0;
    wc.cbWndExtra = 0;
    wc.hInstance = GetModuleHandle(NULL);
    wc.hIcon = LoadIconW(NULL, IDI_APPLICATION);
    wc.hCursor = LoadCursorW(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszMenuName = NULL;
    wc.lpszClassName = L"SCLMainWindow";
    wc.hIconSm = LoadIconW(NULL, IDI_APPLICATION);
    
    RegisterClassExW(&wc);
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPWSTR lpCmdLine, int nCmdShow) {
    CoInitialize(NULL);
    
    RegisterMainClass();
    
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);
    int windowWidth = 1000;
    int windowHeight = 600;
    int x = (screenWidth - windowWidth) / 2;
    int y = (screenHeight - windowHeight) / 2;
    
    HWND hwnd = CreateWindowExW(
        WS_EX_APPWINDOW | WS_EX_WINDOWEDGE,
        L"SCLMainWindow",
        APP_NAME,
        WS_OVERLAPPEDWINDOW | WS_CLIPSIBLINGS | WS_CLIPCHILDREN,
        x, y, windowWidth, windowHeight,
        NULL, NULL, hInstance, NULL
    );
    
    if (!hwnd) {
        ShowError(L"Cannot create main window!");
        return 1;
    }
    
    g_nid.cbSize = sizeof(g_nid);
    g_nid.hWnd = hwnd;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_TRAYICON;
    g_nid.hIcon = LoadIconW(NULL, IDI_APPLICATION);
    wcscpy_s(g_nid.szTip, 128, APP_NAME);
    
    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);
    SetForegroundWindow(hwnd);
    
    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    
    CoUninitialize();
    return (int)msg.wParam;
}

