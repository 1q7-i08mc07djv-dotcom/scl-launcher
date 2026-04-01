package com.SCL.core.auth;

import com.SCL.data.Account;
import com.SCL.utils.Logger;
import com.SCL.utils.HttpClient;
import com.google.gson.*;
import java.io.*;
import java.util.*;

/**
 * 第三方登录支持（LittleSkin等）
 */
public class ThirdPartyAuth {
    
    // 常用的第三方皮肤站API
    private static final Map<String, String> SKIN_API = new LinkedHashMap<>();
    static {
        SKIN_API.put("LittleSkin", "https://littleskin.club/api/yggdrasil");
        SKIN_API.put("BMCLAPI", "https://bmclapi2.bangbang93.com/api/yggdrasil");
        SKIN_API.put("MinecraftTools", "https://auth.mcptk.cn/api/yggdrasil");
    }
    
    /**
     * 获取可用的皮肤站列表
     */
    public static Map<String, String> getAvailableServers() {
        return new LinkedHashMap<>(SKIN_API);
    }
    
    /**
     * 添加自定义皮肤站
     */
    public static void addCustomServer(String name, String url) {
        SKIN_API.put(name, url);
    }
    
    /**
     * 通过第三方服务器认证
     */
    public Account authenticate(String apiUrl, String username, String password) throws IOException {
        String authUrl = apiUrl + "/authserver/authenticate";
        
        // 构建请求
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("username", username);
        requestBody.addProperty("password", password);
        requestBody.addProperty("clientToken", UUID.randomUUID().toString().replace("-", ""));
        requestBody.addProperty("requestUser", true);
        
        String json = HttpClient.post(authUrl, requestBody.toString());
        JsonObject response = new Gson().fromJson(json, JsonObject.class);
        
        if (response.has("error")) {
            throw new IOException("认证失败: " + response.get("errorMessage").getAsString());
        }
        
        // 解析响应
        JsonObject accessNode = response.getAsJsonObject("accessToken");
        JsonObject selectedProfile = response.getAsJsonObject("selectedProfile");
        
        Account account = new Account();
        account.setUsername(selectedProfile.get("name").getAsString());
        account.setUuid(selectedProfile.get("id").getAsString());
        account.setAccessToken(accessNode.getAsString());
        account.setClientToken(response.get("clientToken").getAsString());
        account.setType(Account.AccountType.THIRD_PARTY);
        
        // 获取用户信息
        if (response.has("user")) {
            JsonObject user = response.getAsJsonObject("user");
            if (user.has("properties")) {
                JsonArray properties = user.getAsJsonArray("properties");
                for (JsonElement prop : properties) {
                    JsonObject p = prop.getAsJsonObject();
                    if ("textures".equals(p.get("name").getAsString())) {
                        String value = new String(Base64.getDecoder().decode(p.get("value").getAsString()));
                        JsonObject textures = new Gson().fromJson(value, JsonObject.class);
                        
                        if (textures.has("SKIN")) {
                            account.setSkinUrl(textures.getAsJsonObject("SKIN").get("url").getAsString());
                        }
                        if (textures.has("CAPE")) {
                            account.setCapeUrl(textures.getAsJsonObject("CAPE").get("url").getAsString());
                        }
                    }
                }
            }
        }
        
        Logger.info("第三方认证成功: " + account.getUsername());
        return account;
    }
    
    /**
     * 验证Token
     */
    public boolean validate(String apiUrl, Account account) throws IOException {
        String validateUrl = apiUrl + "/authserver/validate";
        
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("accessToken", account.getAccessToken());
        requestBody.addProperty("clientToken", account.getClientToken());
        
        try {
            HttpClient.post(validateUrl, requestBody.toString());
            return true;
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * 刷新Token
     */
    public Account refresh(String apiUrl, Account account) throws IOException {
        String refreshUrl = apiUrl + "/authserver/refresh";
        
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("accessToken", account.getAccessToken());
        requestBody.addProperty("clientToken", account.getClientToken());
        
        String json = HttpClient.post(refreshUrl, requestBody.toString());
        JsonObject response = new Gson().fromJson(json, JsonObject.class);
        
        if (response.has("error")) {
            throw new IOException("刷新失败: " + response.get("errorMessage").getAsString());
        }
        
        account.setAccessToken(response.get("accessToken").getAsString());
        return account;
    }
    
    /**
     * 登出
     */
    public void logout(String apiUrl, Account account) throws IOException {
        String logoutUrl = apiUrl + "/authserver/signout";
        
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("username", account.getUsername());
        
        try {
            HttpClient.post(logoutUrl, requestBody.toString());
        } catch (IOException e) {
            Logger.warn("登出请求失败: " + e.getMessage());
        }
    }
}
