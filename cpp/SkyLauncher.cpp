// SCL - Minecraft启动器 (C++ Win32 API版本)
// 无需任何依赖，直接编译成独立EXE

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <tchar.h>
#include <string>
#include <vector>
#include <fstream>
#include <ShlObj.h>
#include <commctrl.h>
#include <Uxtheme.h>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "comctl32.lib")

// ============================================
// 全局变量
// ============================================
HINSTANCE g_hInst;
HWND g_hwndStatus;
HWND g_hwndVersionList;
HWND g_hwndAccountList;
HWND g_hwndProgress;
HWND g_hwndMain;

std::string g_gameDir;
std::string g_selectedVersion;
std::string g_selectedAccount;
std::string g_javaPath;

// ============================================
// 工具函数
// ============================================
std::string GetConfigPath() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, path);
    return std::string(path) + "\\SCL";
}

std::string GetGameDir() {
    char path[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, path);
    return std::string(path) + "\\.minecraft";
}

void CreateDirectoryRecursive(const std::string& path) {
    std::string cmd = "mkdir \"" + path + "\" 2>nul";
    system(cmd.c_str());
}

std::string WideToUtf8(const std::wstring& wstr) {
    if (wstr.empty()) return "";
    int size = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, NULL, 0, NULL, NULL);
    std::string result(size - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, &result[0], size, NULL, NULL);
    return result;
}

std::wstring Utf8ToWide(const std::string& str) {
    if (str.empty()) return L"";
    int size = MultiByteToWideChar(CP_UTF8, 0, &str[0], -1, NULL, 0);
    std::wstring result(size - 1, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], -1, &result[0], size);
    return result;
}

// HTTP下载
bool DownloadFile(const std::string& url, const std::string& dest) {
    URL_COMPONENTS urlComp;
    memset(&urlComp, 0, sizeof(urlComp));
    urlComp.dwStructSize = sizeof(urlComp);
    
    char host[256], path[1024];
    urlComp.lpszHostName = host;
    urlComp.lpszUrlPath = path;
    urlComp.dwHostNameLength = 256;
    urlComp.dwUrlPathLength = 1024;
    
    if (!WinHttpCrackUrl(Utf8ToWide(url).c_str(), url.length(), 0, &urlComp)) {
        return false;
    }
    
    HINTERNET hSession = WinHttpOpen(L"SCL/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0);
    if (!hSession) return false;
    
    HINTERNET hConnect = WinHttpConnect(hSession, Utf8ToWide(host).c_str(), urlComp.nPort, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return false; }
    
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", Utf8ToWide(path).c_str(), 
        NULL, NULL, NULL, urlComp.nScheme == INTERNET_SCHEME_HTTPS ? WINHTTP_FLAG_SECURE : 0);
    if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }
    
    bool result = WinHttpSendRequest(hRequest, NULL, 0, NULL, 0, 0, 0) && WinHttpReceiveResponse(hRequest, NULL);
    
    if (result) {
        std::vector<char> buffer(8192);
        std::ofstream file(dest, std::ios::binary);
        
        DWORD bytesRead;
        while (WinHttpReadData(hRequest, buffer.data(), buffer.size(), &bytesRead) && bytesRead > 0) {
            file.write(buffer.data(), bytesRead);
        }
        file.close();
    }
    
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    
    return result;
}

// 简单的JSON解析
std::string JsonGetString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\":\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) {
        search = "\"" + key + "\": \"";
        pos = json.find(search);
    }
    if (pos == std::string::npos) return "";
    
    pos += search.length();
    size_t end = json.find("\"", pos);
    return json.substr(pos, end - pos);
}

std::vector<std::string> ParseVersionIds(const std::string& json) {
    std::vector<std::string> versions;
    size_t pos = 0;
    
    while ((pos = json.find("\"id\":\"", pos)) != std::string::npos) {
        pos += 6;
        size_t end = json.find("\"", pos);
        if (end == std::string::npos) break;
        versions.push_back(json.substr(pos, end - pos));
    }
    
    return versions;
}

// ============================================
// 窗口消息处理
// ============================================
LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE:
            CreateWindowW(L"Static", L"SCL - Minecraft启动器",
                WS_CHILD | WS_VISIBLE,
                20, 10, 400, 30, hwnd, NULL, g_hInst, NULL);
            return 0;
            
        case WM_SIZE: {
            RECT rect;
            GetClientRect(hwnd, &rect);
            InvalidateRect(hwnd, &rect, TRUE);
            return 0;
        }
        
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

// ============================================
// 主函数
// ============================================
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    g_hInst = hInstance;
    
    // 创建配置目录
    std::string configDir = GetConfigPath();
    CreateDirectoryRecursive(configDir);
    
    // 注册窗口类
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.hbrBackground = CreateSolidBrush(RGB(26, 26, 46));  // 深色背景
    wc.lpszClassName = L"SCL";
    
    if (!RegisterClassExW(&wc)) {
        MessageBoxW(NULL, L"窗口注册失败!", L"错误", MB_ICONERROR);
        return 1;
    }
    
    // 创建主窗口
    HWND hwnd = CreateWindowW(L"SCL", L"SCL - Minecraft启动器",
        WS_OVERLAPPEDWINDOW | WS_VISIBLE,
        CW_USEDEFAULT, CW_USEDEFAULT, 900, 600,
        NULL, NULL, hInstance, NULL);
    
    if (!hwnd) {
        MessageBoxW(NULL, L"窗口创建失败!", L"错误", MB_ICONERROR);
        return 1;
    }
    
    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);
    
    // 消息循环
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    return (int)msg.wParam;
}
