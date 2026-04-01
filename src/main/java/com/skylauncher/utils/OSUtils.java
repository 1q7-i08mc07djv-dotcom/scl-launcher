package com.SCL.utils;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * 系统工具类
 */
public class OSUtils {
    
    public static String OS_NAME = System.getProperty("os.name").toLowerCase();
    public static String USER_HOME = System.getProperty("user.home");
    public static String JAVA_HOME = System.getProperty("java.home");
    public static String JAVA_VERSION = System.getProperty("java.version");
    public static String ARCH = System.getProperty("os.arch");
    
    /**
     * 是否是Windows
     */
    public static boolean isWindows() {
        return OS_NAME.contains("win");
    }
    
    /**
     * 是否是Mac
     */
    public static boolean isMac() {
        return OS_NAME.contains("mac") || OS_NAME.contains("darwin");
    }
    
    /**
     * 是否是Linux
     */
    public static boolean isLinux() {
        return OS_NAME.contains("linux") || OS_NAME.contains("unix");
    }
    
    /**
     * 获取默认游戏目录
     */
    public static String getDefaultGameDir() {
        if (isWindows()) {
            return USER_HOME + "/AppData/Roaming/.minecraft";
        } else if (isMac()) {
            return USER_HOME + "/Library/Application Support/minecraft";
        } else {
            return USER_HOME + "/.minecraft";
        }
    }
    
    /**
     * 获取默认Java路径
     */
    public static String getDefaultJavaPath() {
        return JAVA_HOME + "/bin/java" + (isWindows() ? ".exe" : "");
    }
    
    /**
     * 查找系统中的Java
     */
    public static List<String> findJava() {
        List<String> javaPaths = new ArrayList<>();
        String defaultJava = getDefaultJavaPath();
        if (new File(defaultJava).exists()) {
            javaPaths.add(defaultJava);
        }
        
        if (isWindows()) {
            // 搜索常见Java安装位置
            String[] commonPaths = {
                "C:/Program Files/Java/bin/java.exe",
                "C:/Program Files (x86)/Java/bin/java.exe",
                "C:/Program Files/Eclipse Foundation/jdk-21/bin/java.exe"
            };
            for (String path : commonPaths) {
                if (new File(path).exists() && !javaPaths.contains(path)) {
                    javaPaths.add(path);
                }
            }
        }
        
        return javaPaths;
    }
    
    /**
     * 获取系统总内存（MB）
     */
    public static int getTotalMemory() {
        long bytes = Runtime.getRuntime().maxMemory();
        return (int) (bytes / (1024 * 1024));
    }
    
    /**
     * 获取推荐内存（MB）
     */
    public static int getRecommendedMemory() {
        int total = (int) (Runtime.getRuntime().maxMemory() / (1024 * 1024));
        if (total >= 16000) return 4096;
        if (total >= 8000) return 2048;
        if (total >= 4000) return 1536;
        return 1024;
    }
    
    /**
     * 获取系统架构
     */
    public static String getArch() {
        return ARCH.contains("64") ? "64-bit" : "32-bit";
    }
}
