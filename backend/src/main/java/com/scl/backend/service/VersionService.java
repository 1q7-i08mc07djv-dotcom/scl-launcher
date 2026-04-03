package com.scl.backend.service;

import com.google.gson.*;
import com.scl.backend.model.AppConfig;
import com.scl.backend.model.GameVersion;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class VersionService {
    @Autowired
    private DataStore dataStore;

    private final OkHttpClient http = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build();

    private static final Map<String, String> MIRRORS = Map.of(
        "BMCLAPI",   "https://bmclapi2.bangbang93.com",
        "GitCode",   "https://gitcode.net/mirrors",
        "MCBBS",     "https://download.mcbbs.xyz",
        "Aliyun",    "https://mirrors.aliyun.com/minecraft",
        "Tencent",   "https://launchermeta.mirrores.net"
    );

    private String getMirrorBase() {
        AppConfig config = dataStore.loadConfig();
        return MIRRORS.getOrDefault(config.getDownloadSource(), MIRRORS.get("BMCLAPI"));
    }

    private String ua() {
        return "SCL/1.0 (Minecraft Launcher)";
    }

    private String get(String url) throws IOException {
        Request req = new Request.Builder()
            .url(url)
            .header("User-Agent", ua())
            .build();
        try (Response r = http.newCall(req).execute()) {
            if (!r.isSuccessful() || r.body() == null) {
                throw new IOException("HTTP " + r.code() + ": " + url);
            }
            return r.body().string();
        }
    }

    // Fetch official MC versions
    public List<GameVersion> fetchOfficialVersions() {
        List<GameVersion> out = new ArrayList<>();
        String base = getMirrorBase();

        try {
            String json = get(base + "/Minecraft/version");
            JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
            for (JsonElement el : arr) {
                JsonObject o = el.getAsJsonObject();
                String id = o.get("id").getAsString();
                String type = o.has("type") ? o.get("type").getAsString() : "release";
                if ("old_alpha".equals(type) || "old_beta".equals(type)) continue;

                GameVersion gv = new GameVersion();
                gv.setId(id);
                gv.setName("Minecraft " + id);
                gv.setType("official");
                gv.setVersion(id);
                gv.setMinecraftVersion(id);
                out.add(gv);
            }
        } catch (Exception e) {
            System.err.println("Official versions fetch failed (" + base + "): " + e.getMessage());
        }

        if (out.isEmpty()) out = demoOfficial();
        return out;
    }

    // Fetch Fabric versions
    public List<GameVersion> fetchFabricVersions() {
        List<GameVersion> out = new ArrayList<>();
        String base = getMirrorBase();

        try {
            String json = get(base + "/fabric/meta");
            JsonObject root = JsonParser.parseString(json).getAsJsonObject();
            JsonArray gvArr = root.getAsJsonArray("gameVersions");
            JsonArray loaders = root.getAsJsonArray("loaders");

            for (JsonElement gvEl : gvArr) {
                String gameVer = gvEl.getAsString();
                for (JsonElement ldrEl : loaders) {
                    JsonObject ldr = ldrEl.getAsJsonObject();
                    String loaderVer = ldr.get("version").getAsString();
                    GameVersion v = new GameVersion();
                    v.setId("fabric-" + gameVer + "-" + loaderVer);
                    v.setName("Fabric " + gameVer);
                    v.setType("fabric");
                    v.setVersion(loaderVer);
                    v.setMinecraftVersion(gameVer);
                    out.add(v);
                }
            }
        } catch (Exception e) {
            System.err.println("Fabric versions fetch failed (" + base + "): " + e.getMessage());
        }

        if (out.isEmpty()) out = demoFabric();
        return out;
    }

    // Fetch Forge versions for each MC version
    public List<GameVersion> fetchForgeVersions() {
        List<GameVersion> out = new ArrayList<>();
        String base = getMirrorBase();

        // First get MC versions
        Set<String> mcVersions = new LinkedHashSet<>();
        try {
            String json = get(base + "/Minecraft/version");
            JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
            for (JsonElement el : arr) {
                JsonObject o = el.getAsJsonObject();
                String type = o.has("type") ? o.get("type").getAsString() : "release";
                if ("old_alpha".equals(type) || "old_beta".equals(type)) continue;
                mcVersions.add(o.get("id").getAsString());
            }
        } catch (Exception e) {
            System.err.println("MC versions list fetch failed: " + e.getMessage());
        }

        // Fetch Forge for each version (limit to recent 5 for speed)
        int count = 0;
        for (String mcVer : mcVersions) {
            if (++count > 5) break;
            try {
                String json = get(base + "/forge/version/" + mcVer);
                JsonArray arr = JsonParser.parseString(json).getAsJsonArray();
                for (JsonElement el : arr) {
                    JsonObject o = el.getAsJsonObject();
                    GameVersion v = new GameVersion();
                    v.setId("forge-" + mcVer);
                    v.setName("Forge " + mcVer);
                    v.setType("forge");
                    v.setVersion(o.has("version") ? o.get("version").getAsString() : mcVer);
                    v.setMinecraftVersion(mcVer);
                    out.add(v);
                }
            } catch (Exception e) {
                // Some versions may not have Forge
            }
        }

        if (out.isEmpty()) out = demoForge();
        return out;
    }

    public List<GameVersion> getAllVersions(String type) {
        List<GameVersion> downloaded = dataStore.loadDownloadedVersions();
        Set<String> downloadedIds = new HashSet<>();
        for (GameVersion dv : downloaded) downloadedIds.add(dv.getId());

        List<GameVersion> fetched;
        switch (type == null ? "official" : type) {
            case "fabric" -> fetched = fetchFabricVersions();
            case "forge"  -> fetched = fetchForgeVersions();
            default       -> fetched = fetchOfficialVersions();
        }

        for (GameVersion fv : fetched) {
            fv.setDownloaded(downloadedIds.contains(fv.getId()));
        }
        return fetched;
    }

    // ── Demo fallback data ────────────────────────────────────

    private List<GameVersion> demoOfficial() {
        return Arrays.asList(
            gv("1.21.4","Minecraft 1.21.4","official","1.21.4","1.21.4"),
            gv("1.21.3","Minecraft 1.21.3","official","1.21.3","1.21.3"),
            gv("1.21.1","Minecraft 1.21.1","official","1.21.1","1.21.1"),
            gv("1.20.6","Minecraft 1.20.6","official","1.20.6","1.20.6"),
            gv("1.20.4","Minecraft 1.20.4","official","1.20.4","1.20.4"),
            gv("1.20.2","Minecraft 1.20.2","official","1.20.2","1.20.2"),
            gv("1.19.4","Minecraft 1.19.4","official","1.19.4","1.19.4"),
            gv("1.18.2","Minecraft 1.18.2","official","1.18.2","1.18.2"),
            gv("1.16.5","Minecraft 1.16.5","official","1.16.5","1.16.5"),
            gv("1.12.2","Minecraft 1.12.2","official","1.12.2","1.12.2")
        );
    }

    private List<GameVersion> demoFabric() {
        return Arrays.asList(
            gv("fabric-1.21.4","Fabric 1.21.4","fabric","1.0.1","1.21.4"),
            gv("fabric-1.20.4","Fabric 1.20.4","fabric","0.15.7","1.20.4"),
            gv("fabric-1.19.4","Fabric 1.19.4","fabric","0.14.21","1.19.4"),
            gv("fabric-1.18.2","Fabric 1.18.2","fabric","0.14.21","1.18.2")
        );
    }

    private List<GameVersion> demoForge() {
        return Arrays.asList(
            gv("forge-1.21.4","Forge 1.21.4","forge","52.0","1.21.4"),
            gv("forge-1.20.4","Forge 1.20.4","forge","49.0.30","1.20.4"),
            gv("forge-1.16.5","Forge 1.16.5","forge","36.2.39","1.16.5"),
            gv("forge-1.12.2","Forge 1.12.2","forge","14.23.5.2859","1.12.2")
        );
    }

    private static GameVersion gv(String id, String name, String type, String ver, String mc) {
        GameVersion v = new GameVersion();
        v.setId(id); v.setName(name); v.setType(type); v.setVersion(ver); v.setMinecraftVersion(mc);
        return v;
    }
}
