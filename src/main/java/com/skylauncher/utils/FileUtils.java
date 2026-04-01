package com.SCL.utils;

import java.io.*;
import java.nio.file.*;
import java.util.Comparator;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * 文件工具类
 */
public class FileUtils {
    
    /**
     * 创建目录（递归）
     */
    public static void createDir(File dir) {
        if (dir.exists()) return;
        if (!dir.mkdirs()) {
            Logger.error("无法创建目录: " + dir.getPath());
        }
    }
    
    /**
     * 删除目录（递归）
     */
    public static void deleteDir(File dir) {
        if (!dir.exists()) return;
        try (Stream<Path> walk = Files.walk(dir.toPath())) {
            walk.sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        } catch (IOException e) {
            Logger.error("删除目录失败", e);
        }
    }
    
    /**
     * 复制文件
     */
    public static void copyFile(File source, File dest) {
        try {
            Files.copy(source.toPath(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            Logger.error("复制文件失败", e);
        }
    }
    
    /**
     * 读取文本文件
     */
    public static String readText(File file) {
        try {
            return Files.readString(file.toPath());
        } catch (IOException e) {
            Logger.error("读取文件失败", e);
            return null;
        }
    }
    
    /**
     * 写入文本文件
     */
    public static void writeText(File file, String content) {
        try {
            Files.writeString(file.toPath(), content);
        } catch (IOException e) {
            Logger.error("写入文件失败", e);
        }
    }
    
    /**
     * 解压ZIP文件
     */
    public static void unzip(File zipFile, File destDir) {
        createDir(destDir);
        byte[] buffer = new byte[1024];
        
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                File newFile = new File(destDir, entry.getName());
                
                // 安全检查
                if (!newFile.getCanonicalPath().startsWith(destDir.getCanonicalPath())) {
                    throw new IOException("ZIP条目在目标目录外: " + entry.getName());
                }
                
                if (entry.isDirectory()) {
                    createDir(newFile);
                } else {
                    createDir(newFile.getParentFile());
                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            Logger.error("解压失败", e);
        }
    }
    
    /**
     * 获取文件大小（人类可读）
     */
    public static String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
    
    /**
     * 计算文件夹大小
     */
    public static long getFolderSize(File folder) {
        long size = 0;
        if (folder.isDirectory()) {
            File[] files = folder.listFiles();
            if (files != null) {
                for (File file : files) {
                    size += getFolderSize(file);
                }
            }
        } else {
            size = folder.length();
        }
        return size;
    }
}
