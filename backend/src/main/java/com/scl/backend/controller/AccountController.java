package com.scl.backend.controller;

import com.scl.backend.model.Account;
import com.scl.backend.service.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    @Autowired
    private DataStore dataStore;

    @GetMapping
    public List<Account> list() {
        return dataStore.loadAccounts();
    }

    @PostMapping
    public Account add(@RequestBody Account account) {
        List<Account> accounts = dataStore.loadAccounts();
        if (account.getId() == null || account.getId().isEmpty()) {
            account.setId(UUID.randomUUID().toString());
        }
        if ("offline".equals(account.getType()) && account.getUuid() == null) {
            account.setUuid(Account.generateOfflineUUID(account.getUsername()));
        }
        accounts.add(account);
        dataStore.saveAccounts(accounts);
        return account;
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        List<Account> accounts = dataStore.loadAccounts();
        accounts.removeIf(a -> a.getId().equals(id));
        dataStore.saveAccounts(accounts);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return result;
    }
}
