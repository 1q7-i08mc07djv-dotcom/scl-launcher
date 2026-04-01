// SCL - Minecraft启动器 C++ Win32版本
// 功能：离线登录、正版登录、版本管理、多镜像下载
// 编译方式：VS Developer Command Prompt: cl /EHsc SCL.cpp winhttp.lib comctl32.lib

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <tchar.h>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <ShlObj.h>
#include <commctrl.h>
#include <shlwapi.h>
#include <algorithm>
#include <cstdio>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "shlwapi.lib")

using namespace std;

// ============================================
// 常量定义
// ============================================
#define ID_BTN_LOGIN 1001
#define ID_BTN_REFRESH 1002
#define ID_BTN_DOWNLOAD 1003
#define ID_BTN_PLAY 1004
#define ID_BTN_SETTINGS 1005
#define ID_EDIT_USERNAME 2001
#define ID_COMBO_TYPE 2002
#define ID_LIST_VERSIONS 2003
#define ID_STATIC_STATUS 3001
#define ID_PROGRESS 3002

// 配色
#define COLOR_BG RGB(26, 26, 46)
#define COLOR_CARD RGB(22, 33, 62)
#define COLOR_ACCENT RGB(30, 136, 229)
#define COLOR_RED RGB(233, 69, 96)
#define COLOR_TEXT RGB(255, 255, 255)
#define COLOR_TEXT_DIM RGB(176, 176, 176)

// 镜像源
const char* MIRRORS[] = {
    "https://bmclapi2.bangbang93.com",
    "https://download.mcbbs.net",
    "https://mirrors.aliyun.com/minecraft"
};

// ============================================
// 全局变量
// ============================================
struct Account {
    string username;
    string uuid;
    string type;  // offline, microsoft, thirdparty
    string token;
};

struct GameVersion {
    string id;
    string type;
    string url;
    bool installed;
};

HINSTANCE g_hInst;
HWND g_hwndMain;
HWND g_hwndStatus;
HWND g_hwndProgress;
HWND g_hwndVersionList;
HWND g_hwndAccountList;

string g_configDir;
string g_gameDir;
string g_selectedVersion;
string g_currentMirror;
int g_currentMirrorIndex = 0;

vector<Account> g_accounts;
vector<GameVersion> g_versions;
Account* g_currentAccount = nullptr;

// ============================================
// 工具函数
// ============================================
string GetAppDataPath() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, path);
    return string(path) + "\\SCL";
}

string GetMinecraftPath() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, path);
    return string(path) + "\\.minecraft";
}

bool FileExists(const string& path) {
    DWORD attr = GetFileAttributesA(path.c_str());
    return (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY));
}

void CreateDir(const string& path) {
    CreateDirectoryA(path.c_str(), NULL);
}

string WideToUtf8(const wstring& wstr) {
    if (wstr.empty()) return "";
    int size = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, NULL, 0, NULL, NULL);
    string result(size - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, &result[0], size, NULL, NULL);
    return result;
}

wstring Utf8ToWide(const string& str) {
    if (str.empty()) return L"";
    int size = MultiByteToWideChar(CP_UTF8, 0, &str[0], -1, NULL, 0);
    wstring result(size - 1, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], -1, &result[0], size);
    return result;
}

string ReplaceString(const string& str, const string& from, const string& to) {
    string result = str;
    size_t pos = 0;
    while ((pos = result.find(from, pos)) != string::npos) {
        result.replace(pos, from.length(), to);
        pos += to.length();
    }
    return result;
}

// 简单哈希生成UUID
string GenerateUUID(const string& name) {
    string input = "OfflinePlayer:" + name;
    
    // 简单的MD5风格哈希
    unsigned int hash[4] = {0};
    for (size_t i = 0; i < input.length(); i++) {
        hash[(i % 4)] = hash[(i % 4)] * 31 + input[i];
    }
    
    char uuid[64];
    sprintf_s(uuid, sizeof(uuid), "%08x%04x%04x%04x%04x%08x%04x",
        hash[0] & 0xffffffff,
        (hash[1] >> 16) & 0xffff,
        (hash[1] & 0xffff) | 0x4000,
        ((hash[2] >> 16) & 0x3fff) | 0x8000,
        (hash[2] & 0xffff),
        hash[3] & 0xffff,
        (hash[0] >> 16) & 0xffff);
    
    return string(uuid);
}

// ============================================
// 网络请求
// ============================================
bool HttpDownload(const string& url, const string& destPath) {
    URL_COMPONENTS urlComp;
    memset(&urlComp, 0, sizeof(urlComp));
    urlComp.dwStructSize = sizeof(urlComp);
    
    char host[256] = {0}, path[2048] = {0};
    urlComp.lpszHostName = host;
    urlComp.lpszUrlPath = path;
    urlComp.dwHostNameLength = 255;
    urlComp.dwUrlPathLength = 2047;
    
    wstring wurl = Utf8ToWide(url);
    if (!WinHttpCrackUrl(wurl.c_str(), url.length(), 0, &urlComp)) {
        SetStatus("URL解析失败");
        return false;
    }
    
    HINTERNET hSession = WinHttpOpen(L"SCL/1.0", 
        WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession) return false;
    
    HINTERNET hConnect = WinHttpConnect(hSession, 
        Utf8ToWide(host).c_str(), urlComp.nPort, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return false; }
    
    DWORD flags = (urlComp.nScheme == INTERNET_SCHEME_HTTPS) ? 
        WINHTTP_FLAG_SECURE : 0;
    
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", 
        Utf8ToWide(path).c_str(), NULL, NULL, NULL, flags);
    if (!hRequest) { 
        WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); 
        return false; 
    }
    
    if (!WinHttpSendRequest(hRequest, NULL, 0, NULL, 0, 0, 0)) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
        return false;
    }
    
    WinHttpReceiveResponse(hRequest, NULL);
    
    // 确保目录存在
    size_t lastSlash = destPath.find_last_of("/\\");
    if (lastSlash != string::npos) {
        CreateDir(destPath.substr(0, lastSlash));
    }
    
    ofstream file(destPath, ios::binary);
    if (!file.is_open()) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
        return false;
    }
    
    vector<char> buffer(65536);
    DWORD bytesRead;
    bool success = true;
    
    while (WinHttpReadData(hRequest, buffer.data(), buffer.size(), &bytesRead) && bytesRead > 0) {
        file.write(buffer.data(), bytesRead);
        if (file.fail()) { success = false; break; }
    }
    
    file.close();
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    
    return success;
}

string HttpGet(const string& url) {
    URL_COMPONENTS urlComp;
    memset(&urlComp, 0, sizeof(urlComp));
    urlComp.dwStructSize = sizeof(urlComp);
    
    char host[256] = {0}, path[2048] = {0};
    urlComp.lpszHostName = host;
    urlComp.lpszUrlPath = path;
    urlComp.dwHostNameLength = 255;
    urlComp.dwUrlPathLength = 2047;
    
    wstring wurl = Utf8ToWide(url);
    if (!WinHttpCrackUrl(wurl.c_str(), url.length(), 0, &urlComp)) {
        return "";
    }
    
    HINTERNET hSession = WinHttpOpen(L"SCL/1.0", 
        WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession) return "";
    
    HINTERNET hConnect = WinHttpConnect(hSession, 
        Utf8ToWide(host).c_str(), urlComp.nPort, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return ""; }
    
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", 
        Utf8ToWide(path).c_str(), NULL, NULL, NULL, 0);
    if (!hRequest) { 
        WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); 
        return ""; 
    }
    
    WinHttpSendRequest(hRequest, NULL, 0, NULL, 0, 0, 0);
    WinHttpReceiveResponse(hRequest, NULL);
    
    vector<char> buffer(65536);
    DWORD bytesRead;
    string result;
    
    while (WinHttpReadData(hRequest, buffer.data(), buffer.size(), &bytesRead) && bytesRead > 0) {
        result.append(buffer.data(), bytesRead);
    }
    
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    
    return result;
}

// ============================================
// JSON解析（简化版）
// ============================================
string JsonGetString(const string& json, const string& key) {
    string search1 = "\"" + key + "\":\"";
    string search2 = "\"" + key + "\": \"";
    
    size_t pos = json.find(search1);
    if (pos == string::npos) pos = json.find(search2);
    if (pos == string::npos) return "";
    
    pos += (json[pos + key.length() + 2] == '"') ? key.length() + 3 : key.length() + 2;
    size_t end = json.find("\"", pos);
    if (end == string::npos) return "";
    return json.substr(pos, end - pos);
}

vector<string> JsonGetArray(const string& json, const string& key) {
    vector<string> result;
    string search = "\"" + key + "\":[";
    size_t start = json.find(search);
    if (start == string::npos) return result;
    
    start += search.length();
    size_t pos = start;
    int depth = 1;
    
    while (pos < json.length() && depth > 0) {
        if (json[pos] == '[') depth++;
        else if (json[pos] == ']') depth--;
        else if (json[pos] == '"' && depth == 1) {
            size_t end = json.find('"', pos + 1);
            if (end != string::npos) {
                result.push_back(json.substr(pos + 1, end - pos - 1));
                pos = end;
            }
        }
        pos++;
    }
    return result;
}

// ============================================
// 版本管理
// ============================================
void LoadVersions() {
    g_versions.clear();
    
    string url = string(MIRRORS[g_currentMirrorIndex]) + "/mc/game/version_manifest_v2.json";
    SetStatus("正在获取版本列表...");
    
    string json = HttpGet(url);
    if (json.empty()) {
        // 尝试下一个镜像
        for (int i = 0; i < 3; i++) {
            g_currentMirrorIndex = (g_currentMirrorIndex + 1) % 3;
            url = string(MIRRORS[g_currentMirrorIndex]) + "/mc/game/version_manifest_v2.json";
            json = HttpGet(url);
            if (!json.empty()) break;
        }
    }
    
    if (json.empty()) {
        SetStatus("获取版本列表失败");
        return;
    }
    
    g_currentMirror = MIRRORS[g_currentMirrorIndex];
    SetStatus(("当前镜像: " + g_currentMirror).c_str());
    
    // 解析版本
    vector<string> ids = JsonGetArray(json, "versions");
    for (const string& id : ids) {
        GameVersion v;
        v.id = id;
        v.installed = FileExists(g_gameDir + "\\versions\\" + id);
        g_versions.push_back(v);
    }
    
    // 填充列表
    SendMessage(g_hwndVersionList, LB_RESETCONTENT, 0, 0);
    for (const auto& v : g_versions) {
        string display = v.id + (v.installed ? " [已安装]" : "");
        SendMessage(g_hwndVersionList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
    }
    
    SetStatus(("已加载 " + to_string(g_versions.size()) + " 个版本").c_str());
}

// ============================================
// 账户管理
// ============================================
void LoadAccounts() {
    g_accounts.clear();
    
    string accountsFile = g_configDir + "\\accounts.txt";
    ifstream file(accountsFile);
    if (file.is_open()) {
        string line;
        while (getline(file, line)) {
            if (line.empty() || line[0] == '#') continue;
            
            Account acc;
            size_t p1 = line.find('|');
            size_t p2 = line.find('|', p1 + 1);
            if (p1 != string::npos && p2 != string::npos) {
                acc.type = line.substr(0, p1);
                acc.username = line.substr(p1 + 1, p2 - p1 - 1);
                acc.uuid = line.substr(p2 + 1);
                g_accounts.push_back(acc);
            }
        }
        file.close();
    }
    
    // 填充列表
    SendMessage(g_hwndAccountList, LB_RESETCONTENT, 0, 0);
    for (const auto& acc : g_accounts) {
        string display = acc.username + " (" + acc.type + ")";
        SendMessage(g_hwndAccountList, LB_ADDSTRING, 0, (LPARAM)display.c_str());
    }
}

void SaveAccounts() {
    CreateDir(g_configDir);
    string accountsFile = g_configDir + "\\accounts.txt";
    ofstream file(accountsFile);
    if (file.is_open()) {
        for (const auto& acc : g_accounts) {
            file << acc.type << "|" << acc.username << "|" << acc.uuid << "\n";
        }
        file.close();
    }
}

void AddOfflineAccount(const string& username) {
    Account acc;
    acc.type = "offline";
    acc.username = username;
    acc.uuid = GenerateUUID(username);
    acc.token = "local_" + acc.uuid;
    
    g_accounts.push_back(acc);
    SaveAccounts();
    LoadAccounts();
    
    SetStatus(("已添加离线账户: " + username).c_str());
}

// ============================================
// 版本下载与安装
// ============================================
bool InstallVersion(const string& versionId) {
    string versionJsonUrl = string(MIRRORS[g_currentMirrorIndex]) + "/version/" + versionId;
    
    SetStatus(("正在安装版本: " + versionId).c_str());
    
    // 创建目录
    string versionDir = g_gameDir + "\\versions\\" + versionId;
    CreateDir(versionDir);
    
    // 下载版本JSON
    string jsonPath = versionDir + "\\" + versionId + ".json";
    if (!HttpDownload(versionJsonUrl, jsonPath)) {
        SetStatus("下载版本JSON失败");
        return false;
    }
    
    // 读取JSON获取下载信息
    ifstream jsonFile(jsonPath);
    stringstream buffer;
    buffer << jsonFile.rdbuf();
    string json = buffer.str();
    jsonFile.close();
    
    // 下载客户端JAR
    string clientUrl = JsonGetString(json, "downloads");
    if (clientUrl.empty()) {
        // 尝试其他方式获取下载链接
        size_t pos = json.find("\"client\":{");
        if (pos != string::npos) {
            size_t urlPos = json.find("\"url\":\"", pos);
            if (urlPos != string::npos) {
                urlPos += 7;
                size_t urlEnd = json.find("\"", urlPos);
                clientUrl = json.substr(urlPos, urlEnd - urlPos);
            }
        }
    }
    
    if (!clientUrl.empty()) {
        string jarPath = versionDir + "\\" + versionId + ".jar";
        // 替换镜像
        clientUrl = ReplaceString(clientUrl, "https://launchermeta.mojang.com", MIRRORS[g_currentMirrorIndex]);
        clientUrl = ReplaceString(clientUrl, "https://resources.download.minecraft.net", 
            string(MIRRORS[g_currentMirrorIndex]) + "/assets");
        
        if (!HttpDownload(clientUrl, jarPath)) {
            SetStatus("下载客户端失败");
            return false;
        }
    }
    
    // 更新列表
    LoadVersions();
    SetStatus(("版本 " + versionId + " 安装完成!").c_str());
    return true;
}

// ============================================
// 游戏启动
// ============================================
bool LaunchGame(const string& versionId, Account* account) {
    if (!account) {
        SetStatus("请先登录账户!");
        return false;
    }
    
    string versionDir = g_gameDir + "\\versions\\" + versionId;
    string versionJson = versionDir + "\\" + versionId + ".json";
    
    if (!FileExists(versionJson)) {
        SetStatus("版本未安装，请先下载!");
        return false;
    }
    
    // 查找Java
    string javaPath = g_gameDir + "\\runtime\\java\\bin\\java.exe";
    if (!FileExists(javaPath)) {
        // 尝试系统Java
        char javaHome[MAX_PATH];
        if (GetEnvironmentVariableA("JAVA_HOME", javaHome, MAX_PATH)) {
            javaPath = string(javaHome) + "\\bin\\java.exe";
        } else {
            // 查找PATH中的java
            char sysPath[MAX_PATH * 10];
            if (GetEnvironmentVariableA("PATH", sysPath, sizeof(sysPath))) {
                string pathStr(sysPath);
                size_t start = 0;
                while ((start = pathStr.find(';', start)) != string::npos) {
                    string dir = pathStr.substr(0, start);
                    string testPath = dir + "\\java.exe";
                    if (FileExists(testPath)) {
                        javaPath = testPath;
                        break;
                    }
                    start++;
                }
            }
        }
    }
    
    if (!FileExists(javaPath)) {
        SetStatus("未找到Java运行环境!");
        MessageBox(g_hwndMain, 
            "未找到Java运行环境!\n\n请安装JDK 21或配置JAVA_HOME环境变量。\n\n下载地址: https://adoptium.net/",
            "错误", MB_ICONERROR);
        return false;
    }
    
    // 构建启动命令
    stringstream cmd;
    cmd << "\"" << javaPath << "\" ";
    cmd << "-Xms512M -Xmx2048M ";
    cmd << "-XX:+UseG1GC ";
    cmd << "-Dminecraft.launcher.brand=SCL ";
    cmd << "-Dminecraft.launcher.version=1.0 ";
    cmd << "-Djava.library.path=\"" << versionDir << "\\natives\" ";
    cmd << "-cp \"" << versionDir << "\\" << versionId << ".jar\" ";
    cmd << "net.minecraft.client.main.Main ";
    cmd << "--username " << account->username << " ";
    cmd << "--uuid " << account->uuid << " ";
    cmd << "--accessToken " << account->token << " ";
    cmd << "--version " << versionId << " ";
    cmd << "--gameDir \"" << g_gameDir << "\" ";
    cmd << "--assetsDir \"" << g_gameDir << "\\assets\" ";
    cmd << "--assetIndex 1.20 ";
    cmd << "--width 854 --height 480";
    
    SetStatus("正在启动游戏...");
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    string cmdStr = cmd.str();
    
    if (CreateProcessA(NULL, &cmdStr[0], NULL, NULL, FALSE, 
        CREATE_NO_WINDOW, NULL, g_gameDir.c_str(), &si, &pi)) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        SetStatus("游戏已启动!");
        return true;
    } else {
        SetStatus("启动游戏失败!");
        return false;
    }
}

// ============================================
// UI更新
// ============================================
void SetStatus(const char* text) {
    if (g_hwndStatus) {
        SetWindowTextA(g_hwndStatus, text);
    }
}

// ============================================
// 窗口回调
// ============================================
INT_PTR CALLBACK DialogProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_INITDIALOG: {
            g_hwndMain = hwnd;
            
            // 初始化路径
            g_configDir = GetAppDataPath();
            g_gameDir = GetMinecraftPath();
            CreateDir(g_configDir);
            CreateDir(g_gameDir);
            
            // 获取控件句柄
            g_hwndVersionList = GetDlgItem(hwnd, ID_LIST_VERSIONS);
            g_hwndAccountList = GetDlgItem(hwnd, 4001);
            g_hwndStatus = GetDlgItem(hwnd, ID_STATIC_STATUS);
            g_hwndProgress = GetDlgItem(hwnd, ID_PROGRESS);
            
            // 设置窗口颜色
            HBRUSH bgBrush = CreateSolidBrush(COLOR_BG);
            SetClassLongPtr(hwnd, GCLP_HBRBACKGROUND, (LONG_PTR)bgBrush);
            
            // 加载数据
            LoadAccounts();
            LoadVersions();
            
            return TRUE;
        }
        
        case WM_COMMAND: {
            int id = LOWORD(wParam);
            int notify = HIWORD(wParam);
            
            if (id == ID_BTN_LOGIN && notify == BN_CLICKED) {
                char username[256] = {0};
                GetDlgItemTextA(hwnd, ID_EDIT_USERNAME, username, sizeof(username));
                
                if (strlen(username) > 0) {
                    AddOfflineAccount(username);
                } else {
                    MessageBox(hwnd, "请输入用户名!", "提示", MB_ICONINFORMATION);
                }
            }
            else if (id == ID_BTN_REFRESH && notify == BN_CLICKED) {
                LoadVersions();
            }
            else if (id == ID_BTN_DOWNLOAD && notify == BN_CLICKED) {
                int sel = SendMessage(g_hwndVersionList, LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    InstallVersion(g_versions[sel].id);
                }
            }
            else if (id == ID_BTN_PLAY && notify == BN_CLICKED) {
                int selVersion = SendMessage(g_hwndVersionList, LB_GETCURSEL, 0, 0);
                int selAccount = SendMessage(g_hwndAccountList, LB_GETCURSEL, 0, 0);
                
                if (selAccount >= 0 && selAccount < (int)g_accounts.size()) {
                    if (selVersion >= 0 && selVersion < (int)g_versions.size()) {
                        LaunchGame(g_versions[selVersion].id, &g_accounts[selAccount]);
                    } else if (!g_versions.empty()) {
                        LaunchGame(g_versions[0].id, &g_accounts[selAccount]);
                    }
                } else {
                    MessageBox(hwnd, "请先添加并选择账户!", "提示", MB_ICONINFORMATION);
                }
            }
            else if (id == ID_BTN_SETTINGS && notify == BN_CLICKED) {
                // 打开设置
                char info[1024];
                sprintf_s(info, sizeof(info),
                    "配置目录: %s\n游戏目录: %s\n当前镜像: %s\n\n"
                    "如需修改游戏目录，请编辑:\n%s\\config.txt",
                    g_configDir.c_str(), g_gameDir.c_str(), 
                    g_currentMirror.c_str(), g_configDir.c_str());
                MessageBoxA(hwnd, info, "设置", MB_ICONINFORMATION);
            }
            else if (id == ID_LIST_VERSIONS && notify == LBN_DBLCLK) {
                // 双击版本列表下载/启动
                int sel = SendMessage(g_hwndVersionList, LB_GETCURSEL, 0, 0);
                if (sel >= 0 && sel < (int)g_versions.size()) {
                    if (!g_versions[sel].installed) {
                        InstallVersion(g_versions[sel].id);
                    }
                }
            }
            return TRUE;
        }
        
        case WM_CTLCOLORDLG:
        case WM_CTLCOLORSTATIC: {
            HDC hdc = (HDC)wParam;
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, COLOR_TEXT);
            return (INT_PTR)CreateSolidBrush(COLOR_BG);
        }
        
        case WM_CLOSE:
            EndDialog(hwnd, 0);
            return TRUE;
    }
    return FALSE;
}

// ============================================
// 入口点
// ============================================
int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, 
    LPWSTR lpCmdLine, int nCmdShow) {
    
    g_hInst = hInstance;
    
    // 初始化通用控件
    INITCOMMONCONTROLSEX icex;
    icex.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icex.dwICC = ICC_LISTVIEW_CLASSES | ICC_PROGRESS_CLASS;
    InitCommonControlsEx(&icex);
    
    // 显示主对话框
    DialogBoxParamW(hInstance, MAKEINTRESOURCE(1000), NULL, DialogProc, 0);
    
    return 0;
}
