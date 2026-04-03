package com.scl.backend.service;

import com.scl.backend.model.Account;
import com.scl.backend.model.AppConfig;
import com.scl.backend.model.GameVersion;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class GameLauncherService {
    @Autowired
    private DataStore dataStore;

    private Process currentGameProcess;

    public Map<String, Object> launch(GameVersion version, Account account) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        try {
            AppConfig config = dataStore.loadConfig();
            String minecraftDir = dataStore.getMinecraftDir();

            // Check if version is downloaded
            List<GameVersion> downloaded = dataStore.loadDownloadedVersions();
            boolean isDownloaded = downloaded.stream().anyMatch(v -> v.getId().equals(version.getId()));
            if (!isDownloaded) {
                result.put("error", "版本未下载: " + version.getName());
                return result;
            }

            // Find Java
            String javaPath = config.getJavaPath();
            if (javaPath.isEmpty() || config.isAutoJava()) {
                javaPath = findJava();
                if (javaPath == null) {
                    result.put("error", "未找到 Java，请安装 JDK 21 或在设置中配置 Java 路径");
                    return result;
                }
            }

            // Build game directory path
            String versionDir = minecraftDir + "/versions/" + version.getId();
            if (!Files.exists(Paths.get(versionDir))) {
                result.put("error", "游戏版本目录不存在: " + versionDir);
                return result;
            }

            // Build command
            List<String> command = new ArrayList<>();
            command.add(javaPath);

            // Memory
            String memory = config.getMemory().replace("G", "").replace("M", "");
            if (!memory.endsWith("M") && !memory.endsWith("G")) {
                memory += "G";
            }
            command.add("-Xmx" + memory);

            // JVM args
            String jvmArgs = config.getJvmArgs();
            if (jvmArgs != null && !jvmArgs.isEmpty()) {
                for (String arg : jvmArgs.split("\\s+")) {
                    if (!arg.isEmpty()) command.add(arg);
                }
            }

            // Game arguments
            command.add("-Djava.library.path=" + versionDir + "/natives");
            command.add("-cp");
            command.add(buildClassPath(versionDir, minecraftDir));
            command.add("net.minecraft.client.main.Main");

            // Minecraft arguments
            command.add("--username");
            command.add(account.getUsername());
            command.add("--version");
            command.add(version.getVersion());
            command.add("--gameDir");
            command.add(minecraftDir);
            command.add("--assetsDir");
            command.add(minecraftDir + "/assets");
            command.add("--assetIndex");
            command.add(version.getMinecraftVersion());

            if ("offline".equals(account.getType())) {
                command.add("--uuid");
                command.add(account.getUuid() != null ? account.getUuid() : Account.generateOfflineUUID(account.getUsername()));
                command.add("--accessToken");
                command.add("0");
                command.add("--clientId");
                command.add("SCL-Offline");
                command.add("--xuid");
                command.add("0");
            } else if (account.getToken() != null) {
                command.add("--uuid");
                command.add(account.getUuid() != null ? account.getUuid() : "00000000-0000-0000-0000-000000000000");
                command.add("--accessToken");
                command.add(account.getToken());
            }

            command.add("--width");
            command.add("854");
            command.add("--height");
            command.add("480");

            // Execute
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(new File(minecraftDir));
            pb.redirectErrorStream(false);

            // Write launch script for debugging
            String scriptPath = dataStore.getDataDir() + "/LatestLaunch.bat";
            Files.createDirectories(Paths.get(dataStore.getDataDir()));
            Files.writeString(Paths.get(scriptPath), String.join(" ", command), java.nio.charset.StandardCharsets.UTF_8);

            currentGameProcess = pb.start();

            result.put("success", true);
            result.put("pid", currentGameProcess.pid());
            result.put("message", "游戏已启动: " + version.getName());

            // Log output in background
            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(currentGameProcess.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        System.err.println("[Minecraft] " + line);
                    }
                } catch (IOException ignored) {}
            }).start();

        } catch (Exception e) {
            result.put("error", "启动失败: " + e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    public Map<String, Object> killGame() {
        Map<String, Object> result = new HashMap<>();
        if (currentGameProcess != null && currentGameProcess.isAlive()) {
            currentGameProcess.destroyForcibly();
            result.put("success", true);
            result.put("message", "游戏已关闭");
        } else {
            // Try to find and kill by process name
            try {
                String os = System.getProperty("os.name").toLowerCase();
                Process p;
                if (os.contains("win")) {
                    p = Runtime.getRuntime().exec("taskkill /F /IM javaw.exe");
                } else {
                    p = Runtime.getRuntime().exec("pkill -f 'Minecraft'");
                }
                result.put("success", p.waitFor() == 0);
                result.put("message", "已尝试关闭游戏进程");
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            }
        }
        return result;
    }

    public boolean isGameRunning() {
        return currentGameProcess != null && currentGameProcess.isAlive();
    }

    private String findJava() {
        String[] candidates = {
            System.getProperty("java.home") + "/bin/java",
            "C:/Program Files/Java/jdk-21/bin/java",
            "C:/Program Files/Java/jdk-17/bin/java",
            "C:/Program Files (x86)/Java/jre/bin/java",
            "/usr/bin/java",
            "/usr/lib/jvm/java-21/bin/java",
            "/usr/lib/jvm/java-17/bin/java"
        };

        for (String candidate : candidates) {
            File f = new File(candidate);
            if (f.exists()) {
                return candidate.replace("\\", "/");
            }
        }

        // Try to find in PATH
        try {
            Process p = Runtime.getRuntime().exec(new String[]{"where", "java"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = reader.readLine();
            if (line != null) {
                return line.trim().replace("\\", "/");
            }
        } catch (Exception ignored) {}

        return null;
    }

    private String buildClassPath(String versionDir, String minecraftDir) {
        StringBuilder cp = new StringBuilder();
        File libsDir = new File(minecraftDir + "/libraries");

        // Add version jar
        File versionJar = new File(versionDir + "/" + versionDir.substring(versionDir.lastIndexOf("/") + 1) + ".jar");
        if (versionJar.exists()) {
            cp.append(versionJar.getPath()).append(";");
        }

        // Scan libraries
        if (libsDir.exists()) {
            scanLibraries(libsDir, cp);
        }

        return cp.toString();
    }

    private void scanLibraries(File dir, StringBuilder cp) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (f.isDirectory()) {
                scanLibraries(f, cp);
            } else if (f.getName().endsWith(".jar")) {
                cp.append(f.getPath().replace("\\", "/")).append(";");
            }
        }
    }
}
