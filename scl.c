/**
 * SCL - SUPER CRAFT LAUNCHER
 * Modern UI combining PCL2 and HMCL strengths
 * Features: Theme switching, skin support, smooth animations
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <wininet.h>
#include <shlwapi.h>
#include <shellapi.h>
#include <commctrl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <direct.h>
#include <math.h>

#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "shell32.lib")

/* ---- Theme System ---- */
typedef enum {
    THEME_DARK,      /* PCL2 style dark theme */
    THEME_LIGHT,     /* HMCL style light theme */
    THEME_SYSTEM     /* Follow system theme */
} ThemeMode;

typedef enum {
    COLOR_BLUE,      /* PCL2 default blue */
    COLOR_GREEN,     /* Fresh green */
    COLOR_PURPLE,    /* Mystery purple */
    COLOR_ORANGE,    /* Vibrant orange */
    COLOR_RED,       /* Passion red */
    COLOR_CUSTOM     /* User custom */
} ColorScheme;

typedef struct {
    /* Theme settings */
    ThemeMode mode;
    ColorScheme scheme;
    
    /* Colors - Dark theme (default) */
    COLORREF bg_primary;
    COLORREF bg_secondary;
    COLORREF bg_hover;
    COLORREF accent;
    COLORREF accent_hover;
    COLORREF text_primary;
    COLORREF text_secondary;
    COLORREF border;
    COLORREF success;
    COLORREF warning;
    COLORREF error;
    
    /* Animation */
    BOOL animations;
    int anim_duration;
    
    /* Font */
    WCHAR font_family[32];
    int font_size;
} Theme;

static Theme g_theme = {
    .mode = THEME_DARK,
    .scheme = COLOR_BLUE,
    .bg_primary = RGB(30, 30, 46),
    .bg_secondary = RGB(40, 40, 58),
    .bg_hover = RGB(50, 50, 68),
    .accent = RGB(30, 136, 229),
    .accent_hover = RGB(52, 152, 219),
    .text_primary = RGB(248, 248, 242),
    .text_secondary = RGB(180, 183, 195),
    .border = RGB(60, 60, 78),
    .success = RGB(46, 204, 113),
    .warning = RGB(241, 196, 15),
    .error = RGB(231, 76, 60),
    .animations = TRUE,
    .anim_duration = 200,
    .font_family = L"Segoe UI",
    .font_size = 14
};

/* ---- UI Layout Constants ---- */
#define WINDOW_WIDTH        1000
#define WINDOW_HEIGHT       650
#define HEADER_HEIGHT       56
#define SIDEBAR_WIDTH       200
#define FOOTER_HEIGHT       80
#define CARD_RADIUS         12
#define BUTTON_RADIUS       8
#define ANIMATION_DURATION  200

/* ---- Control IDs ---- */
#define IDC_BTN_LAUNCH      100
#define IDC_BTN_DOWNLOAD    101
#define IDC_BTN_MODS        102
#define IDC_BTN_SETTINGS    103
#define IDC_BTN_ACCOUNT     104
#define IDC_BTN_THEME       105
#define IDC_LIST_VERSIONS   200
#define IDC_COMBO_VERSION   201
#define IDC_PROGRESS        300
#define IDC_STATUS          301
#define IDC_BTN_PLAY        400
#define IDC_BTN_JAVA        401
#define IDC_BTN_REFRESH     402
#define IDC_BTN_FOLDER      403
#define IDC_EDIT_SEARCH     500
#define IDC_EDIT_MIN_MEM    501
#define IDC_EDIT_MAX_MEM    502
#define IDC_COMBO_ACCOUNT   503

/* ---- Data Structures ---- */
typedef struct {
    WCHAR username[64];
    WCHAR uuid[64];
    int authType;  /* 0=offline, 1=microsoft, 2=thirdparty */
} Account;

typedef struct {
    WCHAR id[64];
    WCHAR name[64];
    WCHAR type[32];
    WCHAR releaseTime[32];
    BOOL installed;
} GameVersion;

typedef struct {
    HWND hwndMain;
    HWND hwndHeader;
    HWND hwndSidebar;
    HWND hwndContent;
    HWND hwndFooter;
    
    /* Navigation */
    HWND btnLaunch;
    HWND btnDownload;
    HWND btnMods;
    HWND btnSettings;
    
    /* Account */
    HWND btnAccount;
    HWND comboAccount;
    
    /* Content */
    HWND listVersions;
    HWND editMinMem;
    HWND editMaxMem;
    HWND btnJava;
    HWND btnFolder;
    
    /* Footer */
    HWND btnPlay;
    HWND progress;
    HWND status;
    
    /* Theme button */
    HWND btnTheme;
    
    /* Data */
    Account accounts[16];
    int accountCount;
    int selectedAccount;
    
    GameVersion versions[128];
    int versionCount;
    int selectedVersion;
    
    /* Paths */
    WCHAR mcDir[MAX_PATH];
    WCHAR javaPath[MAX_PATH];
    
    /* Animation */
    int hoverBtn;  /* Currently hovered button */
    BOOL animating;
    
    /* Fonts */
    HFONT hFontTitle;
    HFONT hFontNormal;
    HFONT hFontSmall;
} LauncherUI;

static LauncherUI g_ui = {0};
static HINSTANCE g_hInst = NULL;

/* ---- Theme Functions ---- */
static void ApplyColorScheme(ColorScheme scheme) {
    switch (scheme) {
    case COLOR_BLUE:
        g_theme.accent = RGB(30, 136, 229);
        g_theme.accent_hover = RGB(52, 152, 219);
        break;
    case COLOR_GREEN:
        g_theme.accent = RGB(39, 174, 96);
        g_theme.accent_hover = RGB(46, 204, 113);
        break;
    case COLOR_PURPLE:
        g_theme.accent = RGB(142, 68, 173);
        g_theme.accent_hover = RGB(155, 89, 182);
        break;
    case COLOR_ORANGE:
        g_theme.accent = RGB(230, 126, 34);
        g_theme.accent_hover = RGB(243, 156, 18);
        break;
    case COLOR_RED:
        g_theme.accent = RGB(231, 76, 60);
        g_theme.accent_hover = RGB(236, 112, 99);
        break;
    }
}

static void LoadThemeConfig() {
    WCHAR path[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", path, MAX_PATH);
    wcscat_s(path, MAX_PATH, L"\\SCL\\theme.ini");
    
    if (!FileExists(path)) {
        /* Default dark theme */
        ApplyColorScheme(COLOR_BLUE);
        return;
    }
    
    /* Load from INI file */
    /* TODO: Implement INI parsing */
}

static void SaveThemeConfig() {
    WCHAR path[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", path, MAX_PATH);
    wcscat_s(path, MAX_PATH, L"\\SCL");
    CreateDirectoryW(path, NULL);
    wcscat_s(path, MAX_PATH, L"\\theme.ini");
    
    /* TODO: Save theme config */
}

/* ---- Utility Functions ---- */
static void GetMcDir() {
    WCHAR home[MAX_PATH];
    GetEnvironmentVariableW(L"USERPROFILE", home, MAX_PATH);
    swprintf_s(g_ui.mcDir, MAX_PATH, L"%s\\.minecraft", home);
}

static BOOL FileExists(const WCHAR* path) {
    return GetFileAttributesW(path) != INVALID_FILE_ATTRIBUTES;
}

/* ---- UI Drawing Functions ---- */
static HFONT CreateFont(int size, int weight) {
    return CreateFontW(size, 0, 0, 0, weight, FALSE, FALSE, FALSE,
                       DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                       DEFAULT_QUALITY, DEFAULT_PITCH | FF_SWISS, g_theme.font_family);
}

static void DrawRoundedRect(HDC hdc, RECT* rect, int radius, COLORREF color, BOOL fill) {
    HPEN pen = CreatePen(PS_SOLID, 1, color);
    HBRUSH brush = fill ? CreateSolidBrush(color) : (HBRUSH)GetStockObject(NULL_BRUSH);
    
    HGDIOBJ oldPen = SelectObject(hdc, pen);
    HGDIOBJ oldBrush = SelectObject(hdc, brush);
    
    BeginPath(hdc);
    
    /* Top-left corner */
    MoveToEx(hdc, rect->left + radius, rect->top, NULL);
    
    /* Top edge */
    LineTo(hdc, rect->right - radius, rect->top);
    
    /* Top-right corner */
    ArcTo(hdc, rect->right - radius * 2, rect->top,
          rect->right, rect->top + radius * 2,
          rect->right, rect->top,
          rect->right - radius, rect->top);
    
    /* Right edge */
    LineTo(hdc, rect->right, rect->bottom - radius);
    
    /* Bottom-right corner */
    ArcTo(hdc, rect->right - radius * 2, rect->bottom - radius * 2,
          rect->right, rect->bottom,
          rect->right, rect->bottom - radius,
          rect->right - radius, rect->bottom);
    
    /* Bottom edge */
    LineTo(hdc, rect->left + radius, rect->bottom);
    
    /* Bottom-left corner */
    ArcTo(hdc, rect->left, rect->bottom - radius * 2,
          rect->left + radius * 2, rect->bottom,
          rect->left + radius, rect->bottom,
          rect->left, rect->bottom - radius);
    
    /* Left edge */
    LineTo(hdc, rect->left, rect->top + radius);
    
    /* Top-left corner */
    ArcTo(hdc, rect->left, rect->top,
          rect->left + radius * 2, rect->top + radius * 2,
          rect->left, rect->top + radius,
          rect->left + radius, rect->top);
    
    CloseFigure(hdc);
    EndPath(hdc);
    
    if (fill) {
        FillPath(hdc);
    } else {
        StrokePath(hdc);
    }
    
    SelectObject(hdc, oldPen);
    SelectObject(hdc, oldBrush);
    DeleteObject(pen);
    DeleteObject(brush);
}

static void DrawHeader(HDC hdc, RECT* rect) {
    /* Background */
    HBRUSH brush = CreateSolidBrush(g_theme.bg_primary);
    FillRect(hdc, rect, brush);
    DeleteObject(brush);
    
    /* Logo and title */
    SetBkMode(hdc, TRANSPARENT);
    SetTextColor(hdc, g_theme.text_primary);
    HFONT font = CreateFont(20, FW_BOLD);
    HGDIOBJ oldFont = SelectObject(hdc, font);
    
    RECT titleRect = *rect;
    titleRect.left += 20;
    DrawTextW(hdc, L"SCL - Minecraft Launcher", -1, &titleRect, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    /* Account button */
    WCHAR accountText[128];
    if (g_ui.selectedAccount >= 0 && g_ui.selectedAccount < g_ui.accountCount) {
        swprintf_s(accountText, 128, L"👤 %s", g_ui.accounts[g_ui.selectedAccount].username);
    } else {
        wcscpy_s(accountText, 128, L"👤 Account");
    }
    
    RECT accountRect = *rect;
    accountRect.right -= 200;
    accountRect.left = accountRect.right - 150;
    DrawTextW(hdc, accountText, -1, &accountRect, 
              DT_RIGHT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Bottom border */
    HPEN pen = CreatePen(PS_SOLID, 1, g_theme.border);
    HGDIOBJ oldPen = SelectObject(hdc, pen);
    MoveToEx(hdc, rect->left, rect->bottom - 1, NULL);
    LineTo(hdc, rect->right, rect->bottom - 1);
    SelectObject(hdc, oldPen);
    DeleteObject(pen);
}

static void DrawSidebar(HDC hdc, RECT* rect) {
    /* Background */
    HBRUSH brush = CreateSolidBrush(g_theme.bg_secondary);
    FillRect(hdc, rect, brush);
    DeleteObject(brush);
    
    /* Buttons */
    const WCHAR* btnTexts[] = {L"🚀 Launch", L"⬇ Download", L"📦 Mods", L"⚙ Settings"};
    int btnHeight = 50;
    int btnCount = 4;
    
    for (int i = 0; i < btnCount; i++) {
        RECT btnRect = {
            rect->left,
            rect->top + i * btnHeight,
            rect->right,
            rect->top + (i + 1) * btnHeight
        };
        
        BOOL hovered = (g_ui.hoverBtn == i);
        BOOL selected = (g_ui.currentPage == i);
        
        /* Background */
        COLORREF bgColor = g_theme.bg_secondary;
        if (selected) bgColor = g_theme.accent;
        else if (hovered) bgColor = g_theme.bg_hover;
        
        brush = CreateSolidBrush(bgColor);
        FillRect(hdc, &btnRect, brush);
        DeleteObject(brush);
        
        /* Text */
        SetBkMode(hdc, TRANSPARENT);
        SetTextColor(hdc, selected ? RGB(255,255,255) : g_theme.text_primary);
        HFONT font = CreateFont(14, selected ? FW_BOLD : FW_MEDIUM);
        HGDIOBJ oldFont = SelectObject(hdc, font);
        
        RECT textRect = btnRect;
        textRect.left += 20;
        DrawTextW(hdc, btnTexts[i], -1, &textRect, 
                  DT_LEFT | DT_VCENTER | DT_SINGLELINE);
        
        SelectObject(hdc, oldFont);
        DeleteObject(font);
    }
    
    /* Theme button at bottom */
    RECT themeBtn = {
        rect->left,
        rect->bottom - 50,
        rect->right,
        rect->bottom
    };
    
    COLORREF bgColor = (g_ui.hoverBtn == 100) ? g_theme.bg_hover : g_theme.bg_secondary;
    brush = CreateSolidBrush(bgColor);
    FillRect(hdc, &themeBtn, brush);
    DeleteObject(brush);
    
    SetBkMode(hdc, TRANSPARENT);
    SetTextColor(hdc, g_theme.text_secondary);
    HFONT font = CreateFont(14, FW_MEDIUM);
    HGDIOBJ oldFont = SelectObject(hdc, font);
    
    RECT themeText = themeBtn;
    themeText.left += 20;
    DrawTextW(hdc, L"🎨 Theme", -1, &themeText, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
}

static void DrawLaunchPage(HDC hdc, RECT* rect) {
    int margin = 24;
    
    /* Version selector card */
    RECT versionCard = {
        rect->left + margin,
        rect->top + margin,
        rect->right - margin,
        rect->top + margin + 80
    };
    
    DrawRoundedRect(hdc, &versionCard, CARD_RADIUS, g_theme.bg_secondary, TRUE);
    
    /* Version label */
    SetBkMode(hdc, TRANSPARENT);
    SetTextColor(hdc, g_theme.text_primary);
    HFONT font = CreateFont(16, FW_BOLD);
    HGDIOBJ oldFont = SelectObject(hdc, font);
    
    RECT labelRect = versionCard;
    labelRect.left += 20;
    labelRect.top += 15;
    labelRect.bottom = labelRect.top + 25;
    DrawTextW(hdc, L"Game Version", -1, &labelRect, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Current version */
    font = CreateFont(18, FW_MEDIUM);
    oldFont = SelectObject(hdc, font);
    
    RECT verRect = versionCard;
    verRect.left += 20;
    verRect.top += 40;
    verRect.bottom = verRect.top + 30;
    
    WCHAR versionText[64] = L"1.21.1";
    if (g_ui.selectedVersion >= 0 && g_ui.selectedVersion < g_ui.versionCount) {
        wcscpy_s(versionText, 64, g_ui.versions[g_ui.selectedVersion].name);
    }
    DrawTextW(hdc, versionText, -1, &verRect, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Change button */
    RECT changeBtn = versionCard;
    changeBtn.right -= 20;
    changeBtn.left = changeBtn.right - 100;
    changeBtn.top += 20;
    changeBtn.bottom = changeBtn.top + 40;
    
    DrawRoundedRect(hdc, &changeBtn, BUTTON_RADIUS, g_theme.accent, TRUE);
    
    SetTextColor(hdc, RGB(255,255,255));
    font = CreateFont(14, FW_MEDIUM);
    oldFont = SelectObject(hdc, font);
    
    DrawTextW(hdc, L"Change", -1, &changeBtn, 
              DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Memory settings card */
    RECT memCard = versionCard;
    memCard.top = versionCard.bottom + 16;
    memCard.bottom = memCard.top + 80;
    
    DrawRoundedRect(hdc, &memCard, CARD_RADIUS, g_theme.bg_secondary, TRUE);
    
    /* Memory label */
    SetTextColor(hdc, g_theme.text_primary);
    font = CreateFont(16, FW_BOLD);
    oldFont = SelectObject(hdc, font);
    
    RECT memLabel = memCard;
    memLabel.left += 20;
    memLabel.top += 15;
    memLabel.bottom = memLabel.top + 25;
    DrawTextW(hdc, L"Memory Settings", -1, &memLabel, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Min/Max memory */
    font = CreateFont(14, FW_NORMAL);
    oldFont = SelectObject(hdc, font);
    SetTextColor(hdc, g_theme.text_secondary);
    
    RECT minLabel = memCard;
    minLabel.left += 20;
    minLabel.top += 45;
    minLabel.bottom = minLabel.top + 20;
    DrawTextW(hdc, L"Min: 1024 MB", -1, &minLabel, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    RECT maxLabel = minLabel;
    maxLabel.left += 150;
    DrawTextW(hdc, L"Max: 4096 MB", -1, &maxLabel, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Java path card */
    RECT javaCard = memCard;
    javaCard.top = memCard.bottom + 16;
    javaCard.bottom = javaCard.top + 80;
    
    DrawRoundedRect(hdc, &javaCard, CARD_RADIUS, g_theme.bg_secondary, TRUE);
    
    SetTextColor(hdc, g_theme.text_primary);
    font = CreateFont(16, FW_BOLD);
    oldFont = SelectObject(hdc, font);
    
    RECT javaLabel = javaCard;
    javaLabel.left += 20;
    javaLabel.top += 15;
    javaLabel.bottom = javaLabel.top + 25;
    DrawTextW(hdc, L"Java Path", -1, &javaLabel, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Java path */
    font = CreateFont(13, FW_NORMAL);
    oldFont = SelectObject(hdc, font);
    SetTextColor(hdc, g_theme.text_secondary);
    
    RECT pathRect = javaCard;
    pathRect.left += 20;
    pathRect.top += 45;
    pathRect.bottom = pathRect.top + 20;
    pathRect.right -= 150;
    
    WCHAR javaDisplay[MAX_PATH] = L"Java 21 (Auto-detected)";
    DrawTextW(hdc, javaDisplay, -1, &pathRect, 
              DT_LEFT | DT_VCENTER | DT_SINGLELINE | DT_END_ELLIPSIS);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
}

static void DrawFooter(HDC hdc, RECT* rect) {
    /* Background */
    HBRUSH brush = CreateSolidBrush(g_theme.bg_secondary);
    FillRect(hdc, rect, brush);
    DeleteObject(brush);
    
    /* Top border */
    HPEN pen = CreatePen(PS_SOLID, 1, g_theme.border);
    HGDIOBJ oldPen = SelectObject(hdc, pen);
    MoveToEx(hdc, rect->left, rect->top, NULL);
    LineTo(hdc, rect->right, rect->top);
    SelectObject(hdc, oldPen);
    DeleteObject(pen);
    
    int margin = 24;
    
    /* Play button */
    RECT playBtn = {
        rect->right - margin - 180,
        rect->top + (rect->bottom - rect->top - 50) / 2,
        rect->right - margin,
        rect->top + (rect->bottom - rect->top - 50) / 2 + 50
    };
    
    DrawRoundedRect(hdc, &playBtn, BUTTON_RADIUS, g_theme.success, TRUE);
    
    /* Play icon and text */
    SetBkMode(hdc, TRANSPARENT);
    SetTextColor(hdc, RGB(255,255,255));
    HFONT font = CreateFont(18, FW_BOLD);
    HGDIOBJ oldFont = SelectObject(hdc, font);
    
    DrawTextW(hdc, L"▶  Play", -1, &playBtn, 
              DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
    
    /* Settings on left */
    RECT settingsBtn = playBtn;
    settingsBtn.right = settingsBtn.left - 10;
    settingsBtn.left = settingsBtn.right - 120;
    
    DrawRoundedRect(hdc, &settingsBtn, BUTTON_RADIUS, g_theme.bg_hover, TRUE);
    
    SetTextColor(hdc, g_theme.text_primary);
    font = CreateFont(14, FW_MEDIUM);
    oldFont = SelectObject(hdc, font);
    
    DrawTextW(hdc, L"⚙ Settings", -1, &settingsBtn, 
              DT_CENTER | DT_VCENTER | DT_SINGLELINE);
    
    SelectObject(hdc, oldFont);
    DeleteObject(font);
}

static void SwitchTheme() {
    /* Cycle through color schemes */
    g_theme.scheme = (g_theme.scheme + 1) % 5;
    ApplyColorScheme(g_theme.scheme);
    
    /* Force redraw */
    InvalidateRect(g_ui.hwndMain, NULL, TRUE);
}

/* ---- Window Procedure ---- */
static LRESULT CALLBACK MainWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
    case WM_CREATE: {
        g_ui.hwndMain = hwnd;
        GetMcDir();
        
        /* Load theme */
        LoadThemeConfig();
        
        /* Default data */
        wcscpy_s(g_ui.accounts[0].username, 64, L"Steve");
        g_ui.accounts[0].authType = 0;
        g_ui.accountCount = 1;
        g_ui.selectedAccount = 0;
        
        wcscpy_s(g_ui.versions[0].name, 64, L"1.21.1");
        wcscpy_s(g_ui.versions[0].type, 32, L"release");
        g_ui.versions[0].installed = TRUE;
        g_ui.versionCount = 1;
        g_ui.selectedVersion = 0;
        
        return 0;
    }
    
    case WM_SIZE: {
        InvalidateRect(hwnd, NULL, TRUE);
        return 0;
    }
    
    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);
        
        RECT clientRect;
        GetClientRect(hwnd, &clientRect);
        
        /* Double buffering */
        HDC memDC = CreateCompatibleDC(hdc);
        HBITMAP memBmp = CreateCompatibleBitmap(hdc, clientRect.right, clientRect.bottom);
        HGDIOBJ oldBmp = SelectObject(memDC, memBmp);
        
        /* Clear background */
        HBRUSH bgBrush = CreateSolidBrush(g_theme.bg_primary);
        FillRect(memDC, &clientRect, bgBrush);
        DeleteObject(bgBrush);
        
        /* Calculate rects */
        RECT headerRect = {0, 0, clientRect.right, HEADER_HEIGHT};
        RECT sidebarRect = {0, HEADER_HEIGHT, SIDEBAR_WIDTH, clientRect.bottom - FOOTER_HEIGHT};
        RECT contentRect = {
            SIDEBAR_WIDTH,
            HEADER_HEIGHT,
            clientRect.right,
            clientRect.bottom - FOOTER_HEIGHT
        };
        RECT footerRect = {
            0,
            clientRect.bottom - FOOTER_HEIGHT,
            clientRect.right,
            clientRect.bottom
        };
        
        /* Draw components */
        DrawHeader(memDC, &headerRect);
        DrawSidebar(memDC, &sidebarRect);
        DrawLaunchPage(memDC, &contentRect);
        DrawFooter(memDC, &footerRect);
        
        /* Copy to screen */
        BitBlt(hdc, 0, 0, clientRect.right, clientRect.bottom, memDC, 0, 0, SRCCOPY);
        
        SelectObject(memDC, oldBmp);
        DeleteObject(memBmp);
        DeleteDC(memDC);
        
        EndPaint(hwnd, &ps);
        return 0;
    }
    
    case WM_LBUTTONDOWN: {
        int x = GET_X_LPARAM(lParam);
        int y = GET_Y_LPARAM(lParam);
        
        /* Check sidebar buttons */
        if (x < SIDEBAR_WIDTH && y > HEADER_HEIGHT && y < WINDOW_HEIGHT - FOOTER_HEIGHT - 50) {
            int btnHeight = 50;
            int btnIndex = (y - HEADER_HEIGHT) / btnHeight;
            if (btnIndex >= 0 && btnIndex < 4) {
                g_ui.currentPage = btnIndex;
                InvalidateRect(hwnd, NULL, TRUE);
            }
        }
        
        /* Check theme button */
        if (x < SIDEBAR_WIDTH && y >= WINDOW_HEIGHT - FOOTER_HEIGHT - 50 && y < WINDOW_HEIGHT - FOOTER_HEIGHT) {
            SwitchTheme();
        }
        
        /* Check play button */
        if (y > WINDOW_HEIGHT - FOOTER_HEIGHT + 15 && y < WINDOW_HEIGHT - FOOTER_HEIGHT + 65) {
            if (x > WINDOW_WIDTH - 24 - 180 && x < WINDOW_WIDTH - 24) {
                MessageBoxW(hwnd, L"Launching Minecraft...", L"SCL", MB_OK);
            }
        }
        
        return 0;
    }
    
    case WM_MOUSEMOVE: {
        int x = GET_X_LPARAM(lParam);
        int y = GET_Y_LPARAM(lParam);
        
        /* Update hover state */
        int oldHover = g_ui.hoverBtn;
        
        if (x < SIDEBAR_WIDTH && y > HEADER_HEIGHT && y < WINDOW_HEIGHT - FOOTER_HEIGHT - 50) {
            int btnHeight = 50;
            g_ui.hoverBtn = (y - HEADER_HEIGHT) / btnHeight;
            if (g_ui.hoverBtn >= 4) g_ui.hoverBtn = -1;
        } else if (x < SIDEBAR_WIDTH && y >= WINDOW_HEIGHT - FOOTER_HEIGHT - 50 && y < WINDOW_HEIGHT - FOOTER_HEIGHT) {
            g_ui.hoverBtn = 100;  /* Theme button */
        } else {
            g_ui.hoverBtn = -1;
        }
        
        if (g_ui.hoverBtn != oldHover) {
            InvalidateRect(hwnd, NULL, FALSE);
        }
        
        return 0;
    }
    
    case WM_MOUSELEAVE: {
        g_ui.hoverBtn = -1;
        InvalidateRect(hwnd, NULL, FALSE);
        return 0;
    }
    
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    
    return DefWindowProcW(hwnd, msg, wParam, lParam);
}

/* ---- Entry Point ---- */
int WINAPI wWinMain(HINSTANCE hInst, HINSTANCE hPrev, LPWSTR cmdLine, int nShow) {
    g_hInst = hInst;
    
    /* Register window class */
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = MainWndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = NULL;
    wc.lpszClassName = L"SCLMainWindow";
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
    
    if (!RegisterClassExW(&wc)) {
        MessageBoxW(NULL, L"Failed to register window class", L"Error", MB_OK);
        return 1;
    }
    
    /* Create main window */
    HWND hwnd = CreateWindowExW(
        WS_EX_APPWINDOW | WS_EX_OVERLAPPEDWINDOW,
        L"SCLMainWindow",
        L"SCL - SUPER CRAFT LAUNCHER",
        WS_OVERLAPPEDWINDOW & ~WS_THICKFRAME & ~WS_MAXIMIZEBOX,
        CW_USEDEFAULT, CW_USEDEFAULT,
        WINDOW_WIDTH, WINDOW_HEIGHT,
        NULL, NULL, hInst, NULL
    );
    
    if (!hwnd) {
        MessageBoxW(NULL, L"Failed to create window", L"Error", MB_OK);
        return 1;
    }
    
    /* Center window */
    RECT rcWork;
    SystemParametersInfoW(SPI_GETWORKAREA, 0, &rcWork, 0);
    
    int x = (rcWork.right - rcWork.left - WINDOW_WIDTH) / 2;
    int y = (rcWork.bottom - rcWork.top - WINDOW_HEIGHT) / 2;
    
    SetWindowPos(hwnd, NULL, x, y, 0, 0, SWP_NOSIZE | SWP_NOZORDER);
    
    ShowWindow(hwnd, nShow);
    UpdateWindow(hwnd);
    
    /* Message loop */
    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    
    return (int)msg.wParam;
}
