package com.SCL.core.version;

import com.SCL.data.*;
import com.SCL.core.download.DownloadManager;
import com.SCL.utils.*;
import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * 版本管理器 - 支持多镜像下载
 */
public class VersionManager {
    
    // 版本列表URL（多个源）
    private static final String[][] VERSION_LIST_URLS = {
        {"官方", "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"},
        {"BMCLAPI", "https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json"},
        {"MCBBS", "https://download.mcbbs.net/mc/game/version_manifest_v2.json"},
        {"阿里云", "https://mirrors.aliyun.com/minecraft/mc/game/version_manifest_v2.json"}
    };
    
    private File gameDir;
    private DownloadManager downloadManager;
    private List<GameVersion> versions = new ArrayList<>();
    private Map<String, GameVersion> versionCache = new HashMap<>();
    
    public VersionManager(String gameDir) {
        this.gameDir = new File(gameDir);
        this.downloadManager = new DownloadManager();
    }
    
    /**
     * 获取版本列表
     */
    public List<GameVersion> getVersions() {
        return new ArrayList<>(versions);
    }
    
    /**
     * 刷新版本列表（支持多源）
     */
    public void refreshVersions() {
        String json = null;
        String usedSource = null;
        
        // 尝试多个源
        for (String[] source : VERSION_LIST_URLS) {
            try {
                Logger.info("尝试从 " + source[0] + " 获取版本列表...");
                json = HttpClient.get(source[1]);
                usedSource = source[0];
                break;
            } catch (Exception e) {
                Logger.warn(source[0] + " 不可用: " + e.getMessage());
            }
        }
        
        // 如果全部失败，尝试备用源
        if (json == null) {
            try {
                Logger.info("尝试备用数据源...");
                json = getFallbackVersionList();
                usedSource = "备用源";
            } catch (Exception e) {
                Logger.error("无法获取版本列表", e);
                return;
            }
        }
        
        Logger.info("从 " + usedSource + " 获取到版本列表");
        
        try {
            JsonObject root = new Gson().fromJson(json, JsonObject.class);
            JsonArray versionsArray = root.getAsJsonArray("versions");
            
            versions.clear();
            for (JsonElement element : versionsArray) {
                JsonObject obj = element.getAsJsonObject();
                GameVersion version = new GameVersion();
                version.setId(obj.get("id").getAsString());
                version.setType(obj.get("type").getAsString());
                version.setUrl(obj.get("url").getAsString());
                version.setTime(obj.has("time") ? obj.get("time").getAsString() : "");
                version.setReleaseTime(obj.has("releaseTime") ? obj.get("releaseTime").getAsString() : "");
                
                // 检查是否已安装
                File versionDir = new File(gameDir, "versions/" + version.getId());
                if (versionDir.exists()) {
                    version.setInstalled(true);
                    version.setInstallPath(versionDir.getAbsolutePath());
                }
                
                versions.add(version);
                versionCache.put(version.getId(), version);
            }
            
            Logger.info("已加载 " + versions.size() + " 个版本");
        } catch (Exception e) {
            Logger.error("解析版本列表失败", e);
        }
    }
    
    /**
     * 备用版本列表（内置最小数据）
     */
    private String getFallbackVersionList() {
        // 返回一个内置的版本列表
        return "{\"versions\":["
            + "{\"id\":\"1.21\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.21\",\"releaseTime\":\"2024-06-07T12:00:00+00:00\"},"
            + "{\"id\":\"1.20.4\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.20.4\",\"releaseTime\":\"2024-02-06T14:00:00+00:00\"},"
            + "{\"id\":\"1.20.2\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.20.2\",\"releaseTime\":\"2023-06-12T14:00:00+00:00\"},"
            + "{\"id\":\"1.19.4\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.19.4\",\"releaseTime\":\"2023-03-14T16:00:00+00:00\"},"
            + "{\"id\":\"1.18.2\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.18.2\",\"releaseTime\":\"2022-02-28T14:00:00+00:00\"},"
            + "{\"id\":\"1.16.5\",\"type\":\"release\",\"url\":\"https://bmclapi2.bangbang93.com/version/1.16.5\",\"releaseTime\":\"2021-01-15T14:00:00+00:00\"}"
            + "]}";
    }
    
    /**
     * 获取版本详细信息
     */
    public GameVersion getVersionInfo(String versionId) {
        GameVersion cached = versionCache.get(versionId);
        if (cached == null) {
            refreshVersions();
            cached = versionCache.get(versionId);
        }
        
        if (cached != null && !cached.isInstalled()) {
            try {
                Logger.info("正在获取版本 " + versionId + " 详情...");
                String json = downloadFromMirror(cached.getUrl());
                GameVersion detail = new Gson().fromJson(json, GameVersion.class);
                
                // 合并信息
                detail.setInstalled(cached.isInstalled());
                detail.setInstallPath(cached.getInstallPath());
                versionCache.put(versionId, detail);
                
                return detail;
            } catch (Exception e) {
                Logger.error("获取版本详情失败", e);
            }
        }
        
        return cached;
    }
    
    /**
     * 从镜像下载
     */
    private String downloadFromMirror(String officialUrl) throws IOException {
        // 尝试多个镜像源
        String[] mirrors = {
            officialUrl.replace("https://launchermeta.mojang.com", "https://bmclapi2.bangbang93.com"),
            officialUrl.replace("https://launchermeta.mojang.com", "https://download.mcbbs.net"),
            officialUrl.replace("https://launchermeta.mojang.com", "https://mirrors.aliyun.com/minecraft")
        };
        
        for (String mirror : mirrors) {
            try {
                return HttpClient.get(mirror);
            } catch (Exception e) {
                // 尝试下一个
            }
        }
        
        // 回退到官方
        return HttpClient.get(officialUrl);
    }
    
    /**
     * 安装版本（使用镜像加速）
     */
    public void installVersion(String versionId, DownloadProgressListener listener) {
        try {
            GameVersion version = getVersionInfo(versionId);
            if (version == null) {
                Logger.error("版本不存在: " + versionId);
                if (listener != null) listener.onError("版本不存在");
                return;
            }
            
            Logger.info("开始安装版本: " + versionId);
            
            // 创建版本目录
            File versionDir = new File(gameDir, "versions/" + versionId);
            FileUtils.createDir(versionDir);
            
            // 下载版本JSON（从镜像）
            File versionJson = new File(versionDir, versionId + ".json");
            downloadWithMirror(version.getUrl(), versionJson, "版本配置", listener);
            
            // 读取JSON获取下载信息
            String versionJsonStr = FileUtils.readText(versionJson);
            JsonObject versionData = new Gson().fromJson(versionJsonStr, JsonObject.class);
            
            // 下载客户端JAR
            if (versionData.has("downloads")) {
                JsonObject downloads = versionData.getAsJsonObject("downloads");
                if (downloads.has("client")) {
                    JsonObject client = downloads.getAsJsonObject("client");
                    String jarUrl = client.get("url").getAsString();
                    File clientJar = new File(versionDir, versionId + ".jar");
                    downloadWithMirror(jarUrl, clientJar, "客户端", listener);
                }
            }
            
            // 下载依赖库
            if (versionData.has("libraries")) {
                downloadLibraries(versionData.getAsJsonArray("libraries"), listener);
            }
            
            // 下载资源索引
            if (versionData.has("assetIndex")) {
                downloadAssetIndex(versionData.getAsJsonObject("assetIndex"), listener);
            }
            
            // 创建版本标记文件
            version.setInstalled(true);
            version.setInstallPath(versionDir.getAbsolutePath());
            
            Logger.info("版本安装完成: " + versionId);
            
            if (listener != null) {
                listener.onComplete(versionId);
            }
        } catch (Exception e) {
            Logger.error("安装版本失败: " + versionId, e);
            if (listener != null) {
                listener.onError(e.getMessage());
            }
        }
    }
    
    /**
     * 使用镜像下载
     */
    private void downloadWithMirror(String officialUrl, File dest, String name, DownloadProgressListener listener) throws IOException {
        // 构建镜像URL
        String[] mirrors = {
            officialUrl.replace("https://launchermeta.mojang.com", "https://bmclapi2.bangbang93.com")
                       .replace("https://resources.download.minecraft.net", "https://bmclapi2.bangbang93.com/assets"),
            officialUrl.replace("https://launchermeta.mojang.com", "https://download.mcbbs.net")
                       .replace("https://resources.download.minecraft.net", "https://download.mcbbs.net/assets"),
            officialUrl.replace("https://launchermeta.mojang.com", "https://mirrors.aliyun.com/minecraft")
                       .replace("https://resources.download.minecraft.net", "https://mirrors.aliyun.com/minecraft/assets")
        };
        
        for (int i = 0; i < mirrors.length; i++) {
            try {
                Logger.info("从镜像 " + (i + 1) + " 下载 " + name + "...");
                HttpClient.downloadSync(mirrors[i], dest);
                Logger.info(name + " 下载完成");
                return;
            } catch (Exception e) {
                Logger.warn("镜像 " + (i + 1) + " 失败: " + e.getMessage());
            }
        }
        
        // 回退到官方
        Logger.info("回退到官方源下载...");
        HttpClient.downloadSync(officialUrl, dest);
    }
    
    /**
     * 下载依赖库
     */
    private void downloadLibraries(JsonArray libraries, DownloadProgressListener listener) {
        File libsDir = new File(gameDir, "libraries");
        int total = libraries.size();
        int current = 0;
        
        for (JsonElement element : libraries) {
            current++;
            JsonObject lib = element.getAsJsonObject();
            
            try {
                String name = lib.get("name").getAsString();
                if (listener != null) {
                    listener.onProgress(current * 100 / total, name);
                }
                
                // 解析下载信息
                if (lib.has("downloads")) {
                    JsonObject downloads = lib.getAsJsonObject("downloads");
                    if (downloads.has("artifact")) {
                        JsonObject artifact = downloads.getAsJsonObject("artifact");
                        String url = artifact.get("url").getAsString();
                        String path = artifact.get("path").getAsString();
                        
                        File libFile = new File(libsDir, path);
                        if (!libFile.exists()) {
                            FileUtils.createDir(libFile.getParentFile());
                            downloadWithMirror(url, libFile, name, null);
                        }
                    }
                }
            } catch (Exception e) {
                Logger.warn("下载库失败: " + e.getMessage());
            }
        }
    }
    
    /**
     * 下载资源索引
     */
    private void downloadAssetIndex(JsonObject assetIndex, DownloadProgressListener listener) {
        try {
            String url = assetIndex.get("url").getAsString();
            File assetsDir = new File(gameDir, "assets");
            File indexesDir = new File(assetsDir, "indexes");
            String id = assetIndex.get("id").getAsString();
            
            File indexFile = new File(indexesDir, id + ".json");
            downloadWithMirror(url, indexFile, "资源索引", listener);
        } catch (Exception e) {
            Logger.warn("下载资源索引失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除版本
     */
    public void deleteVersion(String versionId) {
        File versionDir = new File(gameDir, "versions/" + versionId);
        if (versionDir.exists()) {
            FileUtils.deleteDir(versionDir);
            Logger.info("已删除版本: " + versionId);
            
            GameVersion version = versionCache.get(versionId);
            if (version != null) {
                version.setInstalled(false);
            }
        }
    }
    
    /**
     * 检查版本是否已安装
     */
    public boolean isInstalled(String versionId) {
        File versionDir = new File(gameDir, "versions/" + versionId);
        return versionDir.exists();
    }
    
    /**
     * 获取已安装的版本列表
     */
    public List<GameVersion> getInstalledVersions() {
        List<GameVersion> installed = new ArrayList<>();
        for (GameVersion version : versions) {
            if (version.isInstalled()) {
                installed.add(version);
            }
        }
        return installed;
    }
    
    /**
     * 设置下载源
     */
    public void setDownloadSource(DownloadManager.DownloadSource source) {
        downloadManager.setDownloadSource(source);
    }
    
    /**
     * 下载进度监听器
     */
    public interface DownloadProgressListener {
        void onProgress(int percentage, String currentFile);
        void onComplete(String versionId);
        void onError(String error);
    }
}
