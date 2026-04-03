package com.scl.backend.model;

public class GameVersion {
    private String id;
    private String name;
    private String type; // official, fabric, forge, quilt, optifine, neoforge, labymod, cleanroom, liteloader, legacyfabric
    private String version;
    private String minecraftVersion;
    private boolean downloaded;
    private String path;

    public GameVersion() {}

    public GameVersion(String id, String name, String type, String version, String minecraftVersion) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.version = version;
        this.minecraftVersion = minecraftVersion;
        this.downloaded = false;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getMinecraftVersion() { return minecraftVersion; }
    public void setMinecraftVersion(String minecraftVersion) { this.minecraftVersion = minecraftVersion; }
    public boolean isDownloaded() { return downloaded; }
    public void setDownloaded(boolean downloaded) { this.downloaded = downloaded; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
