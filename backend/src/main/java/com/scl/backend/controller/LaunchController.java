package com.scl.backend.controller;

import com.scl.backend.model.Account;
import com.scl.backend.model.GameVersion;
import com.scl.backend.service.DataStore;
import com.scl.backend.service.GameLauncherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/launch")
public class LaunchController {
    @Autowired
    private GameLauncherService gameLauncher;
    @Autowired
    private DataStore dataStore;

    @PostMapping
    public Map<String, Object> launch(@RequestBody LaunchRequest request) {
        Account account = request.getAccount();
        GameVersion version = request.getVersion();
        if (account == null || version == null) {
            return Map.of("success", false, "error", "账户和版本不能为空");
        }
        return gameLauncher.launch(version, account);
    }

    @PostMapping("/kill")
    public Map<String, Object> kill() {
        return gameLauncher.killGame();
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("running", gameLauncher.isGameRunning());
    }

    public static class LaunchRequest {
        private Account account;
        private GameVersion version;

        public Account getAccount() { return account; }
        public void setAccount(Account account) { this.account = account; }
        public GameVersion getVersion() { return version; }
        public void setVersion(GameVersion version) { this.version = version; }
    }
}
