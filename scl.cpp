/*
 * SCL - Minecraft Launcher
 * Simple Win32 Version
 */
#include <windows.h>
#include <wininet.h>
#include <shlobj.h>
#include <commctrl.h>
#include <string>
#include <vector>
#include <fstream>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "comctl32.lib")

using namespace std;

#define ID_LIST 1001
#define ID_BTN1 2001
#define ID_BTN2 2002
#define ID_BTN3 2003
#define ID_EDIT 3001
#define ID_STATUS 4001
#define CLR_BG RGB(26, 26, 46)
#define CLR_TEXT RGB(255,255,255)

vector<string> g_versions;
vector<string> g_accounts;
string g_gameDir;

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

bool Exists(const string& d) {
    return GetFileAttributesA(d.c_str()) != INVALID_FILE_ATTRIBUTES;
}

void MakeDir(const string& d) {
    if (!Exists(d)) CreateDirectoryA(d.c_str(), NULL);
}

string UUID(const string& name) {
    string s = "OfflinePlayer:" + name;
    unsigned h[4] = {0,0,0,0};
    for (size_t i=0; i<s.size(); i++) h[i%4] = h[i%4]*31 + s[i];
    char u[64];
    sprintf(u, "%08x%04x%04x%04x%04x%08x%04x",
        h[0]&0xffffffff, h[1]>>16&0xffff, h[1]&0xffff|0x4000,
        h[2]>>16&0x3fff|0x8000, h[2]&0xffff,
        h[3]&0xffff, h[0]>>16&0xffff);
    return string(u);
}

bool Download(const string& url, const string& path) {
    URLDownloadToCacheFile(NULL, url.c_str(), path.c_str(), 0, NULL, NULL);
    return Exists(path);
}

string Get(const string& url) {
    string tmp = GetTempPathA(NULL) + "scl.tmp";
    if (URLDownloadToCacheFile(NULL, url.c_str(), (char*)tmp.c_str(), 0, NULL, NULL)) {
        ifstream f(tmp);
        stringstream ss;
        ss << f.rdbuf();
        f.close();
        DeleteFileA(tmp.c_str());
        return ss.str();
    }
    return "";
}

void LoadVersions(HWND hList) {
    g_versions.clear();
    SendMessage(hList, LB_RESETCONTENT, 0, 0);
    SetWindowText(GetDlgItem(GetParent(hList), ID_STATUS, "Loading...");
    
    string json = Get("https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json");
    if (json.empty()) json = Get("https://download.mcbbs.net/mc/game/version_manifest_v2.json");
    if (json.empty()) json = Get("https://mirrors.aliyun.com/minecraft/mc/game/version_manifest_v2.json");
    
    if (!json.empty()) {
        size_t p = 0;
        while ((p = json.find("\"id\":\"", p)) != string::npos) {
            p += 7;
            size_t e = json.find('"', p);
            if (e == string::npos) break;
            string id = json.substr(p, e-p);
            g_versions.push_back(id);
            string display = id + (Exists(g_gameDir + "\\versions\\" + id + "\\" + id + ".json" ? " [Installed]" : "");
            SendMessage(hList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
            p = e;
        }
    }
    
    char msg[64];
    sprintf(msg, "Loaded %d versions", g_versions.size());
    SetWindowText(GetDlgItem(GetParent(hList), ID_STATUS, msg);
}

void AddAccount(HWND hwnd, const string& name) {
    string f = GetAppData() + "\\accounts.txt";
    ofstream out(f, ios::app);
    if (out.is_open()) {
        out << name << "|" << UUID(name) << "\n";
        out.close();
    }
    SetWindowText(GetDlgItem(hwnd, ID_STATUS, ("Added: " + name).c_str());
    LoadAccounts(GetDlgItem(hwnd, ID_LIST));
}

void LoadAccounts(HWND hList) {
    g_accounts.clear();
    SendMessage(hList, LB_RESETCONTENT, 0, 0);
    string f = GetAppData() + "\\accounts.txt";
    ifstream in(f);
    string line;
    while (getline(in, line)) {
        if (!line.empty() && line[0] != '#') {
            size_t p = line.find('|');
            if (p != string::npos) {
                string name = line.substr(0, p);
                g_accounts.push_back(name);
                SendMessage(hList, LB_ADDSTRING, 0, (LPARAM)name.c_str());
            }
        }
    }
    in.close();
}

void Install(HWND hwnd, const string& ver) {
    string dir = g_gameDir + "\\versions\\" + ver;
    MakeDir(dir);
    
    string json = Get("https://bmclapi2.bangbang93.com/version/" + ver);
    if (!json.empty()) {
        ofstream out(dir + "\\" + ver + ".json");
        out << json;
        out.close();
        SetWindowText(GetDlgItem(hwnd, ID_STATUS, ("Installed: " + ver).c_str());
        LoadVersions(GetDlgItem(hwnd, ID_LIST));
    }
}

void Play(HWND hwnd) {
    if (g_accounts.empty()) {
        MessageBox(hwnd, "Add account first!", "Error", MB_OK | MB_ICONERROR);
        return;
    }
    
    int sel = SendMessage(GetDlgItem(hwnd, ID_LIST, LB_GETCURSEL, 0, 0);
    if (sel < 0) sel = 0;
    if (sel >= (int)g_versions.size()) return;
    
    string ver = g_versions[sel];
    string dir = g_gameDir + "\\versions\\" + ver;
    if (!Exists(dir + "\\" + ver + ".json")) {
        Install(hwnd, ver);
    }
    
    string java = GetJavaHome() + "\\bin\\java.exe";
    if (!Exists(java)) {
        MessageBox(hwnd, "Java not found!\nInstall JDK 21", "Error", MB_OK | MB_ICONERROR);
        return;
    }
    
    string cmd = "\"" + java + "\" -Xms512M -Xmx2048M -jar \"" + dir + "\\" + ver + ".jar\" --username " + g_accounts[0];
    STARTUPINFO si = {sizeof(si)};
    PROCESS_INFORMATION pi;
    CreateProcess(NULL, (char*)cmd.c_str(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, g_gameDir.c_str(), &si, &pi);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
}

string GetJavaHome() {
    char jh[MAX_PATH];
    if (GetEnvironmentVariable("JAVA_HOME", jh, MAX_PATH)) return string(jh);
    
    // Search common paths
    char pf[MAX_PATH];
    GetEnvironmentVariable("ProgramFiles", pf, MAX_PATH);
    string p = string(pf) + "\\Eclipse Adoptium\\jdk-21";
    if (Exists(p + "\\bin\\java.exe")) return p;
    
    p = string(pf) + "\\Java\\jdk";
    if (Exists(p + "\\bin\\java.exe")) return p;
    
    return "";
}

INT_PTR CALLBACK DlgProc(HWND h, UINT m, WPARAM w, LPARAM l) {
    switch (m) {
        case WM_INITDIALOG: {
            g_gameDir = GetMinecraftDir();
            MakeDir(GetAppData());
            MakeDir(g_gameDir);
            LoadAccounts(GetDlgItem(h, ID_LIST));
            LoadVersions(GetDlgItem(h, ID_LIST));
            return TRUE;
        }
        case WM_COMMAND: {
            int id = LOWORD(w);
            int code = HIWORD(w);
            
            if (id == ID_BTN1 && code == BN_CLICKED) {
                char name[256] = {};
                GetDlgItemText(h, ID_EDIT, name, 256);
                if (strlen(name)) AddAccount(h, name);
            }
            if (id == ID_BTN2 && code == BN_CLICKED) LoadVersions(GetDlgItem(h, ID_LIST));
            if (id == ID_BTN3 && code == BN_CLICKED) Play(h);
            return TRUE;
        }
        case WM_CTLCOLORSTATIC: return (INT_PTR)CreateSolidBrush(CLR_BG);
        case WM_ERASEBKGND: {
            HDC dc = (HDC)w;
            RECT r; GetClientRect(h, &r);
            FillRect(dc, &r, CreateSolidBrush(CLR_BG));
            return TRUE;
        }
        case WM_CLOSE: EndDialog(h, 0);
    }
    return FALSE;
}

int WINAPI WinMain(HINSTANCE h, HINSTANCE, LPSTR, int) {
    INITCOMMONCONTROLSEX ice = {sizeof(ice), ICC_LISTVIEW_CLASSES};
    InitCommonControlsEx(&ice);
    DialogBox(h, MAKEINTRESOURCE(1), NULL, DlgProc);
    return 0;
}
</parameter>
