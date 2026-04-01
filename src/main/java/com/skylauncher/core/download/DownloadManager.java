package com.SCL.core.download;

import com.SCL.utils.*;
import com.SCL.utils.FileUtils;
import okhttp3.*;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * 下载管理器 - 支持多源镜像和断点续传
 */
public class DownloadManager {
    
    // 下载源配置
    public enum DownloadSource {
        OFFICIAL("官方源", "https://launchermeta.mojang.com", "https://resources.download.minecraft.net"),
        BMCLAPI("BMCLAPI", "https://bmclapi2.bangbang93.com", "https://bmclapi2.bangbang93.com"),
        MCBBS("MCBBS", "https://download.mcbbs.net", "https://download.mcbbs.net"),
        WANGZHI("喵之神服", "https://pick.wangzhi.ren", "https://pick.wangzhi.ren"),
        ALI("阿里云", "https://mirrors.aliyun.com/minecraft", "https://mirrors.aliyun.com/minecraft"),
        TENCENT("腾讯云", "https://launcher-mirrors.tencent.com", "https://launcher-mirrors.tencent.com"),
        GITCODE("GitCode", "https://gitcode.net/mirrors_mojang", "https://gitcode.net/mirrors_mojang")
    }
    
    private DownloadSource currentSource = DownloadSource.BMCLAPI;
    private String gitcodeToken;  // GitCode认证token
    private int maxParallelDownloads = 4;
    private ExecutorService executor;
    
    public DownloadManager() {
        executor = Executors.newFixedThreadPool(maxParallelDownloads);
    }
    
    /**
     * 设置下载源
     */
    public void setDownloadSource(DownloadSource source) {
        this.currentSource = source;
        Logger.info("下载源已切换为: " + source.name());
    }
    
    /**
     * 设置GitCode Token
     */
    public void setGitcodeToken(String token) {
        this.gitcodeToken = token;
        if (token != null && !token.isEmpty()) {
            Logger.info("GitCode Token已设置");
        }
    }
    
    /**
     * 获取当前下载源URL
     */
    private String getBaseUrl() {
        return currentSource.url;
    }
    
    /**
     * 获取资源下载URL
     */
    public String getResourceUrl(String path) {
        return currentSource.resourceUrl + "/" + path;
    }
    
    /**
     * 下载文件
     */
    public void download(String url, File dest, DownloadCallback callback) {
        executor.execute(() -> {
            try {
                // 尝试多个源
                List<String> urls = getAvailableUrls(url);
                
                for (String tryUrl : urls) {
                    try {
                        downloadFromUrl(tryUrl, dest, callback);
                        return;
                    } catch (Exception e) {
                        Logger.warn("从 " + getSourceName(tryUrl) + " 下载失败: " + e.getMessage());
                    }
                }
                
                callback.onError("所有源都无法下载");
                
            } catch (Exception e) {
                Logger.error("下载失败", e);
                callback.onError(e.getMessage());
            }
        });
    }
    
    /**
     * 从单个URL下载
     */
    private void downloadFromUrl(String url, File dest, DownloadCallback callback) throws IOException {
        Logger.info("正在从 " + getSourceName(url) + " 下载...");
        
        FileUtils.createDir(dest.getParentFile());
        
        URL urlObj = new URL(url);
        HttpURLConnection conn = (HttpURLConnection) urlObj.openConnection();
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(60000);
        conn.setRequestProperty("User-Agent", "SCL/1.0");
        
        // 添加认证头（如果使用GitCode）
        if (gitcodeToken != null && url.contains("gitcode")) {
            conn.setRequestProperty("PRIVATE-TOKEN", gitcodeToken);
        }
        
        // 断点续传支持
        long existingSize = 0;
        if (dest.exists() && dest.length() > 0) {
            existingSize = dest.length();
            conn.setRequestProperty("Range", "bytes=" + existingSize + "-");
        }
        
        long totalSize = conn.getContentLength() + existingSize;
        
        try (InputStream input = new BufferedInputStream(conn.getInputStream());
             FileOutputStream output = new FileOutputStream(dest, existingSize > 0)) {
            
            byte[] buffer = new byte[8192];
            long downloaded = existingSize;
            int lastPercent = 0;
            
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                downloaded += read;
                
                if (callback != null && totalSize > 0) {
                    int percent = (int) (downloaded * 100 / totalSize);
                    if (percent != lastPercent) {
                        callback.onProgress(downloaded, totalSize, percent);
                        lastPercent = percent;
                    }
                }
            }
            
            if (callback != null) {
                callback.onComplete(dest);
            }
        }
    }
    
    /**
     * 获取可用的URL列表（尝试多个源）
     */
    private List<String> getAvailableUrls(String originalPath) {
        List<String> urls = new ArrayList<>();
        
        // 如果已经是完整URL，直接返回
        if (originalPath.startsWith("http")) {
            // 添加官方源
            urls.add(originalPath);
            
            // 添加各镜像源
            for (DownloadSource source : DownloadSource.values()) {
                if (source != DownloadSource.OFFICIAL) {
                    String mirrored = originalPath
                        .replace("https://launchermeta.mojang.com", source.url)
                        .replace("https://resources.download.minecraft.net", source.resourceUrl)
                        .replace("https://libraries.minecraft.net", source.resourceUrl + "/libraries");
                    urls.add(mirrored);
                }
            }
            
            return urls;
        }
        
        // 相对路径，构建完整URL
        String path = originalPath;
        
        // 资源文件
        if (path.startsWith("resources/")) {
            String hash = path.substring("resources/".length());
            String shortHash = hash.substring(0, 2);
            urls.add(currentSource.resourceUrl + "/resources/" + hash);
            for (DownloadSource source : DownloadSource.values()) {
                if (source != currentSource) {
                    urls.add(source.resourceUrl + "/resources/" + hash);
                }
            }
        }
        // 库文件
        else if (path.contains("/libraries/") || path.endsWith(".jar")) {
            urls.add(currentSource.url + "/libraries/" + path);
            for (DownloadSource source : DownloadSource.values()) {
                if (source != currentSource) {
                    urls.add(source.url + "/libraries/" + path);
                }
            }
        }
        // 版本文件
        else {
            urls.add(currentSource.url + "/" + path);
            for (DownloadSource source : DownloadSource.values()) {
                if (source != currentSource) {
                    urls.add(source.url + "/" + path);
                }
            }
        }
        
        return urls;
    }
    
    private String getSourceName(String url) {
        if (url.contains("bmclapi")) return "BMCLAPI";
        if (url.contains("mcbbs")) return "MCBBS";
        if (url.contains("wangzhi")) return "喵之神服";
        if (url.contains("aliyun")) return "阿里云";
        if (url.contains("tencent")) return "腾讯云";
        if (url.contains("gitcode")) return "GitCode";
        return "官方源";
    }
    
    /**
     * 下载进度回调
     */
    public interface DownloadCallback {
        void onProgress(long downloaded, long total, int percentage);
        void onComplete(File file);
        void onError(String error);
    }
    
    /**
     * 获取所有可用的下载源
     */
    public static DownloadSource[] getAvailableSources() {
        return DownloadSource.values();
    }
    
    /**
     * 获取当前下载源
     */
    public DownloadSource getCurrentSource() {
        return currentSource;
    }
    
    /**
     * 关闭下载管理器
     */
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
