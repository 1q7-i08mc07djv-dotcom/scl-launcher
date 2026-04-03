package com.scl.backend.model;

public class AppConfig {
    private String language = "zh-CN";
    private String theme = "dark";
    private String javaPath = "";
    private boolean autoJava = true;
    private String memory = "2G";
    private String jvmArgs = "";
    private String downloadSource = "BMCLAPI";
    private String gitcodeToken = "";

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public String getJavaPath() { return javaPath; }
    public void setJavaPath(String javaPath) { this.javaPath = javaPath; }
    public boolean isAutoJava() { return autoJava; }
    public void setAutoJava(boolean autoJava) { this.autoJava = autoJava; }
    public String getMemory() { return memory; }
    public void setMemory(String memory) { this.memory = memory; }
    public String getJvmArgs() { return jvmArgs; }
    public void setJvmArgs(String jvmArgs) { this.jvmArgs = jvmArgs; }
    public String getDownloadSource() { return downloadSource; }
    public void setDownloadSource(String downloadSource) { this.downloadSource = downloadSource; }
    public String getGitcodeToken() { return gitcodeToken; }
    public void setGitcodeToken(String gitcodeToken) { this.gitcodeToken = gitcodeToken; }
}
