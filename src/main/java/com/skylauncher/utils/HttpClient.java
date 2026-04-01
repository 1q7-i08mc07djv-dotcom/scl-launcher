package com.SCL.utils;

import okhttp3.*;
import java.io.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;

/**
 * HTTP客户端
 */
public class HttpClient {
    
    private static final OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build();
    
    /**
     * GET请求
     */
    public static String get(String url) throws IOException {
        Request request = new Request.Builder()
            .url(url)
            .addHeader("User-Agent", "SCL/1.0")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code() + ": " + response.message());
            }
            return response.body().string();
        }
    }
    
    /**
     * GET请求（异步，带进度回调）
     */
    public static void download(String url, File destFile, DownloadProgressListener listener) throws IOException {
        Request request = new Request.Builder()
            .url(url)
            .addHeader("User-Agent", "SCL/1.0")
            .build();
        
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Logger.error("下载失败: " + url, e);
                if (listener != null) {
                    listener.onError(e.getMessage());
                }
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    Logger.error("HTTP " + response.code());
                    if (listener != null) {
                        listener.onError("HTTP " + response.code());
                    }
                    return;
                }
                
                long totalBytes = response.body().contentLength();
                
                try (InputStream input = response.body().byteStream();
                     FileOutputStream output = new FileOutputStream(destFile)) {
                    
                    byte[] buffer = new byte[8192];
                    long downloaded = 0;
                    int read;
                    
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        downloaded += read;
                        
                        if (listener != null && totalBytes > 0) {
                            int progress = (int) (downloaded * 100 / totalBytes);
                            listener.onProgress(downloaded, totalBytes, progress);
                        }
                    }
                    
                    if (listener != null) {
                        listener.onComplete(destFile);
                    }
                }
            }
        });
    }
    
    /**
     * 同步下载文件
     */
    public static void downloadSync(String url, File destFile) throws IOException {
        Request request = new Request.Builder()
            .url(url)
            .addHeader("User-Agent", "SCL/1.0")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code());
            }
            
            try (InputStream input = response.body().byteStream();
                 FileOutputStream output = new FileOutputStream(destFile)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
            }
        }
    }
    
    /**
     * POST请求
     */
    public static String post(String url, String json) throws IOException {
        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(json, JSON);
        
        Request request = new Request.Builder()
            .url(url)
            .post(body)
            .addHeader("User-Agent", "SCL/1.0")
            .addHeader("Content-Type", "application/json")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code());
            }
            return response.body().string();
        }
    }
    
    /**
     * 下载进度监听器
     */
    public interface DownloadProgressListener {
        void onProgress(long downloaded, long total, int percentage);
        void onComplete(File file);
        void onError(String error);
    }
}
