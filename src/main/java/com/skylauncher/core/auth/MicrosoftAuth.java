package com.SCL.core.auth;

import com.SCL.data.Account;
import com.SCL.utils.Logger;
import com.SCL.utils.HttpClient;
import java.io.*;
import java.net.*;
import java.util.*;

/**
 * 微软OAuth2认证
 */
public class MicrosoftAuth {
    
    // 注意：完整的微软OAuth需要Azure AD应用注册
    // 这里提供简化版本，需要用户手动输入token
    
    private static final String MSA_LOGIN_URL = "https://login.live.com/oauth20_authorize.srf";
    private static final String TOKEN_URL = "https://login.live.com/oauth20_token.srf";
    private static final String XBL_AUTH_URL = "https://user.auth.xboxlive.com/user/authenticate";
    private static final String XSTS_URL = "https://xsts.auth.xboxlive.com/xsts/authorize";
    private static final String MC_LOGIN_URL = "https://api.minecraftservices.com/authentication/login_with_xbox";
    
    private String clientId;
    private String redirectUri;
    
    public MicrosoftAuth() {
        // 使用默认客户端ID
        this.clientId = "00000000402b5328"; // Minecraft官方启动器使用的ID
        this.redirectUri = "http://localhost:25565";
    }
    
    /**
     * 生成OAuth登录URL
     */
    public String getLoginUrl() {
        return MSA_LOGIN_URL + "?client_id=" + clientId + 
               "&response_type=code" +
               "&redirect_uri=" + URLEncoder.encode(redirectUri) +
               "&scope=XboxLive.signin%20offline_access";
    }
    
    /**
     * 使用授权码获取Token
     */
    public Map<String, String> getTokenFromCode(String code) throws IOException {
        String postData = "client_id=" + clientId +
                          "&code=" + code +
                          "&grant_type=authorization_code" +
                          "&redirect_uri=" + URLEncoder.encode(redirectUri);
        
        String response = HttpClient.post(TOKEN_URL, postData);
        return parseTokenResponse(response);
    }
    
    /**
     * 刷新Token
     */
    public Map<String, String> refreshToken(String refreshToken) throws IOException {
        String postData = "client_id=" + clientId +
                          "&refresh_token=" + refreshToken +
                          "&grant_type=refresh_token";
        
        String response = HttpClient.post(TOKEN_URL, postData);
        return parseTokenResponse(response);
    }
    
    /**
     * Xbox Live认证
     */
    public String authenticateXbox(String accessToken) throws IOException {
        String requestBody = "{\"Properties\":{\"AuthMethod\":\"RPS\",\"SiteName\":\"user.auth.xboxlive.com\",\"RpsTicket\":\"" + 
                             "d=" + accessToken + "\"},\"RelyingParty\":\"http://auth.xboxlive.com\",\"TokenType\":\"JWT\"}";
        
        String response = HttpClient.post(XBL_AUTH_URL, requestBody);
        return extractJsonValue(response, "Token");
    }
    
    /**
     * XSTS认证
     */
    public String authenticateXSTS(String xblToken) throws IOException {
        String requestBody = "{\"Properties\":{\"SandboxId\":\"RETAIL\",\"UserTokens\":[\"" + xblToken + "\"]},\"RelyingParty\":\"rp://api.minecraftservices.com/\",\"TokenType\":\"JWT\"}";
        
        String response = HttpClient.post(XSTS_URL, requestBody);
        return extractJsonValue(response, "Token");
    }
    
    /**
     * Minecraft服务认证
     */
    public Account authenticateMinecraft(String xstsToken, String uhs) throws IOException {
        String requestBody = "{\"identityToken\":\"XBL3.0 x=" + uhs + ";" + xstsToken + "\",\"platform\":\"PC_LAUNCHER\"}";
        
        String response = HttpClient.post(MC_LOGIN_URL, requestBody);
        
        // 解析响应
        String username = extractJsonValue(response, "username");
        String mcToken = extractJsonValue(response, "access_token");
        String uuid = extractJsonValue(response, "sub");
        
        Account account = new Account();
        account.setUsername(username);
        account.setUuid(uuid);
        account.setAccessToken(mcToken);
        account.setType(Account.AccountType.MICROSOFT);
        
        return account;
    }
    
    /**
     * 解析Token响应
     */
    private Map<String, String> parseTokenResponse(String response) {
        Map<String, String> tokens = new HashMap<>();
        tokens.put("access_token", extractJsonValue(response, "access_token"));
        tokens.put("refresh_token", extractJsonValue(response, "refresh_token"));
        tokens.put("expires_in", extractJsonValue(response, "expires_in"));
        return tokens;
    }
    
    /**
     * 从JSON中提取指定键的值
     */
    private String extractJsonValue(String json, String key) {
        try {
            int keyIndex = json.indexOf("\"" + key + "\"");
            if (keyIndex == -1) return null;
            
            int colonIndex = json.indexOf(":", keyIndex);
            int startIndex = json.indexOf("\"", colonIndex);
            int endIndex = json.indexOf("\"", startIndex + 1);
            
            return json.substring(startIndex + 1, endIndex);
        } catch (Exception e) {
            Logger.error("解析JSON失败: " + key, e);
            return null;
        }
    }
}
