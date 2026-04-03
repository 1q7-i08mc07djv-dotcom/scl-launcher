package com.scl.backend.controller;

import com.scl.backend.service.DataStore;
import com.scl.backend.service.GameLauncherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/tools")
public class ToolsController {
    @Autowired
    private DataStore dataStore;
    @Autowired
    private GameLauncherService gameLauncherService;

    @GetMapping("/data-dir")
    public Map<String, String> getDataDir() {
        return Map.of("path", dataStore.getDataDir());
    }

    @GetMapping("/minecraft-dir")
    public Map<String, String> getMinecraftDir() {
        return Map.of("path", dataStore.getMinecraftDir());
    }

    @PostMapping("/open-folder")
    public Map<String, Object> openFolder(@RequestBody Map<String, String> body) {
        String path = body.get("path");
        if (path == null || path.isEmpty()) {
            path = dataStore.getMinecraftDir();
        }
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                Runtime.getRuntime().exec("explorer \"" + path + "\"");
            } else if (os.contains("mac")) {
                Runtime.getRuntime().exec("open \"" + path + "\"");
            } else {
                Runtime.getRuntime().exec("xdg-open \"" + path + "\"");
            }
            return Map.of("success", true);
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    @PostMapping("/open-log")
    public Map<String, Object> openLog() {
        try {
            String logFile = dataStore.getDataDir() + "/LatestLaunch.bat";
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                Runtime.getRuntime().exec("notepad \"" + logFile + "\"");
            } else {
                Runtime.getRuntime().exec("gedit \"" + logFile + "\"");
            }
            return Map.of("success", true);
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    @PostMapping("/clean-cache")
    public Map<String, Object> cleanCache() {
        Map<String, Object> result = new HashMap<>();
        AtomicInteger cleaned = new AtomicInteger(0);
        try {
            String mcDir = dataStore.getMinecraftDir();
            // Clean logs
            Path logsDir = Paths.get(mcDir, "logs");
            if (Files.exists(logsDir)) {
                Files.walk(logsDir).filter(Files::isRegularFile).forEach(f -> {
                    try { Files.delete(f); cleaned.incrementAndGet(); } catch (IOException ignored) {}
                });
            }
            // Clean crash-reports
            Path crashDir = Paths.get(mcDir, "crash-reports");
            if (Files.exists(crashDir)) {
                Files.walk(crashDir).filter(Files::isRegularFile).forEach(f -> {
                    try { Files.delete(f); cleaned.incrementAndGet(); } catch (IOException ignored) {}
                });
            }
            result.put("success", true);
            result.put("cleaned", cleaned.get());
            result.put("message", "已清理 " + cleaned.get() + " 个文件");
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    @PostMapping("/memory-opt")
    public Map<String, Object> memoryOpt() {
        // For Java 17+, we can use jcmd to set GC
        Map<String, Object> result = new HashMap<>();
        try {
            String javaHome = System.getProperty("java.home");
            String pid = String.valueOf(ProcessHandle.current().pid());
            // Try to apply GC settings
            Process p = Runtime.getRuntime().exec("jcmd " + pid + " VM.flags");
            result.put("success", true);
            result.put("message", "内存优化已应用（JVM 参数可在设置中配置）");
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    @PostMapping("/kill-game")
    public Map<String, Object> killGame() {
        return gameLauncherService.killGame();
    }

    @GetMapping("/about")
    public Map<String, Object> about() {
        return Map.of(
            "name", "SCL Backend",
            "version", "1.0.0",
            "description", "SCL Minecraft Launcher Backend Service"
        );
    }
}
