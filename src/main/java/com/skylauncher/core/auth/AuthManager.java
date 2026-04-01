package com.SCL.core.auth;

import com.google.gson.*;
import com.SCL.data.Account;
import com.SCL.utils.*;
import java.io.*;
import java.util.*;

/**
 * 账户认证管理器
 */
public class AuthManager {
    
    private static final File ACCOUNTS_FILE = new File(System.getProperty("user.home"), ".SCL/accounts.json");
    private List<Account> accounts = new ArrayList<>();
    private Account currentAccount;
    
    public AuthManager() {
        loadAccounts();
    }
    
    /**
     * 加载账户列表
     */
    public void loadAccounts() {
        if (ACCOUNTS_FILE.exists()) {
            try {
                String json = FileUtils.readText(ACCOUNTS_FILE);
                JsonArray array = new Gson().fromJson(json, JsonArray.class);
                accounts.clear();
                for (JsonElement element : array) {
                    Account account = new Gson().fromJson(element, Account.class);
                    accounts.add(account);
                }
                Logger.info("已加载 " + accounts.size() + " 个账户");
            } catch (Exception e) {
                Logger.error("加载账户失败", e);
            }
        }
    }
    
    /**
     * 保存账户列表
     */
    public void saveAccounts() {
        try {
            FileUtils.createDir(ACCOUNTS_FILE.getParentFile());
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            String json = gson.toJson(accounts);
            FileUtils.writeText(ACCOUNTS_FILE, json);
            Logger.info("账户列表已保存");
        } catch (Exception e) {
            Logger.error("保存账户失败", e);
        }
    }
    
    /**
     * 添加离线账户
     */
    public Account addOfflineAccount(String username) {
        // 检查是否已存在
        for (Account acc : accounts) {
            if (acc.getType() == Account.AccountType.OFFLINE && acc.getUsername().equals(username)) {
                return acc;
            }
        }
        
        Account account = Account.createOffline(username);
        accounts.add(account);
        saveAccounts();
        Logger.info("已添加离线账户: " + username);
        return account;
    }
    
    /**
     * 添加微软账户
     */
    public Account addMicrosoftAccount(String username, String uuid, String accessToken) {
        Account account = new Account();
        account.setUsername(username);
        account.setUuid(uuid);
        account.setAccessToken(accessToken);
        account.setClientToken(UUID.randomUUID().toString().replace("-", ""));
        account.setType(Account.AccountType.MICROSOFT);
        
        accounts.add(account);
        saveAccounts();
        Logger.info("已添加微软账户: " + username);
        return account;
    }
    
    /**
     * 添加第三方账户
     */
    public Account addThirdPartyAccount(String username, String uuid, String apiUrl, String token) {
        Account account = new Account();
        account.setUsername(username);
        account.setUuid(uuid);
        account.setAccessToken(token);
        account.setClientToken(apiUrl);
        account.setType(Account.AccountType.THIRD_PARTY);
        
        accounts.add(account);
        saveAccounts();
        Logger.info("已添加第三方账户: " + username);
        return account;
    }
    
    /**
     * 移除账户
     */
    public void removeAccount(Account account) {
        accounts.remove(account);
        if (currentAccount == account) {
            currentAccount = null;
        }
        saveAccounts();
        Logger.info("已移除账户: " + account.getUsername());
    }
    
    /**
     * 设置当前账户
     */
    public void setCurrentAccount(Account account) {
        this.currentAccount = account;
        if (account != null) {
            account.markAsUsed();
            saveAccounts();
        }
        Logger.info("当前账户: " + (account != null ? account.getUsername() : "无"));
    }
    
    /**
     * 获取账户列表
     */
    public List<Account> getAccounts() {
        return new ArrayList<>(accounts);
    }
    
    /**
     * 获取当前账户
     */
    public Account getCurrentAccount() {
        return currentAccount;
    }
    
    /**
     * 验证账户Token
     */
    public boolean validateToken(Account account) {
        if (account.getType() == Account.AccountType.OFFLINE) {
            return true;
        }
        // TODO: 实现正版验证
        return true;
    }
}
