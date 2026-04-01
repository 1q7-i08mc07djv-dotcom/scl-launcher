package com.SCL.data;

import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * 游戏版本数据类
 */
public class GameVersion implements Serializable {
    
    private String id;           // 版本ID，如 "1.20.4"
    private String type;         // release / snapshot / old_beta / old_alpha
    private String url;          // 版本JSON URL
    private String time;
    private String releaseTime;
    private String minecraftArguments;
    private String mainClass;
    private int minimumLauncherVersion;
    private String assets;
    private int protocolVersion;
    private List<Library> libraries;
    private Logging logging;
    
    // 额外信息
    private boolean isInstalled = false;
    private long installedSize = 0;
    private String installPath;
    
    public enum VersionType {
        RELEASE("正式版"),
        SNAPSHOT("快照版"),
        OLD_BETA("旧测试版"),
        OLD_ALPHA("旧alpha版");
        
        private final String displayName;
        
        VersionType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public VersionType getVersionType() {
        switch (type) {
            case "release": return VersionType.RELEASE;
            case "snapshot": return VersionType.SNAPSHOT;
            case "old_beta": return VersionType.OLD_BETA;
            case "old_alpha": return VersionType.OLD_ALPHA;
            default: return VersionType.RELEASE;
        }
    }
    
    /**
     * 解析版本列表JSON
     */
    public static List<GameVersion> parseVersionList(String json) {
        List<GameVersion> versions = new ArrayList<>();
        try {
            JsonObject root = new Gson().fromJson(json, JsonObject.class);
            JsonArray versionsArray = root.getAsJsonArray("versions");
            
            for (JsonElement element : versionsArray) {
                JsonObject obj = element.getAsJsonObject();
                GameVersion version = new GameVersion();
                version.setId(obj.get("id").getAsString());
                version.setType(obj.get("type").getAsString());
                version.setUrl(obj.get("url").getAsString());
                version.setTime(obj.has("time") ? obj.get("time").getAsString() : "");
                version.setReleaseTime(obj.has("releaseTime") ? obj.get("releaseTime").getAsString() : "");
                versions.add(version);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return versions;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getTime() {
        return time;
    }
    
    public void setTime(String time) {
        this.time = time;
    }
    
    public String getReleaseTime() {
        return releaseTime;
    }
    
    public void setReleaseTime(String releaseTime) {
        this.releaseTime = releaseTime;
    }
    
    public String getMinecraftArguments() {
        return minecraftArguments;
    }
    
    public void setMinecraftArguments(String minecraftArguments) {
        this.minecraftArguments = minecraftArguments;
    }
    
    public String getMainClass() {
        return mainClass;
    }
    
    public void setMainClass(String mainClass) {
        this.mainClass = mainClass;
    }
    
    public int getMinimumLauncherVersion() {
        return minimumLauncherVersion;
    }
    
    public void setMinimumLauncherVersion(int minimumLauncherVersion) {
        this.minimumLauncherVersion = minimumLauncherVersion;
    }
    
    public String getAssets() {
        return assets;
    }
    
    public void setAssets(String assets) {
        this.assets = assets;
    }
    
    public int getProtocolVersion() {
        return protocolVersion;
    }
    
    public void setProtocolVersion(int protocolVersion) {
        this.protocolVersion = protocolVersion;
    }
    
    public List<Library> getLibraries() {
        return libraries;
    }
    
    public void setLibraries(List<Library> libraries) {
        this.libraries = libraries;
    }
    
    public Logging getLogging() {
        return logging;
    }
    
    public void setLogging(Logging logging) {
        this.logging = logging;
    }
    
    public boolean isInstalled() {
        return isInstalled;
    }
    
    public void setInstalled(boolean installed) {
        isInstalled = installed;
    }
    
    public long getInstalledSize() {
        return installedSize;
    }
    
    public void setInstalledSize(long installedSize) {
        this.installedSize = installedSize;
    }
    
    public String getInstallPath() {
        return installPath;
    }
    
    public void setInstallPath(String installPath) {
        this.installPath = installPath;
    }
    
    @Override
    public String toString() {
        return id;
    }
    
    // 内部类：Library
    public static class Library {
        private String name;
        private Downloads downloads;
        private String url;
        private boolean natives;
        
        public static class Downloads {
            private Artifact artifact;
            private Artifact classifiers;
            
            public static class Artifact {
                private String path;
                private String url;
                private long size;
                private String sha1;
                
                public String getPath() { return path; }
                public void setPath(String path) { this.path = path; }
                public String getUrl() { return url; }
                public void setUrl(String url) { this.url = url; }
                public long getSize() { return size; }
                public void setSize(long size) { this.size = size; }
                public String getSha1() { return sha1; }
                public void setSha1(String sha1) { this.sha1 = sha1; }
            }
            
            public Artifact getArtifact() { return artifact; }
            public void setArtifact(Artifact artifact) { this.artifact = artifact; }
            public Artifact getClassifiers() { return classifiers; }
            public void setClassifiers(Artifact classifiers) { this.classifiers = classifiers; }
        }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Downloads getDownloads() { return downloads; }
        public void setDownloads(Downloads downloads) { this.downloads = downloads; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public boolean isNatives() { return natives; }
        public void setNatives(boolean natives) { this.natives = natives; }
    }
    
    // 内部类：Logging
    public static class Logging {
        private Client client;
        
        public static class Client {
            private String type;
            private String file;
            private String sha1;
            private long size;
            private String url;
            
            public String getType() { return type; }
            public void setType(String type) { this.type = type; }
            public String getFile() { return file; }
            public void setFile(String file) { this.file = file; }
            public String getSha1() { return sha1; }
            public void setSha1(String sha1) { this.sha1 = sha1; }
            public long getSize() { return size; }
            public void setSize(long size) { this.size = size; }
            public String getUrl() { return url; }
            public void setUrl(String url) { this.url = url; }
        }
        
        public Client getClient() { return client; }
        public void setClient(Client client) { this.client = client; }
    }
}
