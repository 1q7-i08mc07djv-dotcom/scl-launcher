package com.SCL.data;

import com.google.gson.*;
import com.SCL.utils.*;
import java.io.*;
import java.nio.file.*;

/**
 * 全局配置类
 */
public class Config {
    
    private static final File CONFIG_FILE = new File(System.getProperty("user.home"), ".SCL/config.json");
    
    // 游戏目录
    private String gameDir = OSUtils.getDefaultGameDir();
    
    // Java设置
    private String javaPath = OSUtils.getDefaultJavaPath();
    private int minMemory = 512;
    private int maxMemory = OSUtils.getRecommendedMemory();
    private String jvmArgs = "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200";
    
    // 游戏设置
    private int width = 854;
    private int height = 480;
    private boolean fullscreen = false;
    
    // 下载设置
    private String downloadSource = "BMCLAPI";  // 默认使用BMCLAPI镜像
    private int downloadThreads = 4;
    
    // 镜像Token设置
    private String gitcodeToken = "";  // GitCode认证Token
    private String mcbbsToken = "";    // MCBBS认证Token
    
    // 主题设置
    private String theme = "dark";
    
    // 账户设置
    private String lastAccount;
    
    // Java自动下载
    private boolean autoDownloadJava = true;
    private String preferredJavaVersion = "21";
    
    /**
     * 加载配置
     */
    public static Config load() {
        if (CONFIG_FILE.exists()) {
            try {
                String json = FileUtils.readText(CONFIG_FILE);
                Gson gson = new Gson();
                return gson.fromJson(json, Config.class);
            } catch (Exception e) {
                Logger.error("加载配置失败", e);
            }
        }
        Config config = new Config();
        // 检查是否有保存的token
        config.loadTokens();
        return config;
    }
    
    /**
     * 加载Token配置
     */
    private void loadTokens() {
        File tokensFile = new File(System.getProperty("user.home"), ".SCL/tokens.json");
        if (tokensFile.exists()) {
            try {
                String json = FileUtils.readText(tokensFile);
                JsonObject tokens = new Gson().fromJson(json, JsonObject.class);
                
                if (tokens.has("gitcode")) {
                    gitcodeToken = tokens.get("gitcode").getAsString();
                }
                if (tokens.has("mcbbs")) {
                    mcbbsToken = tokens.get("mcbbs").getAsString();
                }
                
                Logger.info("已加载镜像认证Token");
            } catch (Exception e) {
                Logger.warn("加载Token失败", e);
            }
        }
    }
    
    /**
     * 保存配置
     */
    public void save() {
        try {
            FileUtils.createDir(CONFIG_FILE.getParentFile());
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            String json = gson.toJson(this);
            FileUtils.writeText(CONFIG_FILE, json);
            Logger.info("配置已保存");
        } catch (Exception e) {
            Logger.error("保存配置失败", e);
        }
    }
    
    /**
     * 保存Token配置
     */
    public void saveTokens() {
        try {
            File dir = new File(System.getProperty("user.home"), ".SCL");
            FileUtils.createDir(dir);
            
            JsonObject tokens = new JsonObject();
            if (!gitcodeToken.isEmpty()) {
                tokens.addProperty("gitcode", gitcodeToken);
            }
            if (!mcbbsToken.isEmpty()) {
                tokens.addProperty("mcbbs", mcbbsToken);
            }
            
            String json = new GsonBuilder().setPrettyPrinting().create().toJson(tokens);
            FileUtils.writeText(new File(dir, "tokens.json"), json);
            
            Logger.info("Token已保存");
        } catch (Exception e) {
            Logger.error("保存Token失败", e);
        }
    }
    
    // Getters and Setters
    public String getGameDir() {
        return gameDir;
    }
    
    public void setGameDir(String gameDir) {
        this.gameDir = gameDir;
    }
    
    public String getJavaPath() {
        return javaPath;
    }
    
    public void setJavaPath(String javaPath) {
        this.javaPath = javaPath;
    }
    
    public int getMinMemory() {
        return minMemory;
    }
    
    public void setMinMemory(int minMemory) {
        this.minMemory = minMemory;
    }
    
    public int getMaxMemory() {
        return maxMemory;
    }
    
    public void setMaxMemory(int maxMemory) {
        this.maxMemory = maxMemory;
    }
    
    public String getJvmArgs() {
        return jvmArgs;
    }
    
    public void setJvmArgs(String jvmArgs) {
        this.jvmArgs = jvmArgs;
    }
    
    public int getWidth() {
        return width;
    }
    
    public void setWidth(int width) {
        this.width = width;
    }
    
    public int getHeight() {
        return height;
    }
    
    public void setHeight(int height) {
        this.height = height;
    }
    
    public boolean isFullscreen() {
        return fullscreen;
    }
    
    public void setFullscreen(boolean fullscreen) {
        this.fullscreen = fullscreen;
    }
    
    public String getDownloadSource() {
        return downloadSource;
    }
    
    public void setDownloadSource(String downloadSource) {
        this.downloadSource = downloadSource;
    }
    
    public int getDownloadThreads() {
        return downloadThreads;
    }
    
    public void setDownloadThreads(int downloadThreads) {
        this.downloadThreads = downloadThreads;
    }
    
    public String getGitcodeToken() {
        return gitcodeToken;
    }
    
    public void setGitcodeToken(String gitcodeToken) {
        this.gitcodeToken = gitcodeToken;
        saveTokens();
    }
    
    public String getMcbbsToken() {
        return mcbbsToken;
    }
    
    public void setMcbbsToken(String mcbbsToken) {
        this.mcbbsToken = mcbbsToken;
        saveTokens();
    }
    
    public String getTheme() {
        return theme;
    }
    
    public void setTheme(String theme) {
        this.theme = theme;
    }
    
    public String getLastAccount() {
        return lastAccount;
    }
    
    public void setLastAccount(String lastAccount) {
        this.lastAccount = lastAccount;
    }
    
    public boolean isAutoDownloadJava() {
        return autoDownloadJava;
    }
    
    public void setAutoDownloadJava(boolean autoDownloadJava) {
        this.autoDownloadJava = autoDownloadJava;
    }
    
    public String getPreferredJavaVersion() {
        return preferredJavaVersion;
    }
    
    public void setPreferredJavaVersion(String preferredJavaVersion) {
        this.preferredJavaVersion = preferredJavaVersion;
    }
}
