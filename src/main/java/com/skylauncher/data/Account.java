package com.SCL.data;

import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * 账户数据类
 */
public class Account implements Serializable {
    
    private String uuid;
    private String username;
    private String accessToken;
    private String clientToken;
    private AccountType type;
    private String skinUrl;
    private String capeUrl;
    private long createdAt;
    private long lastUsed;
    
    public enum AccountType {
        OFFLINE("离线账户"),
        MICROSOFT("微软账户"),
        THIRD_PARTY("第三方账户");
        
        private final String displayName;
        
        AccountType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public Account() {
        this.createdAt = System.currentTimeMillis();
    }
    
    /**
     * 创建离线账户
     */
    public static Account createOffline(String username) {
        Account account = new Account();
        account.setUsername(username);
        account.setType(AccountType.OFFLINE);
        account.setUuid(generateOfflineUUID(username));
        account.setAccessToken(UUID.randomUUID().toString().replace("-", ""));
        account.setClientToken(UUID.randomUUID().toString().replace("-", ""));
        return account;
    }
    
    /**
     * 生成离线UUID
     */
    public static String generateOfflineUUID(String username) {
        String uuid = UUID.nameUUIDFromBytes(("OfflinePlayer:" + username).getBytes()).toString();
        return uuid.replace("-", "");
    }
    
    /**
     * 标记为最近使用
     */
    public void markAsUsed() {
        this.lastUsed = System.currentTimeMillis();
    }
    
    // Getters and Setters
    public String getUuid() {
        return uuid;
    }
    
    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public String getClientToken() {
        return clientToken;
    }
    
    public void setClientToken(String clientToken) {
        this.clientToken = clientToken;
    }
    
    public AccountType getType() {
        return type;
    }
    
    public void setType(AccountType type) {
        this.type = type;
    }
    
    public String getSkinUrl() {
        return skinUrl;
    }
    
    public void setSkinUrl(String skinUrl) {
        this.skinUrl = skinUrl;
    }
    
    public String getCapeUrl() {
        return capeUrl;
    }
    
    public void setCapeUrl(String capeUrl) {
        this.capeUrl = capeUrl;
    }
    
    public long getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
    
    public long getLastUsed() {
        return lastUsed;
    }
    
    public void setLastUsed(long lastUsed) {
        this.lastUsed = lastUsed;
    }
    
    @Override
    public String toString() {
        return username + " (" + type.getDisplayName() + ")";
    }
}
