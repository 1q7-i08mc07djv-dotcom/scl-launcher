package com.scl.backend.service;

import com.google.gson.*;
import com.scl.backend.model.*;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class DataStore {
    private static final String DATA_DIR = System.getProperty("user.home") + "/.SCL";
    private static final String ACCOUNTS_FILE = DATA_DIR + "/accounts.json";
    private static final String CONFIG_FILE = DATA_DIR + "/config.json";
    private static final String VERSIONS_FILE = DATA_DIR + "/versions.json";

    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public DataStore() {
        try {
            Files.createDirectories(Paths.get(DATA_DIR));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Accounts ---
    public List<Account> loadAccounts() {
        try {
            if (Files.exists(Paths.get(ACCOUNTS_FILE))) {
                String json = Files.readString(Paths.get(ACCOUNTS_FILE), StandardCharsets.UTF_8);
                JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
                List<Account> list = new ArrayList<>();
                for (JsonElement el : arr) {
                    list.add(gson.fromJson(el, Account.class));
                }
                return list;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    public void saveAccounts(List<Account> accounts) {
        try {
            Files.createDirectories(Paths.get(DATA_DIR));
            String json = gson.toJson(accounts);
            Files.writeString(Paths.get(ACCOUNTS_FILE), json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Config ---
    public AppConfig loadConfig() {
        try {
            if (Files.exists(Paths.get(CONFIG_FILE))) {
                String json = Files.readString(Paths.get(CONFIG_FILE), StandardCharsets.UTF_8);
                return gson.fromJson(json, AppConfig.class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new AppConfig();
    }

    public void saveConfig(AppConfig config) {
        try {
            Files.createDirectories(Paths.get(DATA_DIR));
            String json = gson.toJson(config);
            Files.writeString(Paths.get(CONFIG_FILE), json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Downloaded Versions ---
    public List<GameVersion> loadDownloadedVersions() {
        try {
            if (Files.exists(Paths.get(VERSIONS_FILE))) {
                String json = Files.readString(Paths.get(VERSIONS_FILE), StandardCharsets.UTF_8);
                JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
                List<GameVersion> list = new ArrayList<>();
                for (JsonElement el : arr) {
                    list.add(gson.fromJson(el, GameVersion.class));
                }
                return list;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    public void saveDownloadedVersions(List<GameVersion> versions) {
        try {
            Files.createDirectories(Paths.get(DATA_DIR));
            String json = gson.toJson(versions);
            Files.writeString(Paths.get(VERSIONS_FILE), json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Helpers ---
    public String getDataDir() {
        return DATA_DIR;
    }

    public String getMinecraftDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getProperty("user.home") + "/AppData/Roaming/.minecraft";
        } else if (os.contains("mac")) {
            return System.getProperty("user.home") + "/Library/Application Support/minecraft";
        } else {
            return System.getProperty("user.home") + "/.minecraft";
        }
    }
}
