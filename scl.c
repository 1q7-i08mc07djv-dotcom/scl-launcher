/**
 * SCL - SUPER CRAFT LAUNCHER
 * A lightweight Minecraft launcher written in pure C (Win32 API)
 */

#define WIN32_LEAN_AND_MEAN
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

#pragma comment(lib, "user32.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "shell32.lib")

/* ---- Constants ---- */
#define MAX_ACCOUNTS 16
#define MAX_VERSIONS 64
#define BUF_SIZE 4096
#define IDT_TIMER_DOWNLOAD 1001

#define IDC_ACCOUNT_LIST    101
#define IDC_VERSION_LIST    102
#define IDC_BTN_ADD_ACC     103
#define IDC_BTN_REFRESH     104
#define IDC_BTN_DOWNLOAD    105
#define IDC_BTN_PLAY        106
#define IDC_STATUS          107
#define IDC_EDIT_USER       108
#define IDC_PROGRESS        109
#define IDC_COMBO_AUTH      110
#define IDC_EDIT_URL        111
#define IDC_BTN_JAVA        112
#define IDC_BTN_SETTINGS    113

/* ---- Globals ---- */
static HINSTANCE g_hInst = NULL;
static HWND g_hAccList = NULL;
static HWND g_hVerList = NULL;
static HWND g_hStatus = NULL;
static HWND g_hProgress = NULL;
static HWND g_hEditUser = NULL;
static HWND g_hComboAuth = NULL;
static HWND g_hEditUrl = NULL;

typedef struct {
    WCHAR username[64];
    int authType; /* 0=offline, 1=msa, 2=third */
    WCHAR url[256];
} Account;

typedef struct {
    WCHAR id[64];
    WCHAR type[64];
} GameVersion;

static Account g_accounts[MAX_ACCOUNTS];
static int g_accCount = 0;
static GameVersion g_versions[MAX_VERSIONS];
static int g_verCount = 0;
static WCHAR g_mcDir[MAX_PATH] = L"";
static WCHAR g_javaPath[MAX_PATH] = L"";
static BOOL g_downloading = FALSE;
static HINTERNET g_hNet = NULL;

/* Mirror list */
static const WCHAR* g_mirrors[] = {
    L"https://bmclapi2.bangbang93.com",
    L"https://mirror.koicraft.cn",
    L"https://download.mcbbs.net"
};
static int g_mirrorIdx = 0;

/* ---- Config Path ---- */
static void GetConfigPath(WCHAR* path, int maxLen) {
    WCHAR appdata[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", appdata, MAX_PATH);
    swprintf_s(path, maxLen, L"%s\\SCL", appdata);
}

static void GetAccountsPath(WCHAR* path, int maxLen) {
    WCHAR cfg[MAX_PATH];
    GetConfigPath(cfg, MAX_PATH);
    swprintf_s(path, maxLen, L"%s\\accounts.ini", cfg);
}

static void GetMcDir() {
    WCHAR home[MAX_PATH];
    GetEnvironmentVariableW(L"USERPROFILE", home, MAX_PATH);
    swprintf_s(g_mcDir, MAX_PATH, L"%s\\.minecraft", home);
}

/* ---- Download helper (WinInet, synchronous) ---- */
static BOOL HttpGet(const WCHAR* url, WCHAR* outBuf, int outLen) {
    HINTERNET hConn, hReq;
    DWORD bytesRead, total = 0;
    char buf[BUF_SIZE];
    BOOL ok = FALSE;

    WCHAR host[256], path[2048];
    URL_COMPONENTSW uc = {0};
    uc.dwStructSize = sizeof(uc);
    uc.lpszHostName = host;
    uc.dwHostNameLength = 256;
    uc.lpszUrlPath = path;
    uc.dwUrlPathLength = 2048;

    if (!InternetCrackUrlW(url, 0, 0, &uc)) return FALSE;

    hConn = InternetConnectW(g_hNet, host, uc.nPort,
        NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConn) return FALSE;

    hReq = HttpOpenRequestW(hConn, L"GET", path, NULL,
        NULL, NULL, INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hReq) { InternetCloseHandle(hConn); return FALSE; }

    if (HttpSendRequestW(hReq, NULL, 0, NULL, 0)) {
        outBuf[0] = L'\0';
        while (InternetReadFile(hReq, buf, BUF_SIZE - 1, &bytesRead) && bytesRead > 0) {
            buf[bytesRead] = '\0';
            /* Convert ASCII to wide */
            MultiByteToWideChar(CP_UTF8, 0, buf, bytesRead, outBuf + total, outLen - total - 1);
            total += bytesRead;
            if (total >= (DWORD)(outLen - 2)) break;
        }
        outBuf[total] = L'\0';
        ok = TRUE;
    }

    InternetCloseHandle(hReq);
    InternetCloseHandle(hConn);
    return ok;
}

static BOOL HttpDownloadFile(const WCHAR* url, const WCHAR* localPath) {
    HINTERNET hConn, hReq;
    HANDLE hFile;
    char buf[BUF_SIZE];
    DWORD bytesRead, totalWritten = 0;
    BOOL ok = FALSE;

    WCHAR host[256], path[2048];
    URL_COMPONENTSW uc = {0};
    uc.dwStructSize = sizeof(uc);
    uc.lpszHostName = host;
    uc.dwHostNameLength = 256;
    uc.lpszUrlPath = path;
    uc.dwUrlPathLength = 2048;

    if (!InternetCrackUrlW(url, 0, 0, &uc)) return FALSE;

    hConn = InternetConnectW(g_hNet, host, uc.nPort,
        NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConn) return FALSE;

    hReq = HttpOpenRequestW(hConn, L"GET", path, NULL,
        NULL, NULL, INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hReq) { InternetCloseHandle(hConn); return FALSE; }

    if (HttpSendRequestW(hReq, NULL, 0, NULL, 0)) {
        hFile = CreateFileW(localPath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, 0, NULL);
        if (hFile != INVALID_HANDLE_VALUE) {
            while (InternetReadFile(hReq, buf, BUF_SIZE, &bytesRead) && bytesRead > 0) {
                DWORD written;
                WriteFile(hFile, buf, bytesRead, &written, NULL);
                totalWritten += written;
            }
            CloseHandle(hFile);
            ok = TRUE;
        }
    }

    InternetCloseHandle(hReq);
    InternetCloseHandle(hConn);
    return ok;
}

/* ---- Account persistence ---- */
static void SaveAccounts() {
    WCHAR path[MAX_PATH];
    GetAccountsPath(path, MAX_PATH);

    /* Ensure directory exists */
    WCHAR dir[MAX_PATH];
    GetConfigPath(dir, MAX_PATH);
    CreateDirectoryW(dir, NULL);

    FILE* f = _wfopen(path, L"w");
    if (!f) return;

    for (int i = 0; i < g_accCount; i++) {
        fwprintf(f, L"[acc%d]\n", i);
        fwprintf(f, L"user=%s\n", g_accounts[i].username);
        fwprintf(f, L"type=%d\n", g_accounts[i].authType);
        fwprintf(f, L"url=%s\n", g_accounts[i].url);
        fwprintf(f, L"\n");
    }
    fclose(f);
}

static void LoadAccounts() {
    WCHAR path[MAX_PATH];
    GetAccountsPath(path, MAX_PATH);
    g_accCount = 0;

    FILE* f = _wfopen(path, L"r");
    if (!f) return;

    WCHAR line[512];
    int cur = -1;
    while (fgetws(line, (int)512, f)) {
        /* Remove newline */
        int len = wcslen(line);
        while (len > 0 && (line[len-1] == L'\n' || line[len-1] == L'\r')) line[--len] = L'\0';

        if (wcsstr(line, L"[acc") == line) {
            cur++;
            if (cur >= MAX_ACCOUNTS) break;
            memset(&g_accounts[cur], 0, sizeof(Account));
        } else if (cur >= 0) {
            WCHAR* eq = wcschr(line, L'=');
            if (eq) {
                *eq = L'\0';
                WCHAR* val = eq + 1;
                if (wcscmp(line, L"user") == 0) {
                    wcsncpy_s(g_accounts[cur].username, 64, val, _TRUNCATE);
                } else if (wcscmp(line, L"type") == 0) {
                    g_accounts[cur].authType = _wtoi(val);
                } else if (wcscmp(line, L"url") == 0) {
                    wcsncpy_s(g_accounts[cur].url, 256, val, _TRUNCATE);
                }
            }
        }
    }
    g_accCount = cur + 1;
    fclose(f);
}

/* ---- UI helpers ---- */
static void SetStatus(const WCHAR* msg) {
    SetWindowTextW(g_hStatus, msg);
}

static void RefreshAccountList() {
    SendMessageW(g_hAccList, LB_RESETCONTENT, 0, 0);
    for (int i = 0; i < g_accCount; i++) {
        const WCHAR* types[] = {L"[Offline] ", L"[Microsoft] ", L"[3rd Party] "};
        WCHAR item[128];
        swprintf_s(item, 128, L"%s%s", types[g_accounts[i].authType], g_accounts[i].username);
        SendMessageW(g_hAccList, LB_ADDSTRING, 0, (LPARAM)item);
    }
    if (g_accCount > 0) SendMessageW(g_hAccList, LB_SETCURSEL, 0, 0);
}

static void RefreshVersionList() {
    SendMessageW(g_hVerList, LB_RESETCONTENT, 0, 0);

    /* Load local versions from .minecraft/versions/ */
    WCHAR dir[MAX_PATH];
    swprintf_s(dir, MAX_PATH, L"%s\\versions", g_mcDir);
    g_verCount = 0;

    WIN32_FIND_DATAW fd;
    WCHAR search[MAX_PATH];
    swprintf_s(search, MAX_PATH, L"%s\\*", dir);
    HANDLE hFind = FindFirstFileW(search, &fd);

    if (hFind != INVALID_HANDLE_VALUE) {
        do {
            if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
                if (wcscmp(fd.cFileName, L".") == 0 || wcscmp(fd.cFileName, L"..") == 0) continue;
                wcsncpy_s(g_versions[g_verCount].id, 64, fd.cFileName, _TRUNCATE);
                wcsncpy_s(g_versions[g_verCount].type, 64, L"release", _TRUNCATE);
                g_verCount++;
                if (g_verCount >= MAX_VERSIONS) break;
            }
        } while (FindNextFileW(hFind, &fd));
        FindClose(hFind);
    }

    /* Also fetch remote version list */
    WCHAR url[512];
    swprintf_s(url, 512, L"%s/mc/game/version_manifest_v2.json", g_mirrors[g_mirrorIdx]);
    WCHAR response[65536];

    if (HttpGet(url, response, 65536)) {
        /* Simple JSON parse: find all "id":"xxx" strings */
        WCHAR* p = response;
        while ((p = wcsstr(p, L"\"id\"")) != NULL) {
            p += 4;
            while (*p && *p != L'"') p++;
            if (!*p) break;
            p++;
            WCHAR* start = p;
            while (*p && *p != L'"' && *p != L',' && *p != L'}') p++;
            WCHAR save = *p;
            *p = L'\0';

            /* Check if already in list */
            BOOL found = FALSE;
            for (int i = 0; i < g_verCount; i++) {
                if (_wcsicmp(g_versions[i].id, start) == 0) { found = TRUE; break; }
            }
            if (!found && wcslen(start) > 0 && wcslen(start) < 64) {
                wcsncpy_s(g_versions[g_verCount].id, 64, start, _TRUNCATE);
                wcsncpy_s(g_versions[g_verCount].type, 64, L"remote", _TRUNCATE);
                g_verCount++;
                if (g_verCount >= MAX_VERSIONS) break;
            }
            *p = save;
        }
    }

    /* Sort versions */
    for (int i = 0; i < g_verCount - 1; i++) {
        for (int j = i + 1; j < g_verCount; j++) {
            if (wcscmp(g_versions[i].id, g_versions[j].id) < 0) {
                GameVersion tmp = g_versions[i];
                g_versions[i] = g_versions[j];
                g_versions[j] = tmp;
            }
        }
    }

    for (int i = 0; i < g_verCount; i++) {
        SendMessageW(g_hVerList, LB_ADDSTRING, 0, (LPARAM)g_versions[i].id);
    }
    if (g_verCount > 0) SendMessageW(g_hVerList, LB_SETCURSEL, 0, 0);
}

static void DownloadVersion(const WCHAR* versionId) {
    if (g_downloading) return;
    g_downloading = TRUE;

    /* Create directories */
    WCHAR verDir[MAX_PATH], jsonPath[MAX_PATH];
    swprintf_s(verDir, MAX_PATH, L"%s\\versions\\%s", g_mcDir, versionId);
    swprintf_s(jsonPath, MAX_PATH, L"%s\\%s.json", verDir, versionId);
    CreateDirectoryW(g_mcDir, NULL);
    CreateDirectoryW(verDir, NULL);

    /* Download version JSON */
    WCHAR url[512];
    swprintf_s(url, 512, L"%s/mc/game/version/%s/json", g_mirrors[g_mirrorIdx], versionId);

    WCHAR msg[256];
    swprintf_s(msg, 256, L"Downloading: %s", versionId);
    SetStatus(msg);
    SendMessageW(g_hProgress, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
    SendMessageW(g_hProgress, PBM_SETPOS, 0, 0);

    if (HttpDownloadFile(url, jsonPath)) {
        swprintf_s(msg, 256, L"Downloaded: %s", versionId);
        SetStatus(msg);
        SendMessageW(g_hProgress, PBM_SETPOS, 100, 0);
    } else {
        swprintf_s(msg, 256, L"Failed to download: %s", versionId);
        SetStatus(msg);
    }

    g_downloading = FALSE;
    RefreshVersionList();
}

static void FindJava() {
    /* Check JAVA_HOME first */
    GetEnvironmentVariableW(L"JAVA_HOME", g_javaPath, MAX_PATH);
    if (wcslen(g_javaPath) > 0) {
        wcscat_s(g_javaPath, MAX_PATH, L"\\bin\\javaw.exe");
        if (GetFileAttributesW(g_javaPath) != INVALID_FILE_ATTRIBUTES) return;
    }

    /* Check PATH */
    WCHAR* pathEnv = _wgetenv(L"PATH");
    if (pathEnv) {
        WCHAR pathCopy[MAX_PATH * 4];
        wcsncpy_s(pathCopy, MAX_PATH * 4, pathEnv, _TRUNCATE);
        WCHAR* ctx = NULL;
        WCHAR* dir = wcstok_s(pathCopy, L";", &ctx);
        while (dir) {
            WCHAR javaw[MAX_PATH];
            swprintf_s(javaw, MAX_PATH, L"%s\\javaw.exe", dir);
            if (GetFileAttributesW(javaw) != INVALID_FILE_ATTRIBUTES) {
                wcsncpy_s(g_javaPath, MAX_PATH, javaw, _TRUNCATE);
                return;
            }
            dir = wcstok_s(NULL, L";", &ctx);
        }
    }

    /* Check common install locations */
    const WCHAR* javaPaths[] = {
        L"C:\\Program Files\\Java\\javaw.exe",
        L"C:\\Program Files\\Eclipse Adoptium\\javaw.exe",
        L"C:\\Program Files\\Microsoft\\javaw.exe",
        NULL
    };
    for (int i = 0; javaPaths[i]; i++) {
        /* Search subdirectories */
        WIN32_FIND_DATAW fd;
        WCHAR search[MAX_PATH];
        swprintf_s(search, MAX_PATH, L"%s\\*javaw.exe", javaPaths[i]);
        HANDLE hFind = FindFirstFileW(search, &fd);
        if (hFind != INVALID_HANDLE_VALUE) {
            swprintf_s(g_javaPath, MAX_PATH, L"%s\\%s", javaPaths[i], fd.cFileName);
            FindClose(hFind);
            return;
        }
    }

    g_javaPath[0] = L'\0';
}

static void LaunchGame(const WCHAR* versionId) {
    if (g_downloading) return;

    /* Check Java */
    FindJava();
    if (wcslen(g_javaPath) == 0) {
        SetStatus(L"Java not found! Please install JDK 17+ or use Auto-Java button.");
        return;
    }

    int sel = (int)SendMessageW(g_hAccList, LB_GETCURSEL, 0, 0);
    if (sel < 0 || sel >= g_accCount) {
        SetStatus(L"Please select an account first.");
        return;
    }

    SetStatus(L"Starting Minecraft...");

    /* Build launch command */
    WCHAR cmd[4096];
    WCHAR verDir[MAX_PATH];
    swprintf_s(verDir, MAX_PATH, L"%s\\versions\\%s", g_mcDir, versionId);

    /* Launch using Java */
    swprintf_s(cmd, 4096,
        L"\"%s\" -Xmx2G -Xms512M "
        L"-Djava.library.path=\"%s\\natives\" "
        L"-cp \"%s\\%s.jar\" "
        L"com.mojang.launcher.MainLauncher "
        L"--version %s --gameDir \"%s\" --assetsDir \"%s\\assets\" "
        L"--accessToken 0 --username \"%s\" --userType legacy",
        g_javaPath,
        verDir,
        verDir, versionId,
        versionId, g_mcDir, g_mcDir,
        g_accounts[sel].username
    );

    STARTUPINFOW si = {sizeof(si)};
    PROCESS_INFORMATION pi = {0};

    if (CreateProcessW(NULL, cmd, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        SetStatus(L"Game launched!");
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
    } else {
        SetStatus(L"Failed to launch game. Check Java path and version files.");
    }
}

static void AddAccount() {
    WCHAR user[64] = L"Steve";
    int len = GetWindowTextW(g_hEditUser, user, 64);
    if (len == 0) {
        SetStatus(L"Please enter a username.");
        return;
    }

    int authType = (int)SendMessageW(g_hComboAuth, CB_GETCURSEL, 0, 0);
    if (authType < 0) authType = 0;

    if (g_accCount >= MAX_ACCOUNTS) {
        SetStatus(L"Account limit reached.");
        return;
    }

    wcsncpy_s(g_accounts[g_accCount].username, 64, user, _TRUNCATE);
    g_accounts[g_accCount].authType = authType;
    GetWindowTextW(g_hEditUrl, g_accounts[g_accCount].url, 256);
    g_accCount++;

    SaveAccounts();
    RefreshAccountList();

    WCHAR msg[128];
    swprintf_s(msg, 128, L"Account added: %s", user);
    SetStatus(msg);
}

static void RemoveAccount() {
    int sel = (int)SendMessageW(g_hAccList, LB_GETCURSEL, 0, 0);
    if (sel < 0 || sel >= g_accCount) return;

    for (int i = sel; i < g_accCount - 1; i++) {
        g_accounts[i] = g_accounts[i + 1];
    }
    g_accCount--;

    SaveAccounts();
    RefreshAccountList();
    SetStatus(L"Account removed.");
}

/* ---- Dialog procedure ---- */
static INT_PTR CALLBACK MainDlgProc(HWND hDlg, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
    case WM_INITDIALOG:
        /* Store handles */
        g_hAccList = GetDlgItem(hDlg, IDC_ACCOUNT_LIST);
        g_hVerList = GetDlgItem(hDlg, IDC_VERSION_LIST);
        g_hStatus  = GetDlgItem(hDlg, IDC_STATUS);
        g_hProgress= GetDlgItem(hDlg, IDC_PROGRESS);
        g_hEditUser= GetDlgItem(hDlg, IDC_EDIT_USER);
        g_hComboAuth=GetDlgItem(hDlg, IDC_COMBO_AUTH);
        g_hEditUrl = GetDlgItem(hDlg, IDC_EDIT_URL);

        /* Initialize combo */
        SendMessageW(g_hComboAuth, CB_ADDSTRING, 0, (LPARAM)L"Offline");
        SendMessageW(g_hComboAuth, CB_ADDSTRING, 0, (LPARAM)L"Microsoft");
        SendMessageW(g_hComboAuth, CB_ADDSTRING, 0, (LPARAM)L"Third Party");
        SendMessageW(g_hComboAuth, CB_SETCURSEL, 0, 0);

        /* Set default username */
        SetWindowTextW(g_hEditUser, L"Steve");

        /* Load accounts and versions */
        LoadAccounts();
        RefreshAccountList();
        RefreshVersionList();
        FindJava();

        SetStatus(L"Ready.");

        /* Center window */
        RECT rcDlg, rcDesk;
        GetWindowRect(hDlg, &rcDlg);
        GetWindowRect(GetDesktopWindow(), &rcDesk);
        SetWindowPos(hDlg, NULL,
            (rcDesk.right - rcDlg.right + rcDlg.left) / 2,
            (rcDesk.bottom - rcDlg.bottom + rcDlg.top) / 2,
            0, 0, SWP_NOSIZE | SWP_NOZORDER);

        return TRUE;

    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case IDC_BTN_ADD_ACC:
            AddAccount();
            break;
        case IDC_BTN_REFRESH:
            g_mirrorIdx = (g_mirrorIdx + 1) % 3;
            SetStatus(L"Refreshing version list...");
            RefreshVersionList();
            SetStatus(L"Ready.");
            break;
        case IDC_BTN_DOWNLOAD: {
            int sel = (int)SendMessageW(g_hVerList, LB_GETCURSEL, 0, 0);
            if (sel >= 0 && sel < g_verCount) {
                DownloadVersion(g_versions[sel].id);
            } else {
                SetStatus(L"Select a version first.");
            }
            break;
        }
        case IDC_BTN_PLAY: {
            int sel = (int)SendMessageW(g_hVerList, LB_GETCURSEL, 0, 0);
            if (sel >= 0 && sel < g_verCount) {
                LaunchGame(g_versions[sel].id);
            } else {
                SetStatus(L"Select a version first.");
            }
            break;
        }
        case IDC_BTN_JAVA: {
            FindJava();
            if (wcslen(g_javaPath) > 0) {
                WCHAR msg[MAX_PATH + 64];
                swprintf_s(msg, MAX_PATH + 64, L"Java found: %s", g_javaPath);
                SetStatus(msg);
            } else {
                SetStatus(L"Java not found. Downloading JDK 21...");
                /* Download Adoptium JDK 21 */
                WCHAR jdkUrl[] = L"https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse";
                WCHAR jdkPath[MAX_PATH];
                GetTempPathW(MAX_PATH, jdkPath);
                wcscat_s(jdkPath, MAX_PATH, L"jdk21.zip");
                if (HttpDownloadFile(jdkUrl, jdkPath)) {
                    SetStatus(L"JDK downloaded! Please extract and set JAVA_HOME.");
                    ShellExecuteW(NULL, L"open", jdkPath, NULL, NULL, SW_SHOWNORMAL);
                } else {
                    SetStatus(L"Failed to download JDK. Please install manually.");
                }
            }
            break;
        }
        case IDOK:
        case IDCANCEL:
            EndDialog(hDlg, 0);
            break;
        }
        return TRUE;
    }
    return FALSE;
}

/* ---- Entry point ---- */
int WINAPI wWinMain(HINSTANCE hInst, HINSTANCE hPrev, LPWSTR cmdLine, int nShow) {
    g_hInst = hInst;
    GetMcDir();

    /* Initialize WinInet */
    g_hNet = InternetOpenW(L"SCL/1.0",
        INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);

    /* Create main dialog */
    DialogBoxW(hInst, MAKEINTRESOURCEW(1), NULL, MainDlgProc);

    if (g_hNet) InternetCloseHandle(g_hNet);
    return 0;
}
