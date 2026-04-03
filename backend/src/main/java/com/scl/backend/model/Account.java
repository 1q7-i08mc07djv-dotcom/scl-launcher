package com.scl.backend.model;

public class Account {
    private String id;
    private String type; // offline, microsoft, thirdparty
    private String username;
    private String uuid;
    private String token;

    public Account() {}

    public Account(String id, String type, String username) {
        this.id = id;
        this.type = type;
        this.username = username;
        if ("offline".equals(type)) {
            this.uuid = generateOfflineUUID(username);
        }
    }

    public static String generateOfflineUUID(String username) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] bytes = ("OfflinePlayer:" + username).getBytes(java.nio.charset.StandardCharsets.UTF_8);
            byte[] digest = md.digest(bytes);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < digest.length; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.substring(0, 8) + "-" + sb.substring(8, 12) + "-" + sb.substring(12, 16) + "-" + sb.substring(16, 20) + "-" + sb.substring(20);
        } catch (Exception e) {
            return "00000000-0000-0000-0000-000000000000";
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
