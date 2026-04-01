/*
 * SCL - SUPER CRAFT LAUNCHER
 * Minecraft Launcher - C++ Win32 Native Version
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <shlobj.h>
#include <commctrl.h>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <cstdio>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "comctl32.lib")

using namespace std;

#define APP_TITLE L"SCL - SUPER CRAFT LAUNCHER"
#define WINDOW_W 900
#define WINDOW_H 620

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

const wchar_t* MIRRORS[] = {
    L"https://bmclapi2.bangbang93.com",
    L"https://download.mcbbs.net",
    L"https://mirrors.aliyun.com/minecraft"
};
int g_mirrorIdx = 0;

#define CLR_BG RGB(26, 26, 46)
#define CLR_TEXT RGB(255, 255, 255)
#define CLR_DIM RGB(128, 128, 128)

HWND g_hMain, g_hStatus, g_hProgress, g_hVersionList, g_hAccountList;
wstring g_gameDir, g_configDir;
vector<wstring> g_versions;
vector<wstring> g_accounts;

wstring GetAppDataDir() {
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
    return (attr != INVALID_FILE_ATTRIBUTES && (attr & FILE_ATTRIBUTE_DIRECTORY);
}

void CreateDir(const wstring& d) {
    if (!DirExists(d)) CreateDirectoryW(d.c_str(), NULL);
}

void SetStatus(HWND h, const wchar_t* msg) {
    if (h) SetWindowTextW(h, msg);
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
    unsigned int h[4] = {0,0,0,0};
    for (size_t i = 0; i < input.size(); i++) {
        h[i % 4] = h[i % 4] * 31 + (unsigned int)input[i];
    }
    wchar_t uuid[64];
    wsprintfW(uuid, L"%08x%04x%04x%04x%04x%08x%04x",
        h[0] & 0xffffffff, (h[1] >> 16) & 0xffff, (h[1] & 0xffff) | 0x4000,
        ((h[2] >> 16) & 0x3fff) | 0x8000, h[2] & 0xffff,
        h[3] & 0xffff, (h[0] >> 16) & 0xffff);
    return wstring(uuid);
}

bool HttpDownload(const wstring& url, const wstring& path) {
    URL_COMPONENTSW uc = {};
    uc.dwStructSize = sizeof(uc);
    wchar_t host[256] = {}, pathb[2048] = {};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), (DWORD)url.length(), 0, &uc)) return false;
    
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
    if (!f.is_open()) { WinHttpCloseHandle(req); WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return false; }
    
    char buf[65536];
    DWORD br;
    while (WinHttpReadData(req, buf, sizeof(buf), &br) && br > 0) {
        f.write(buf, br);
    }
    f.close();
    WinHttpCloseHandle(req);
    WinHttpCloseHandle(conn);
    WinHttpCloseHandle(ses);
    return true;
}

string HttpGet(const wstring& url) {
    URL_COMPONENTSW uc = {};
    uc.dwStructSize = sizeof(uc);
    wchar_t host[256] = {}, pathb[2048] = {};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), (DWORD)url.length(), 0, &uc)) return "";
    
    HINTERNET ses = WinHttpOpen(L"SCL/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!ses) return "";
    
    HINTERNET conn = WinHttpConnect(ses, host, uc.nPort, 0);
    if (!conn) { WinHttpCloseHandle(ses); return ""; }
    
    HINTERNET req = WinHttpOpenRequest(conn, L"GET", pathb, NULL, NULL, NULL, 0);
    if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return ""; }
    
    WinHttpSendRequest(req, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(req, NULL);
    
    string res;
    char buf[65536];
    DWORD br;
    while (WinHttpReadData(req, buf, sizeof(buf), &br) && br > 0) {
        res.append(buf, br);
    }
    
    WinHttpCloseHandle(req);
    WinHttpCloseHandle(conn);
    WinHttpCloseHandle(ses);
    return res;
}

void LoadVersions(HWND hList, HWND hStatus) {
    g_versions.clear();
    SendMessageW(hList, LB_RESETCONTENT, 0, 0);
    SetStatus(hStatus, L"Loading versions...");
    
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
        SetStatus(hStatus, L"Failed to load versions");
        return;
    }
    
    size_t pos = 0;
    while ((pos = json.find("\"id\":\"", pos)) != string::npos) {
        pos += 6;
        size_t e = json.find('"', pos);
        if (e == string::npos) break;
        wstring id = Utf8ToWide(json.substr(pos, e - pos));
        g_versions.push_back(id);
        wstring display = id;
        if (DirExists(g_gameDir + L"\\versions\\" + id)) display += L" [Installed]";
        SendMessageW(hList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
        pos = e;
    }
    
    wchar_t msg[256];
    wsprintfW(msg, L"Loaded %d versions", (int)g_versions.size());
    SetStatus(hStatus, msg);
}

bool InstallVersion(HWND hStatus, const wstring& ver) {
    wchar_t msg[256];
    wsprintfW(msg, L"Installing: %s", ver.c_str());
    SetStatus(hStatus, msg);
    
    wstring vdir = g_gameDir + L"\\versions\\" + ver;
    CreateDir(vdir);
    
    wstring jsonUrl = wstring(MIRRORS[g_mirrorIdx]) + L"/version/" + ver;
    wstring jsonPath = vdir + L"\\" + ver + L".json";
    
    if (!HttpDownload(jsonUrl, jsonPath)) {
        SetStatus(hStatus, L"Download failed");
        return false;
    }
    
    wsprintfW(msg, L"Version %s installed", ver.c_str());
    SetStatus(hStatus, msg);
    return true;
}

void LoadAccounts(HWND hList) {
    g_accounts.clear();
    SendMessageW(hList, LB_RESETCONTENT, 0, 0);
    
    wstring fpath = g_configDir + L"\\accounts.txt";
    ifstream f(WideToUtf8(fpath));
    if (f.is_open()) {
        string line;
        while (getline(f, line)) {
            if (line.empty() || line[0] == '#') continue;
            size_t p = line.find('|');
            if (p != string::npos) {
                wstring name = Utf8ToWide(line.substr(0, p));
                g_accounts.push_back(name);
                SendMessageW(hList, LB_ADDSTRING, 0, (LPARAM)name.c_str());
            }
        }
        f.close();
    }
}

void AddAccount(HWND hStatus, const wstring& name) {
    wstring fpath = g_configDir + L"\\accounts.txt";
    ofstream f(WideToUtf8(fpath), ios::app);
    if (f.is_open()) {
        f << WideToUtf8(name) << "|" << WideToUtf8(GenUUID(name)) << "\n";
        f.close();
    }
    wchar_t msg[256];
    wsprintfW(msg, L"Account added: %s", name.c_str());
    SetStatus(hStatus, msg);
    LoadAccounts(GetDlgItem(g_hMain, ID_LIST_ACCOUNTS));
}

bool LaunchGame(HWND hStatus, const wstring& ver) {
    if (g_accounts.empty()) {
        SetStatus(hStatus, L"Please add account first");
        return false;
    }
    
    wstring vdir = g_gameDir + L"\\versions\\" + ver;
    if (!DirExists(vdir)) {
        SetStatus(hStatus, L"Version not installed");
        return false;
    }
    
    wstring java = g_gameDir + L"\\runtime\\java\\bin\\java.exe";
    if (!DirExists(java)) {
        wchar_t jh[MAX_PATH];
        if (GetEnvironmentVariableW(L"JAVA_HOME", jh, MAX_PATH)) {
            java = wstring(jh) + L"\\bin\\java.exe";
        }
    }
    
    if (!DirExists(java)) {
        SetStatus(hStatus, L"Java not found! Install JDK 21");
        MessageBoxW(g_hMain, L"Java not found!\nInstall JDK 21\nhttps://adoptium.net/", L"Error", MB_ICONERROR);
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
    
    SetStatus(hStatus, L"Launching game...");
    
    STARTUPINFOW si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    
    if (CreateProcessW(NULL, (LPWSTR)cmd.c_str(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, g_gameDir.c_str(), &si, &pi)) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        SetStatus(hStatus, L"Game launched!");
        return true;
    }
    
    SetStatus(hStatus, L"Launch failed");
    return false;
}

void LoadVersionsDlg(HWND hStatus) {
    LoadVersions(GetDlgItem(g_hMain, ID_LIST_VERSIONS), hStatus);
}

INT_PTR CALLBACK DialogProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_INITDIALOG: {
            g_hMain = hwnd;
            g_hStatus = GetDlgItem(hwnd, 4001);
            g_hVersionList = GetDlgItem(hwnd, ID_LIST_VERSIONS);
            g_hAccountList = GetDlgItem(hwnd, ID_LIST_ACCOUNTS);
            
            g_configDir = GetAppDataDir();
            g_gameDir = GetMinecraftDir();
            CreateDir(g_configDir);
            CreateDir(g_gameDir);
            
            LoadAccounts(GetDlgItem(hwnd, ID_LIST_ACCOUNTS));
            LoadVersions(GetDlgItem(hwnd, ID_LIST_VERSIONS), GetDlgItem(hwnd, 4001));
            return TRUE;
        }
        
        case WM_COMMAND: {
            int id = LOWORD(wParam);
            int code = HIWORD(wParam);
            
            if (id == ID_BTN_LOGIN && code == BN_CLICKED) {
                wchar_t name[256] = {};
                GetDlgItemTextW(hwnd, ID_EDIT_NAME, name, 256);
                if (wcslen(name) > 0) {
                    AddAccount(GetDlgItem(hwnd, 4001), name);
                    SetDlgItemTextW(hwnd, ID_EDIT_NAME, L"");
                }
            }
            else if (id == ID_BTN_REFRESH && code == BN_CLICKED) {
                LoadVersions(GetDlgItem(hwnd, ID_LIST_VERSIONS), GetDlgItem(hwnd, 4001));
            }
            else if (id == ID_BTN_DOWNLOAD && code == BN_CLICKED) {
                int sel = SendMessageW(GetDlgItem(hwnd, ID_LIST_VERSIONS), LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    InstallVersion(GetDlgItem(hwnd, 4001), g_versions[sel]);
                    LoadVersions(GetDlgItem(hwnd, ID_LIST_VERSIONS), GetDlgItem(hwnd, 4001));
                }
            }
            else if (id == ID_BTN_PLAY && code == BN_CLICKED) {
                int sel = SendMessageW(GetDlgItem(hwnd, ID_LIST_VERSIONS), LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    LaunchGame(GetDlgItem(hwnd, 4001), g_versions[sel]);
                }
                else if (!g_versions.empty()) {
                    LaunchGame(GetDlgItem(hwnd, 4001), g_versions[0]);
                }
            }
            else if (id == ID_BTN_SETTINGS && code == BN_CLICKED) {
                wchar_t info[512];
                wsprintfW(info, L"Config:\n%ls\n\nGame:\n%ls\n\nMirror:\n%ls",
                    g_configDir.c_str(), g_gameDir.c_str(), MIRRORS[g_mirrorIdx]);
                MessageBoxW(hwnd, info, L"Settings", MB_ICONINFORMATION);
            }
            return TRUE;
        }
        
        case WM_CTLCOLORSTATIC:
        case WM_CTLCOLORDLG: {
            HDC hdc = (HDC)wParam;
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, CLR_TEXT);
            return (INT_PTR)CreateSolidBrush(CLR_BG);
        }
        
        case WM_ERASEBKGND: {
            HDC hdc = (HDC)wParam;
            RECT rect;
            GetClientRect(hwnd, &rect);
            HBRUSH brush = CreateSolidBrush(CLR_BG);
            FillRect(hdc, &rect, brush);
            DeleteObject(brush);
            return 1;
        }
        
        case WM_CLOSE:
            EndDialog(hwnd, 0);
            return TRUE;
    }
    return FALSE;
}

int WINAPI WinMain(HINSTANCE h, HINSTANCE, LPWSTR, int nCmdShow) {
    INITCOMMONCONTROLSEX icex = { sizeof(icex), ICC_LISTVIEW_CLASSES | ICC_PROGRESS_CLASS };
    InitCommonControlsEx(&icex);
    
    DialogBoxW(h, MAKEINTRESOURCE(1), NULL, DialogProc);
    return 0;
}
