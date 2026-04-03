package com.scl.backend.controller;

import com.scl.backend.model.GameVersion;
import com.scl.backend.service.DataStore;
import com.scl.backend.service.VersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/versions")
public class VersionController {
    @Autowired
    private VersionService versionService;
    @Autowired
    private DataStore dataStore;

    @GetMapping
    public List<GameVersion> list(@RequestParam(required = false) String type) {
        return versionService.getAllVersions(type);
    }

    @GetMapping("/downloaded")
    public List<GameVersion> downloaded() {
        return dataStore.loadDownloadedVersions();
    }

    @PostMapping("/mark-downloaded")
    public Map<String, Object> markDownloaded(@RequestBody GameVersion version) {
        List<GameVersion> downloaded = dataStore.loadDownloadedVersions();
        if (downloaded.stream().noneMatch(v -> v.getId().equals(version.getId()))) {
            downloaded.add(version);
            dataStore.saveDownloadedVersions(downloaded);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }

    @DeleteMapping("/downloaded/{id}")
    public Map<String, Object> removeDownloaded(@PathVariable String id) {
        List<GameVersion> downloaded = dataStore.loadDownloadedVersions();
        downloaded.removeIf(v -> v.getId().equals(id));
        dataStore.saveDownloadedVersions(downloaded);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }
}
