package com.SCL;

import com.SCL.core.auth.AuthManager;
import com.SCL.core.version.VersionManager;
import com.SCL.core.game.GameLauncher;
import com.SCL.core.java.JavaManager;
import com.SCL.core.download.DownloadManager;
import com.SCL.data.Config;
import com.SCL.utils.Logger;
import com.SCL.utils.FileUtils;
import com.SCL.utils.OSUtils;

/**
 * 启动器主类 - 单例模式
 */
public class Launcher {
    
    private static Launcher instance;
    private Config config;
    private AuthManager authManager;
    private VersionManager versionManager;
    private GameLauncher gameLauncher;
    private JavaManager javaManager;
    private DownloadManager downloadManager;
    private String launcherDir;
    
    private Launcher() {
        // 获取启动器目录
        this.launcherDir = System.getProperty("user.home") + "/.SCL";
    }
    
    public static Launcher getInstance() {
        if (instance == null) {
            instance = new Launcher();
        }
        return instance;
    }
    
    /**
     * 初始化启动器
     */
    public void init() {
        Logger.info("╔══════════════════════════════════════╗");
        Logger.info("║     SCL 启动中...              ║");
        Logger.info("╚══════════════════════════════════════╝");
        
        // 初始化Java管理器（自动下载Java）
        this.javaManager = new JavaManager(launcherDir);
        Logger.info("Java管理器初始化完成");
        
        // 检查并下载Java（如果需要）
        String javaPath = javaManager.getJavaPath();
        if (javaPath != null) {
            Logger.info("Java路径: " + javaPath);
        } else {
            Logger.warn("未找到Java运行环境，部分功能可能受限");
        }
        
        // 初始化配置
        this.config = Config.load();
        Logger.info("配置加载完成");
        
        // 如果配置中的Java路径无效，使用管理器提供的
        if (!new java.io.File(config.getJavaPath()).exists()) {
            if (javaPath != null) {
                config.setJavaPath(javaPath);
                Logger.info("已更新Java路径为: " + javaPath);
            }
        }
        
        // 初始化下载管理器
        this.downloadManager = new DownloadManager();
        Logger.info("下载管理器初始化完成");
        
        // 初始化认证管理器
        this.authManager = new AuthManager();
        Logger.info("认证管理器初始化完成");
        
        // 初始化版本管理器
        this.versionManager = new VersionManager(config.getGameDir());
        Logger.info("版本管理器初始化完成");
        
        // 初始化游戏启动器
        this.gameLauncher = new GameLauncher(config);
        Logger.info("游戏启动器初始化完成");
        
        Logger.info("═══════════════════════════════════════");
        Logger.info("SCL 启动完成!");
        Logger.info("系统: " + OSUtils.OS_NAME);
        Logger.info("Java: " + OSUtils.JAVA_VERSION);
        Logger.info("游戏目录: " + config.getGameDir());
        Logger.info("═══════════════════════════════════════");
    }
    
    // Getters
    public Config getConfig() {
        return config;
    }
    
    public AuthManager getAuthManager() {
        return authManager;
    }
    
    public VersionManager getVersionManager() {
        return versionManager;
    }
    
    public GameLauncher getGameLauncher() {
        return gameLauncher;
    }
    
    public JavaManager getJavaManager() {
        return javaManager;
    }
    
    public DownloadManager getDownloadManager() {
        return downloadManager;
    }
    
    public String getLauncherDir() {
        return launcherDir;
    }
    
    /**
     * 保存配置
     */
    public void saveConfig() {
        config.save();
    }
    
    /**
     * 关闭启动器
     */
    public void shutdown() {
        Logger.info("SCL 正在关闭...");
        saveConfig();
        if (downloadManager != null) {
            downloadManager.shutdown();
        }
        Logger.info("SCL 已关闭");
    }
    
    /**
     * 检查更新
     */
    public void checkForUpdates() {
        Logger.info("检查更新...");
        // TODO: 实现更新检查
        Logger.info("当前版本: 1.0.0 (最新)");
    }
}
