package com.scl.backend.controller;

import com.scl.backend.model.AppConfig;
import com.scl.backend.service.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {
    @Autowired
    private DataStore dataStore;

    @GetMapping
    public AppConfig get() {
        return dataStore.loadConfig();
    }

    @PostMapping
    public Map<String, Object> save(@RequestBody AppConfig config) {
        dataStore.saveConfig(config);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }
}
