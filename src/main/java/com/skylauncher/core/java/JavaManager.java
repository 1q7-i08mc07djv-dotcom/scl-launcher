package com.SCL.core.java;

import com.SCL.utils.*;
import com.SCL.utils.FileUtils;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.*;

/**
 * Java自动下载管理器
 * 自动下载并管理不同版本的Java运行时
 */
public class JavaManager {
    
    // Java下载地址（多个镜像源）
    private static final String[][] JAVA_MIRRORS = {
        // Eclipse Adoptium (国外源)
        {"Adoptium", "https://api.adoptium.net/v3/assets/latest/{version}/hotspot?architecture=x64&os=windows&vendor=eclipse"},
        // GitCode镜像
        {"GitCode", "https://gitcode.net/mirrors_adoptium/adoptium-mirror/-/raw/main/adoptium-{version}-hotspot-x64-windows.zip"},
        // 备用源
        {"Azul", "https://cdn.azul.com/zulu/bin/zulu21.30.15-ca-jdk21.0.1-win_x64.zip"}
    };
    
    private static final String[] JAVA_VERSIONS = {"21", "17", "11", "8"};
    
    private String javaHome;  // 启动器自带的Java目录
    private String preferredVersion = "21";
    
    public JavaManager(String launcherDir) {
        this.javaHome = launcherDir + "/jre";
    }
    
    /**
     * 获取或下载Java
     * @return Java可执行文件路径
     */
    public String getJavaPath() {
        // 1. 先检查是否已有本地Java
        String localJava = findLocalJava();
        if (localJava != null) {
            Logger.info("使用本地Java: " + localJava);
            return localJava;
        }
        
        // 2. 检查启动器自带的Java
        String bundledJava = getBundledJavaPath();
        if (bundledJava != null) {
            Logger.info("使用内置Java: " + bundledJava);
            return bundledJava;
        }
        
        // 3. 自动下载Java
        Logger.info("正在自动下载Java " + preferredVersion + "...");
        if (downloadJava(preferredVersion)) {
            return getBundledJavaPath();
        }
        
        // 4. 回退：尝试其他版本
        for (String version : JAVA_VERSIONS) {
            if (!version.equals(preferredVersion)) {
                Logger.info("尝试下载Java " + version + "...");
                if (downloadJava(version)) {
                    return getBundledJavaPath();
                }
            }
        }
        
        Logger.error("无法获取Java运行环境");
        return null;
    }
    
    /**
     * 查找本地Java
     */
    private String findLocalJava() {
        // 检查JAVA_HOME
        String javaHomeEnv = System.getenv("JAVA_HOME");
        if (javaHomeEnv != null) {
            File javaExe = new File(javaHomeEnv + "/bin/java.exe");
            if (javaExe.exists()) {
                return javaExe.getAbsolutePath();
            }
        }
        
        // 检查PATH中的Java
        String path = System.getenv("PATH");
        if (path != null) {
            for (String dir : path.split(";")) {
                File javaExe = new File(dir.trim(), "java.exe");
                if (javaExe.exists()) {
                    return javaExe.getAbsolutePath();
                }
            }
        }
        
        // 检查常见位置
        String[][] commonPaths = {
            {System.getProperty("user.home") + "/.jdks", ""},
            {"C:/Program Files/Java", ""},
            {"C:/Program Files/Eclipse Foundation", ""}
        };
        
        for (String[] basePath : commonPaths) {
            File base = new File(basePath[0]);
            if (base.exists()) {
                File[] versions = base.listFiles();
                if (versions != null) {
                    for (File version : versions) {
                        if (version.isDirectory()) {
                            File javaExe = new File(version, "/bin/java.exe");
                            if (javaExe.exists()) {
                                return javaExe.getAbsolutePath();
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 获取内置Java路径
     */
    private String getBundledJavaPath() {
        File javaExe = new File(javaHome + "/bin/java.exe");
        if (javaExe.exists()) {
            return javaExe.getAbsolutePath();
        }
        
        // 递归查找
        File jreDir = new File(javaHome);
        if (jreDir.exists()) {
            File[] subdirs = jreDir.listFiles();
            if (subdirs != null) {
                for (File subdir : subdirs) {
                    if (subdir.isDirectory()) {
                        File javaInSub = new File(subdir, "/bin/java.exe");
                        if (javaInSub.exists()) {
                            return javaInSub.getAbsolutePath();
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 下载Java运行时
     */
    public boolean downloadJava(String version) {
        File javaDir = new File(javaHome);
        FileUtils.createDir(javaDir);
        
        // 获取下载链接
        String downloadUrl = getDownloadUrl(version);
        if (downloadUrl == null) {
            Logger.error("无法获取Java " + version + "的下载链接");
            return false;
        }
        
        Logger.info("从 " + getMirrorName(downloadUrl) + " 下载Java " + version);
        
        File zipFile = new File(javaDir, "jdk-" + version + ".zip");
        
        try {
            // 下载文件
            downloadWithProgress(downloadUrl, zipFile);
            
            // 解压
            Logger.info("正在解压Java...");
            unzip(zipFile, javaDir);
            
            // 删除压缩包
            zipFile.delete();
            
            Logger.info("Java " + version + " 安装完成!");
            return true;
            
        } catch (Exception e) {
            Logger.error("下载Java失败", e);
            zipFile.delete();
            return false;
        }
    }
    
    /**
     * 获取下载链接
     */
    private String getDownloadUrl(String version) {
        // 首先尝试GitCode镜像
        String gitcodeUrl = "https://gitcode.net/mirrors_adoptium/adoptium-mirror/-/raw/main/jdk-" + version + "-hotspot-x64_windows.zip";
        
        try {
            // 测试GitCode是否可用
            URL url = new URL(gitcodeUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(5000);
            int response = conn.getResponseCode();
            if (response == 200 || response == 302) {
                return gitcodeUrl;
            }
        } catch (Exception e) {
            Logger.warn("GitCode镜像不可用，尝试其他源...");
        }
        
        // 尝试BMCLAPI
        String bmclUrl = "https://bmclapi2.bangbang93.com/jdk/" + version + "/hotspot/x64";
        try {
            URL url = new URL(bmclUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(5000);
            int response = conn.getResponseCode();
            if (response == 200 || response == 302) {
                return bmclUrl;
            }
        } catch (Exception e) {
            Logger.warn("BMCLAPI镜像不可用...");
        }
        
        // 回退到官方源
        return "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.2%2B13/OpenJDK21U-jdk_x64_windows_hotspot-21.0.2_13.zip";
    }
    
    private String getMirrorName(String url) {
        if (url.contains("gitcode")) return "GitCode";
        if (url.contains("bmclapi")) return "BMCLAPI";
        if (url.contains("adoptium")) return "Adoptium";
        return "官方源";
    }
    
    /**
     * 带进度下载
     */
    private void downloadWithProgress(String urlStr, File dest) throws IOException {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(60000);
        conn.setRequestProperty("User-Agent", "SCL/1.0");
        
        long totalSize = conn.getContentLength();
        
        try (InputStream input = conn.getInputStream();
             FileOutputStream output = new FileOutputStream(dest)) {
            
            byte[] buffer = new byte[8192];
            long downloaded = 0;
            int read;
            
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                downloaded += read;
                
                if (totalSize > 0) {
                    int percent = (int) (downloaded * 100 / totalSize);
                    Logger.info("下载进度: " + percent + "%");
                }
            }
        }
    }
    
    /**
     * 解压ZIP文件
     */
    private void unzip(File zipFile, File destDir) throws IOException {
        byte[] buffer = new byte[8192];
        
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                File newFile = new File(destDir, entry.getName());
                
                // 安全检查
                String destDirPath = destDir.getCanonicalPath();
                String newFilePath = newFile.getCanonicalPath();
                if (!newFilePath.startsWith(destDirPath)) {
                    throw new IOException("ZIP条目在目标目录外: " + entry.getName());
                }
                
                if (entry.isDirectory()) {
                    FileUtils.createDir(newFile);
                } else {
                    FileUtils.createDir(newFile.getParentFile());
                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
                zis.closeEntry();
            }
        }
        
        // 移动解压内容到正确位置
        File[] subdirs = destDir.listFiles(File::isDirectory);
        if (subdirs != null && subdirs.length == 1) {
            File extracted = subdirs[0];
            if (extracted.getName().contains("jdk") || extracted.getName().contains("java")) {
                // 已经是正确结构
                return;
            }
        }
        
        // 查找解压后的jdk目录并移动
        for (File subdir : Objects.requireNonNull(destDir.listFiles())) {
            if (subdir.isDirectory() && (subdir.getName().contains("jdk-") || subdir.getName().contains("jre-"))) {
                // 这是解压后的根目录
                File binDir = new File(subdir, "bin");
                if (binDir.exists()) {
                    // 移动bin的内容到父目录
                    for (File binFile : Objects.requireNonNull(binDir.listFiles())) {
                        FileUtils.copyFile(binFile, new File(destDir, "bin/" + binFile.getName()));
                    }
                    break;
                }
            }
        }
    }
    
    /**
     * 获取可用的Java版本列表
     */
    public static String[] getAvailableVersions() {
        return JAVA_VERSIONS.clone();
    }
    
    /**
     * 检查是否需要下载Java
     */
    public boolean needsDownload() {
        return getJavaPath() == null;
    }
    
    /**
     * 获取Java主目录
     */
    public String getJavaHome() {
        return javaHome;
    }
    
    /**
     * 设置首选Java版本
     */
    public void setPreferredVersion(String version) {
        this.preferredVersion = version;
    }
}
