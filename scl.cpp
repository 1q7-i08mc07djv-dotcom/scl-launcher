/*
 * SCL - SUPER CRAFT LAUNCHER
 * Minecraft启动器 - C++ Win32原生版本
 * 
 * 编译: cl /EHsc /O2 /Fe:SCL.exe scl.cpp winhttp.lib comctl32.lib shlwapi.lib
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <commctrl.h>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <cstdio>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "shlwapi.lib")

using namespace std;

// ==================== 配置 ====================
#define APP_TITLE L"SCL - SUPER CRAFT LAUNCHER"
#define WINDOW_W 900
#define WINDOW_H 620

// 控件ID
#define ID_LIST_VERSIONS 1001
#define ID_LIST_ACCOUNTS 1002
#define ID_BTN_LOGIN 2001
#define ID_BTN_REFRESH 2002
#define ID_BTN_DOWNLOAD 2003
#define ID_BTN_PLAY 2004
#define ID_BTN_SETTINGS 2005
#define ID_EDIT_NAME 3001
#define ID_STATUS 4001
#define ID_PROGRESS 4002

// 镜像源
const wchar_t* MIRRORS[] = {
    L"https://bmclapi2.bangbang93.com",
    L"https://download.mcbbs.net",
    L"https://mirrors.aliyun.com/minecraft"
};
int g_mirrorIdx = 0;

// 配色
#define CLR_BG RGB(26, 26, 46)
#define CLR_CARD RGB(22, 33, 62)
#define CLR_ACCENT RGB(30, 136, 229)
#define CLR_RED RGB(233, 69, 96)
#define CLR_TEXT RGB(255, 255, 255)
#define CLR_TEXT_DIM RGB(176, 176, 176)
#define CLR_GREEN RGB(76, 175, 80)

// 全局变量
HWND g_hMain, g_hStatus, g_hProgress, g_hVersionList, g_hAccountList;
wstring g_gameDir, g_configDir;
vector<wstring> g_versions;
vector<wstring> g_accounts;

// ==================== 工具函数 ====================
wstring GetAppData() {
    wchar_t p[MAX_PATH];
    SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, p);
    return wstring(p) + L"\\SCL";
}

wstring GetMinecraftDir() {
    wchar_t p[MAX_PATH];
    SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, p);
    return wstring(p) + L"\\.minecraft";
}

bool DirExists(const wstring& d) {
    DWORD attr = GetFileAttributesW(d.c_str());
    return (attr != INVALID_FILE_ATTRIBUTES && (attr & FILE_ATTRIBUTE_DIRECTORY));
}

void CreateDir(const wstring& d) {
    if (!DirExists(d)) {
        CreateDirectoryW(d.c_str(), NULL);
    }
}

void SetStatus(const wchar_t* msg) {
    if (g_hStatus) SetWindowTextW(g_hStatus, msg);
}

string WideToUtf8(const wstring& w) {
    if (w.empty()) return "";
    int len = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), -1, NULL, 0, NULL, NULL);
    string r(len - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, w.c_str(), -1, &r[0], len, NULL, NULL);
    return r;
}

wstring Utf8ToWide(const string& s) {
    if (s.empty()) return L"";
    int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, NULL, 0);
    wstring r(len - 1, 0);
    MultiByteToWideChar(CP_UTF8, 0, s.c_str(), -1, &r[0], len);
    return r;
}

wstring GenUUID(const wstring& name) {
    string input = "OfflinePlayer:" + WideToUtf8(name);
    unsigned h[4] = {0};
    for (size_t i = 0; i < input.size(); i++) {
        h[i % 4] = h[i % 4] * 31 + (unsigned)input[i];
    }
    wchar_t uuid[64];
    swprintf_s(uuid, L"%08x%04x%04x%04x%04x%08x%04x",
        h[0] & 0xffffffff, (h[1] >> 16) & 0xffff, (h[1] & 0xffff) | 0x4000,
        ((h[2] >> 16) & 0x3fff) | 0x8000, h[2] & 0xffff,
        h[3] & 0xffff, (h[0] >> 16) & 0xffff);
    return wstring(uuid);
}

// ==================== 网络请求 ====================
bool HttpDownload(const wstring& url, const wstring& path) {
    URL_COMPONENTS uc = {sizeof(uc)};
    wchar_t host[256] = {0}, pathb[2048] = {0};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), url.length(), 0, &uc)) return false;
    
    HINTERNET ses = WinHttpOpen(L"SCL/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!ses) return false;
    
    HINTERNET conn = WinHttpConnect(ses, host, uc.nPort, 0);
    if (!conn) { WinHttpCloseHandle(ses); return false; }
    
    DWORD flags = (uc.nScheme == INTERNET_SCHEME_HTTPS) ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET req = WinHttpOpenRequest(conn, L"GET", pathb, NULL, NULL, NULL, flags);
    if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return false; }
    
    WinHttpSendRequest(req, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(req, NULL);
    
    size_t ps = path.rfind(L'\\');
    if (ps != wstring::npos) CreateDir(path.substr(0, ps));
    
    ofstream f(WideToUtf8(path), ios::binary);
    if (!f.is_open()) {
        WinHttpCloseHandle(req);
        WinHttpCloseHandle(conn);
        WinHttpCloseHandle(ses);
        return false;
    }
    
    vector<char> buf(65536);
    DWORD br;
    while (WinHttpReadData(req, buf.data(), buf.size(), &br) && br > 0) {
        f.write(buf.data(), br);
    }
    f.close();
    
    WinHttpCloseHandle(req);
    WinHttpCloseHandle(conn);
    WinHttpCloseHandle(ses);
    return true;
}

string HttpGet(const wstring& url) {
    URL_COMPONENTS uc = {sizeof(uc)};
    wchar_t host[256] = {0}, pathb[2048] = {0};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), url.length(), 0, &uc)) return "";
    
    HINTERNET ses = WinHttpOpen(L"SCL/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!ses) return "";
    
    HINTERNET conn = WinHttpConnect(ses, host, uc.nPort, 0);
    if (!conn) { WinHttpCloseHandle(ses); return ""; }
    
    HINTERNET req = WinHttpOpenRequest(conn, L"GET", pathb, NULL, NULL, NULL, 0);
    if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return ""; }
    
    WinHttpSendRequest(req, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(req, NULL);
    
    vector<char> buf(65536);
    DWORD br;
    string res;
    while (WinHttpReadData(req, buf.data(), buf.size(), &br) && br > 0) {
        res.append(buf.data(), br);
    }
    
    WinHttpCloseHandle(req);
    WinHttpCloseHandle(conn);
    WinHttpCloseHandle(ses);
    return res;
}

// ==================== 版本管理 ====================
void LoadVersions() {
    g_versions.clear();
    SendMessageW(g_hVersionList, LB_RESETCONTENT, 0, 0);
    SetStatus(L"正在获取版本列表...");
    
    wstring url = wstring(MIRRORS[g_mirrorIdx]) + L"/mc/game/version_manifest_v2.json";
    string json = HttpGet(url);
    
    if (json.empty()) {
        for (int i = 0; i < 3; i++) {
            g_mirrorIdx = (g_mirrorIdx + 1) % 3;
            url = wstring(MIRRORS[g_mirrorIdx]) + L"/mc/game/version_manifest_v2.json";
            json = HttpGet(url);
            if (!json.empty()) break;
        }
    }
    
    if (json.empty()) {
        SetStatus(L"获取版本列表失败!");
        return;
    }
    
    size_t p = 0;
    while ((p = json.find("\"id\":\"", p)) != string::npos) {
        p += 6;
        size_t e = json.find('"', p);
        if (e == string::npos) break;
        wstring id = Utf8ToWide(json.substr(p, e - p));
        g_versions.push_back(id);
        
        wstring display = id + (DirExists(g_gameDir + L"\\versions\\" + id) ? L" [已安装]" : L"");
        SendMessageW(g_hVersionList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
    }
    
    wchar_t msg[256];
    swprintf_s(msg, L"已加载 %d 个版本", g_versions.size());
    SetStatus(msg);
}

bool InstallVersion(const wstring& ver) {
    wchar_t msg[256];
    swprintf_s(msg, L"安装版本: %s", ver.c_str());
    SetStatus(msg);
    
    wstring vdir = g_gameDir + L"\\versions\\" + ver;
    CreateDir(vdir);
    
    wstring jsonUrl = wstring(MIRRORS[g_mirrorIdx]) + L"/version/" + ver;
    wstring jsonPath = vdir + L"\\" + ver + L".json";
    
    if (!HttpDownload(jsonUrl, jsonPath)) {
        SetStatus(L"下载失败!");
        return false;
    }
    
    ifstream f(WideToUtf8(jsonPath));
    stringstream ss;
    ss << f.rdbuf();
    string json = ss.str();
    f.close();
    
    size_t cp = json.find("\"client\":{");
    if (cp != string::npos) {
        size_t up = json.find("\"url\":\"", cp);
        if (up != string::npos) {
            up += 7;
            size_t ue = json.find('"', up);
            string jarUrl = json.substr(up, ue - up);
            size_t pos = jarUrl.find("https://launchermeta.mojang.com");
            if (pos != string::npos) {
                jarUrl.replace(pos, 33, WideToUtf8(MIRRORS[g_mirrorIdx]));
            }
            HttpDownload(Utf8ToWide(jarUrl), vdir + L"\\" + ver + L".jar");
        }
    }
    
    LoadVersions();
    swprintf_s(msg, L"版本 %s 安装完成!", ver.c_str());
    SetStatus(msg);
    return true;
}

// ==================== 账户管理 ====================
void LoadAccounts() {
    g_accounts.clear();
    SendMessageW(g_hAccountList, LB_RESETCONTENT, 0, 0);
    
    wstring fpath = g_configDir + L"\\accounts.txt";
    ifstream f(WideToUtf8(fpath));
    if (f.is_open()) {
        string line;
        while (getline(f, line)) {
            if (line.empty() || line[0] == '#') continue;
            size_t p1 = line.find('|');
            if (p1 != string::npos) {
                wstring name = Utf8ToWide(line.substr(0, p1));
                g_accounts.push_back(name);
                SendMessageW(g_hAccountList, LB_ADDSTRING, 0, (LPARAM)name.c_str());
            }
        }
        f.close();
    }
}

void AddAccount(const wstring& name) {
    wstring fpath = g_configDir + L"\\accounts.txt";
    ofstream f(WideToUtf8(fpath), ios::app);
    if (f.is_open()) {
        f << WideToUtf8(name) << "|" << WideToUtf8(GenUUID(name)) << "\n";
        f.close();
    }
    wchar_t msg[256];
    swprintf_s(msg, L"已添加账户: %s", name.c_str());
    SetStatus(msg);
    LoadAccounts();
}

// ==================== 游戏启动 ====================
bool LaunchGame(const wstring& ver) {
    if (g_accounts.empty()) {
        SetStatus(L"请先添加账户!");
        return false;
    }
    
    wstring vdir = g_gameDir + L"\\versions\\" + ver;
    if (!DirExists(vdir)) {
        SetStatus(L"版本未安装!");
        return false;
    }
    
    wstring java = g_gameDir + L"\\runtime\\java\\bin\\java.exe";
    if (!DirExists(java.substr(0, java.rfind(L'\\')))) {
        wchar_t jh[MAX_PATH];
        if (GetEnvironmentVariableW(L"JAVA_HOME", jh, MAX_PATH)) {
            java = wstring(jh) + L"\\bin\\java.exe";
        }
    }
    
    if (!DirExists(java.substr(0, java.rfind(L'\\')))) {
        SetStatus(L"未找到Java! 请安装JDK 21");
        MessageBoxW(g_hMain, L"未找到Java运行环境!\n\n请安装 JDK 21:\nhttps://adoptium.net/", L"错误", MB_ICONERROR);
        return false;
    }
    
    wstring cmd = L"\"" + java + L"\" -Xms512M -Xmx2048M -XX:+UseG1GC ";
    cmd += L"-Dminecraft.launcher.brand=SCL ";
    cmd += L"-cp \"" + vdir + L"\\" + ver + L".jar\" ";
    cmd += L"net.minecraft.client.main.Main ";
    cmd += L"--username " + g_accounts[0] + L" ";
    cmd += L"--uuid " + GenUUID(g_accounts[0]) + L" ";
    cmd += L"--accessToken local ";
    cmd += L"--version " + ver + L" ";
    cmd += L"--gameDir \"" + g_gameDir + L"\" ";
    cmd += L"--width 854 --height 480";
    
    SetStatus(L"启动游戏...");
    
    STARTUPINFOW si = {sizeof(si)};
    PROCESS_INFORMATION pi;
    
    if (CreateProcessW(NULL, &cmd[0], NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, g_gameDir.c_str(), &si, &pi)) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        SetStatus(L"游戏已启动!");
        return true;
    }
    
    SetStatus(L"启动失败!");
    return false;
}

// ==================== 窗口回调 ====================
LRESULT CALLBACK WndProc(HWND h, UINT m, WPARAM w, LPARAM l) {
    switch (m) {
        case WM_CREATE: {
            // 标题
            CreateWindowW(L"Static", L"SCL",
                WS_CHILD | WS_VISIBLE | SS_CENTER,
                20, 10, 200, 40, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Static", L"Minecraft启动器",
                WS_CHILD | WS_VISIBLE,
                20, 45, 200, 20, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 左侧 - 账户管理
            CreateWindowW(L"Static", L"账户管理",
                WS_CHILD | WS_VISIBLE,
                20, 80, 200, 20, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            g_hAccountList = CreateWindowW(L"ListBox", L"",
                WS_CHILD | WS_VISIBLE | WS_BORDER | WS_VSCROLL | LBS_NOTIFY,
                20, 100, 230, 200, h, (HMENU)ID_LIST_ACCOUNTS, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Static", L"用户名:",
                WS_CHILD | WS_VISIBLE,
                20, 310, 60, 20, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Edit", L"",
                WS_CHILD | WS_VISIBLE | WS_BORDER | ES_AUTOHSCROLL,
                80, 308, 150, 25, h, (HMENU)ID_EDIT_NAME, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Button", L"添加离线账户",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                20, 340, 230, 30, h, (HMENU)ID_BTN_LOGIN, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 中间 - 版本列表
            CreateWindowW(L"Static", L"游戏版本",
                WS_CHILD | WS_VISIBLE,
                270, 20, 200, 20, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            g_hVersionList = CreateWindowW(L"ListBox", L"",
                WS_CHILD | WS_VISIBLE | WS_BORDER | WS_VSCROLL | LBS_NOTIFY,
                270, 45, 420, 380, h, (HMENU)ID_LIST_VERSIONS, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Button", L"刷新",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                270, 435, 100, 30, h, (HMENU)ID_BTN_REFRESH, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Button", L"下载版本",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                380, 435, 100, 30, h, (HMENU)ID_BTN_DOWNLOAD, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Button", L"启动游戏",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                490, 435, 100, 30, h, (HMENU)ID_BTN_PLAY, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            CreateWindowW(L"Button", L"设置",
                WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                600, 435, 90, 30, h, (HMENU)ID_BTN_SETTINGS, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 底部状态栏
            g_hStatus = CreateWindowW(L"Static", L"就绪",
                WS_CHILD | WS_VISIBLE | SS_LEFT,
                20, 485, 500, 20, h, (HMENU)ID_STATUS, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 进度条
            g_hProgress = CreateWindowW(L"msctls_progress32", L"",
                WS_CHILD | WS_VISIBLE | PBS_SMOOTH,
                20, 510, 660, 20, h, (HMENU)ID_PROGRESS, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 版本信息
            CreateWindowW(L"Static", L"v1.0.0 - SCL SUPER CRAFT LAUNCHER",
                WS_CHILD | WS_VISIBLE,
                540, 490, 200, 20, h, NULL, ((LPCREATESTRUCT)l)->hInstance, NULL);
            
            // 初始化
            g_configDir = GetAppData();
            g_gameDir = GetMinecraftDir();
            CreateDir(g_configDir);
            CreateDir(g_gameDir);
            LoadAccounts();
            LoadVersions();
            
            return 0;
        }
        
        case WM_COMMAND: {
            int id = LOWORD(w);
            int code = HIWORD(w);
            
            if (id == ID_BTN_LOGIN && code == BN_CLICKED) {
                wchar_t name[256] = {0};
                GetWindowTextW(GetDlgItem(h, ID_EDIT_NAME), name, 256);
                if (wcslen(name) > 0) {
                    AddAccount(name);
                    SetWindowTextW(GetDlgItem(h, ID_EDIT_NAME), L"");
                }
            }
            else if (id == ID_BTN_REFRESH && code == BN_CLICKED) {
                LoadVersions();
            }
            else if (id == ID_BTN_DOWNLOAD && code == BN_CLICKED) {
                int sel = SendMessageW(g_hVersionList, LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    InstallVersion(g_versions[sel]);
                }
            }
            else if (id == ID_BTN_PLAY && code == BN_CLICKED) {
                int sel = SendMessageW(g_hVersionList, LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    LaunchGame(g_versions[sel]);
                } else if (!g_versions.empty()) {
                    LaunchGame(g_versions[0]);
                }
            }
            else if (id == ID_BTN_SETTINGS && code == BN_CLICKED) {
                wchar_t info[512];
                swprintf_s(info, L"配置目录:\n%ls\n\n游戏目录:\n%ls\n\n当前镜像:\n%ls",
                    g_configDir.c_str(), g_gameDir.c_str(), MIRRORS[g_mirrorIdx]);
                MessageBoxW(h, info, L"设置", MB_ICONINFORMATION);
            }
            else if (id == ID_LIST_VERSIONS && code == LBN_DBLCLK) {
                int sel = SendMessageW(g_hVersionList, LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    if (!DirExists(g_gameDir + L"\\versions\\" + g_versions[sel])) {
                        InstallVersion(g_versions[sel]);
                    }
                }
            }
            return 0;
        }
        
        case WM_CTLCOLORSTATIC: {
            HDC dc = (HDC)w;
            SetBkMode(dc, TRANSPARENT);
            SetTextColor(dc, CLR_TEXT);
            return (LRESULT)CreateSolidBrush(CLR_BG);
        }
        
        case WM_ERASEBKGND: {
            HDC dc = (HDC)w;
            RECT r;
            GetClientRect(h, &r);
            HBRUSH b = CreateSolidBrush(CLR_BG);
            FillRect(dc, &r, b);
            DeleteObject(b);
            return 1;
        }
        
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(h, m, w, l);
}

// ==================== 入口 ====================
int WINAPI wWinMain(HINSTANCE h, HINSTANCE, LPWSTR, int) {
    WNDCLASSEXW wc = {sizeof(wc), CS_HREDRAW | CS_VREDRAW, WndProc, 0, 0, h,
        LoadIcon(NULL, IDI_APPLICATION), NULL,
        CreateSolidBrush(CLR_BG), NULL, L"SCL", NULL};
    
    RegisterClassExW(&wc);
    
    HWND hwnd = CreateWindowW(wc.lpszClassName, APP_TITLE,
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        CW_USEDEFAULT, CW_USEDEFAULT, WINDOW_W, WINDOW_H,
        NULL, NULL, h, NULL);
    
    if (!hwnd) return 1;
    
    MSG m;
    while (GetMessage(&m, NULL, 0, 0)) {
        TranslateMessage(&m);
        DispatchMessage(&m);
    }
    return 0;
}
