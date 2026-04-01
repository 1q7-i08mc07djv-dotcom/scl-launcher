/*
 * SCL - Minecraft Launcher
 * C++ Win32 Native Version
 */
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

#define APP_TITLE "SCL - Minecraft Launcher"
#define WINDOW_W 900
#define WINDOW_H 620

#define ID_LIST_VERS 1001
#define ID_LIST_ACCS 1002
#define ID_BTN_LOGIN 2001
#define ID_BTN_DOWN 2002
#define ID_BTN_PLAY 2003
#define ID_EDIT_NAME 3001
#define ID_STATUS 4001

const char* MIRRORS[] = {
    "https://bmclapi2.bangbang93.com",
    "https://download.mcbbs.net",
    "https://mirrors.aliyun.com/minecraft"
};
int g_mirrorIdx = 0;

#define CLR_BG RGB(26, 26, 46)
#define CLR_TEXT RGB(255, 255, 255)

HWND g_hMain, g_hStatus, g_hVersionList, g_hAccountList;
string g_gameDir, g_configDir;
vector<string> g_versions;
vector<string> g_accounts;

string GetAppData() {
    char p[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, p);
    return string(p) + "\\SCL";
}

string GetMinecraftDir() {
    char p[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, p);
    return string(p) + "\\.minecraft";
}

bool DirExists(const string& d) {
    DWORD attr = GetFileAttributesA(d.c_str());
    return (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY));
}

void CreateDir(const string& d) {
    if (!DirExists(d)) CreateDirectoryA(d.c_str(), NULL);
}

void SetStatus(HWND h, const char* msg) {
    if (h) SetWindowTextA(h, msg);
}

string GenUUID(const string& name) {
    string input = "OfflinePlayer:" + name;
    unsigned h[4] = {0};
    for (size_t i = 0; i < input.size(); i++) {
        h[i % 4] = h[i % 4] * 31 + (unsigned)input[i];
    }
    char uuid[64];
    sprintf(uuid, "%08x%04x%04x%04x%04x%08x%04x",
        h[0] & 0xffffffff, (h[1] >> 16) & 0xffff, (h[1] & 0xffff) | 0x4000,
        ((h[2] >> 16) & 0x3fff) | 0x8000, h[2] & 0xffff,
        h[3] & 0xffff, (h[0] >> 16) & 0xffff);
    return string(uuid);
}

bool HttpDownload(const string& url, const string& path) {
    URL_COMPONENTSA uc = {sizeof(uc)};
    char host[256] = {}, pathb[2048] = {};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), url.length(), 0, &uc)) return false;
    
    HINTERNET ses = WinHttpOpen("SCL/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!ses) return false;
    
    HINTERNET conn = WinHttpConnect(ses, host, uc.nPort, 0);
    if (!conn) { WinHttpCloseHandle(ses); return false; }
    
    DWORD flags = (uc.nScheme == INTERNET_SCHEME_HTTPS) ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET req = WinHttpOpenRequest(conn, "GET", pathb, NULL, NULL, NULL, flags);
    if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return false; }
    
    WinHttpSendRequest(req, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(req, NULL);
    
    size_t ps = path.rfind('\\');
    if (ps != string::npos) CreateDir(path.substr(0, ps));
    
    ofstream f(path, ios::binary);
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

string HttpGet(const string& url) {
    URL_COMPONENTSA uc = {sizeof(uc)};
    char host[256] = {}, pathb[2048] = {};
    uc.lpszHostName = host;
    uc.lpszUrlPath = pathb;
    uc.dwHostNameLength = 255;
    uc.dwUrlPathLength = 2047;
    
    if (!WinHttpCrackUrl(url.c_str(), url.length(), 0, &uc)) return "";
    
    HINTERNET ses = WinHttpOpen("SCL/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!ses) return "";
    
    HINTERNET conn = WinHttpConnect(ses, host, uc.nPort, 0);
    if (!conn) { WinHttpCloseHandle(ses); return ""; }
    
    HINTERNET req = WinHttpOpenRequest(conn, "GET", pathb, NULL, NULL, NULL, 0);
    if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(ses); return ""; }
    
    WinHttpSendRequest(req, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(req, NULL);
    
    string res;
    while (WinHttpReadData(req, buf, sizeof(buf), &br) && br > 0) res.append(buf, br);
    
    WinHttpCloseHandle(req);
    WinHttpCloseHandle(conn);
    WinHttpCloseHandle(ses);
    return res;
}

void LoadVersions(HWND hList, HWND hStatus) {
    g_versions.clear();
    SendMessageA(hList, LB_RESETCONTENT, 0, 0);
    SetStatus(hStatus, "Loading versions...");
    
    string url = string(MIRRORS[g_mirrorIdx]) + "/mc/game/version_manifest_v2.json";
    string json = HttpGet(url);
    
    if (json.empty()) {
        for (int i = 0; i < 3; i++) {
            g_mirrorIdx = (g_mirrorIdx + 1) % 3;
            url = string(MIRRORS[g_mirrorIdx]) + "/mc/game/version_manifest_v2.json";
            json = HttpGet(url);
            if (!json.empty()) break;
        }
    }
    
    if (json.empty()) {
        SetStatus(hStatus, "Failed to load versions");
        return;
    }
    
    size_t pos = 0;
    while ((pos = json.find("\"id\":\"", pos)) != string::npos) {
        pos += 6;
        size_t e = json.find('"', pos);
        if (e == string::npos) break;
        string id = json.substr(pos, e - pos);
        g_versions.push_back(id);
        
        string display = id;
        if (DirExists(g_gameDir + "\\versions\\" + id)) display += " [Installed]";
        SendMessageA(hList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
        pos = e;
    }
    
    char msg[256];
    sprintf(msg, "Loaded %d versions", (int)g_versions.size());
    SetStatus(hStatus, msg);
}

void InstallVersion(HWND hStatus, const string& ver) {
    char msg[256];
    sprintf(msg, "Installing: %s", ver.c_str());
    SetStatus(hStatus, msg);
    
    string vdir = g_gameDir + "\\versions\\" + ver;
    CreateDir(vdir);
    
    string jsonUrl = string(MIRRORS[g_mirrorIdx]) + "/version/" + ver;
    string jsonPath = vdir + "\\" + ver + ".json";
    
    if (!HttpDownload(jsonUrl, jsonPath)) {
        SetStatus(hStatus, "Download failed");
        return;
    }
    
    sprintf(msg, "Version %s installed", ver.c_str());
    SetStatus(hStatus, msg);
}

void LoadAccounts(HWND hList) {
    g_accounts.clear();
    SendMessageA(hList, LB_RESETCONTENT, 0, 0);
    
    string fpath = g_configDir + "\\accounts.txt";
    ifstream f(fpath);
    if (f.is_open()) {
        string line;
        while (getline(f, line)) {
            if (!line.empty() && line[0] != '#') {
                size_t p = line.find('|');
                if (p != string::npos) {
                    string name = line.substr(0, p);
                    g_accounts.push_back(name);
                    SendMessageA(hList, LB_ADDSTRING, 0, (LPARAM)name.c_str());
                }
            }
        }
        f.close();
    }
}

void AddAccount(HWND hStatus, const string& name) {
    string fpath = g_configDir + "\\accounts.txt";
    ofstream f(fpath, ios::app);
    if (f.is_open()) {
        f << name << "|" << GenUUID(name) << "\n";
        f.close();
    }
    char msg[256];
    sprintf(msg, "Account added: %s", name.c_str());
    SetStatus(hStatus, msg);
    LoadAccounts(GetDlgItem(g_hMain, ID_LIST_ACCS));
}

bool LaunchGame(HWND hStatus, const string& ver) {
    if (g_accounts.empty()) {
        SetStatus(hStatus, "Add account first");
        return false;
    }
    
    string vdir = g_gameDir + "\\versions\\" + ver;
    if (!DirExists(vdir)) {
        SetStatus(hStatus, "Version not installed");
        return false;
    }
    
    string java = g_gameDir + "\\runtime\\java\\bin\\java.exe";
    if (!DirExists(java)) {
        char jh[MAX_PATH];
        if (GetEnvironmentVariableA("JAVA_HOME", jh, MAX_PATH)) {
            java = string(jh) + "\\bin\\java.exe";
        }
    }
    
    if (!DirExists(java)) {
        SetStatus(hStatus, "Java not found! Install JDK");
        MessageBoxA(g_hMain, "Java not found!\nInstall JDK 21\nhttps://adoptium.net/", "Error", MB_OK | MB_ICONERROR);
        return false;
    }
    
    string cmd = "\"" + java + "\" -Xms512M -Xmx2048M -XX:+UseG1GC ";
    cmd += "-Dminecraft.launcher.brand=SCL ";
    cmd += "-cp \"" + vdir + "\\" + ver + ".jar\" ";
    cmd += "net.minecraft.client.main.Main ";
    cmd += "--username " + g_accounts[0] + " ";
    cmd += "--uuid " + GenUUID(g_accounts[0]) + " ";
    cmd += "--accessToken local ";
    cmd += "--version " + ver + " ";
    cmd += "--gameDir \"" + g_gameDir + "\" ";
    cmd += "--width 854 --height 480";
    
    SetStatus(hStatus, "Launching game...");
    
    STARTUPINFOA si = {sizeof(si)};
    PROCESS_INFORMATION pi;
    
    if (CreateProcessA(NULL, &cmd[0], NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, g_gameDir.c_str(), &si, &pi)) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        SetStatus(hStatus, "Game launched");
        return true;
    }
    
    SetStatus(hStatus, "Launch failed");
    return false;
}

INT_PTR CALLBACK DlgProc(HWND h, UINT m, WPARAM w, LPARAM l) {
    switch (m) {
        case WM_INITDIALOG: {
            g_hMain = h;
            g_hStatus = GetDlgItem(h, ID_STATUS);
            g_hVersionList = GetDlgItem(h, ID_LIST_VERS);
            g_hAccountList = GetDlgItem(h, ID_LIST_ACCS);
            
            g_configDir = GetAppData();
            g_gameDir = GetMinecraftDir();
            CreateDir(g_configDir);
            CreateDir(g_gameDir);
            
            LoadAccounts(GetDlgItem(h, ID_LIST_ACCS);
            LoadVersions(GetDlgItem(h, ID_LIST_VERS), GetDlgItem(h, ID_STATUS);
            return TRUE;
        }
        
        case WM_COMMAND: {
            int id = LOWORD(w);
            int code = HIWORD(w);
            
            if (id == ID_BTN_LOGIN && code == BN_CLICKED) {
                char name[256] = {0};
                GetDlgItemTextA(h, ID_EDIT_NAME, name, 256);
                if (strlen(name) > 0) {
                    AddAccount(GetDlgItem(h, ID_STATUS), name);
                    SetDlgItemTextA(h, ID_EDIT_NAME, "");
                }
            }
            else if (id == ID_BTN_DOWN && code == BN_CLICKED) {
                int sel = SendMessageA(GetDlgItem(h, ID_LIST_VERS), LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    InstallVersion(GetDlgItem(h, ID_STATUS), g_versions[sel]);
                    LoadVersions(GetDlgItem(h, ID_LIST_VERS), GetDlgItem(h, ID_STATUS);
                }
            }
            else if (id == ID_BTN_PLAY && code == BN_CLICKED) {
                int sel = SendMessageA(GetDlgItem(h, ID_LIST_VERS), LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    LaunchGame(GetDlgItem(h, ID_STATUS), g_versions[sel]);
                }
            }
            return TRUE;
        }
        
        case WM_CTLCOLORSTATIC:
        case WM_CTLCOLORDLG: {
            HDC dc = (HDC)w;
            SetBkMode(dc, TRANSPARENT);
            SetTextColor(dc, CLR_TEXT);
            return (INT_PTR)CreateSolidBrush(CLR_BG);
        }
        
        case WM_CLOSE:
            EndDialog(h, 0);
            return TRUE;
    }
    return FALSE;
}

int WINAPI WinMain(HINSTANCE h, HINSTANCE, LPSTR, int) {
    INITCOMMONCONTROLSEX icex = {sizeof(icex), ICC_LISTVIEW_CLASSES | ICC_PROGRESS_CLASS};
    InitCommonControlsEx(&icex);
    
    DialogBoxA(h, MAKEINTRESOURCE(1), NULL, DlgProc);
    return 0;
}
