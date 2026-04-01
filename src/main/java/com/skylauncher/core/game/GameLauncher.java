package com.SCL.core.game;

import com.SCL.data.*;
import com.SCL.utils.*;
import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * 游戏启动器
 */
public class GameLauncher {
    
    private Config config;
    
    public GameLauncher(Config config) {
        this.config = config;
    }
    
    /**
     * 启动游戏
     */
    public Process launch(GameVersion version, Account account) {
        try {
            Logger.info("正在启动游戏: " + version.getId());
            Logger.info("账户: " + account.getUsername());
            
            // 获取版本信息
            File versionJson = new File(config.getGameDir(), "versions/" + version.getId() + "/" + version.getId() + ".json");
            if (!versionJson.exists()) {
                Logger.error("版本配置文件不存在: " + versionJson);
                return null;
            }
            
            String json = FileUtils.readText(versionJson);
            JsonObject versionObj = new Gson().fromJson(json, JsonObject.class);
            
            // 构建启动参数
            List<String> args = new ArrayList<>();
            
            // Java路径
            args.add(config.getJavaPath());
            
            // JVM参数
            args.add("-Xms" + config.getMinMemory() + "M");
            args.add("-Xmx" + config.getMaxMemory() + "M");
            
            // 添加用户自定义JVM参数
            if (config.getJvmArgs() != null && !config.getJvmArgs().isEmpty()) {
                for (String arg : config.getJvmArgs().split("\\s+")) {
                    if (!arg.isEmpty()) {
                        args.add(arg);
                    }
                }
            }
            
            // Natives目录
            File nativesDir = new File(config.getGameDir(), "versions/" + version.getId() + "/natives");
            FileUtils.createDir(nativesDir);
            args.add("-Djava.library.path=" + nativesDir.getAbsolutePath());
            
            // 游戏目录
            args.add("-Dminecraft.launcher.brand=SCL");
            args.add("-Dminecraft.launcher.version=1.0.0");
            args.add("-Dminecraft.game.dir=" + config.getGameDir());
            
            // 游戏类
            String mainClass = versionObj.get("mainClass").getAsString();
            args.add(mainClass);
            
            // 游戏参数
            JsonObject arguments = versionObj.getAsJsonObject("arguments");
            
            // Minecraft参数
            if (arguments != null && arguments.has("game")) {
                JsonArray gameArgs = arguments.getAsJsonArray("game");
                addGameArguments(args, gameArgs, version, account);
            } else if (versionObj.has("minecraftArguments")) {
                // 旧版格式
                String minecraftArgs = versionObj.get("minecraftArguments").getAsString();
                addLegacyArguments(args, minecraftArgs, version, account);
            }
            
            // 输出启动命令
            Logger.info("启动命令: " + String.join(" ", args));
            
            // 构建进程
            ProcessBuilder pb = new ProcessBuilder(args);
            pb.directory(new File(config.getGameDir()));
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            
            // 启动日志线程
            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        Logger.info("[MC] " + line);
                    }
                } catch (IOException e) {
                    // 忽略
                }
            }).start();
            
            Logger.info("游戏进程已启动");
            return process;
            
        } catch (Exception e) {
            Logger.error("启动游戏失败", e);
            return null;
        }
    }
    
    /**
     * 添加游戏参数（新版格式）
     */
    private void addGameArguments(List<String> args, JsonArray gameArgs, GameVersion version, Account account) {
        for (JsonElement element : gameArgs) {
            if (element.isJsonPrimitive()) {
                String arg = element.getAsString();
                arg = replaceArgument(arg, version, account);
                args.add(arg);
            } else if (element.isJsonObject()) {
                // 处理条件参数
                JsonObject obj = element.getAsJsonObject();
                if (obj.has("value")) {
                    if (obj.get("value").isJsonArray()) {
                        for (JsonElement e : obj.getAsJsonArray("value")) {
                            args.add(replaceArgument(e.getAsString(), version, account));
                        }
                    } else {
                        args.add(replaceArgument(obj.get("value").getAsString(), version, account));
                    }
                }
            }
        }
    }
    
    /**
     * 添加游戏参数（旧版格式）
     */
    private void addLegacyArguments(List<String> args, String minecraftArgs, GameVersion version, Account account) {
        String[] parts = minecraftArgs.split("\\s+");
        for (String part : parts) {
            args.add(replaceArgument(part, version, account));
        }
    }
    
    /**
     * 替换参数中的变量
     */
    private String replaceArgument(String arg, GameVersion version, Account account) {
        if (arg.contains("${auth_player_name}")) {
            arg = arg.replace("${auth_player_name}", account.getUsername());
        }
        if (arg.contains("${auth_uuid}")) {
            arg = arg.replace("${auth_uuid}", account.getUuid());
        }
        if (arg.contains("${auth_access_token}")) {
            arg = arg.replace("${auth_access_token}", account.getAccessToken());
        }
        if (arg.contains("${client_token}")) {
            arg = arg.replace("${client_token}", account.getClientToken());
        }
        if (arg.contains("${version_name}")) {
            arg = arg.replace("${version_name}", version.getId());
        }
        if (arg.contains("${version_type}")) {
            arg = arg.replace("${version_type}", version.getType());
        }
        if (arg.contains("${game_directory}")) {
            arg = arg.replace("${game_directory}", config.getGameDir());
        }
        if (arg.contains("${assets_root}")) {
            arg = arg.replace("${assets_root}", config.getGameDir() + "/assets");
        }
        if (arg.contains("${assets_index_name}")) {
            String assets = version.getAssets();
            if (assets == null) assets = version.getId();
            arg = arg.replace("${assets_index_name}", assets);
        }
        if (arg.contains("${user_type}")) {
            arg = arg.replace("${user_type}", account.getType() == Account.AccountType.OFFLINE ? "legacy" : "msa");
        }
        if (arg.contains("${language}")) {
            arg = arg.replace("${language}", "zh_cn");
        }
        
        // 分辨率参数
        if (arg.contains("${resolution_width}")) {
            arg = arg.replace("${resolution_width}", String.valueOf(config.getWidth()));
        }
        if (arg.contains("${resolution_height}")) {
            arg = arg.replace("${resolution_height}", String.valueOf(config.getHeight()));
        }
        
        return arg;
    }
}
