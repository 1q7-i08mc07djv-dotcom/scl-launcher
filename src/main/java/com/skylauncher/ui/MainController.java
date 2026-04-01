package com.SCL.ui;

import com.SCL.Launcher;
import com.SCL.data.*;
import com.SCL.utils.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.image.*;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.*;
import javafx.scene.text.Text;
import javafx.stage.Stage;
import java.util.List;

/**
 * 主界面控制器
 */
public class MainController {
    
    @FXML private Label statusLabel;
    @FXML private Label memoryLabel;
    @FXML private Label versionLabel;
    @FXML private Label accountLabel;
    
    @FXML private VBox sideNav;
    @FXML private StackPane contentArea;
    
    @FXML private ListView<GameVersion> versionList;
    @FXML private ListView<Account> accountListView;
    
    @FXML private ComboBox<String> memorySlider;
    @FXML private TextField javaPathField;
    @FXML private TextField gameDirField;
    
    // Observable列表
    private ObservableList<GameVersion> versionItems = FXCollections.observableArrayList();
    private ObservableList<Account> accountItems = FXCollections.observableArrayList();
    
    private String currentPage = "home";
    private GameVersion selectedVersion;
    private Account currentAccount;
    
    /**
     * 初始化控制器
     */
    @FXML
    public void initialize() {
        // 初始化列表
        versionList.setItems(versionItems);
        accountListView.setItems(accountItems);
        
        // 设置单元格工厂
        versionList.setCellFactory(lv -> new VersionListCell());
        accountListView.setCellFactory(lv -> new AccountListCell());
        
        // 加载数据
        loadVersions();
        loadAccounts();
        
        // 更新状态栏
        updateStatusBar();
        
        // 显示主页
        showHome();
    }
    
    /**
     * 加载版本列表
     */
    private void loadVersions() {
        VersionManager vm = Launcher.getInstance().getVersionManager();
        vm.refreshVersions();
        
        Platform.runLater(() -> {
            versionItems.clear();
            versionItems.addAll(vm.getVersions());
            statusLabel.setText("已加载 " + versionItems.size() + " 个版本");
        });
    }
    
    /**
     * 加载账户列表
     */
    private void loadAccounts() {
        AuthManager am = Launcher.getInstance().getAuthManager();
        List<Account> accounts = am.getAccounts();
        
        Platform.runLater(() -> {
            accountItems.clear();
            accountItems.addAll(accounts);
            
            // 设置当前账户
            currentAccount = am.getCurrentAccount();
            if (currentAccount != null) {
                accountLabel.setText(currentAccount.getUsername());
            }
        });
    }
    
    /**
     * 更新状态栏
     */
    private void updateStatusBar() {
        memoryLabel.setText("内存: " + Runtime.getRuntime().freeMemory() / 1024 / 1024 + "MB / " + 
                           Runtime.getRuntime().maxMemory() / 1024 / 1024 + "MB");
        versionLabel.setText("SCL v1.0.0");
    }
    
    // ==================== 导航事件 ====================
    
    @FXML
    private void onHomeClick(MouseEvent event) {
        showHome();
    }
    
    @FXML
    private void onVersionsClick(MouseEvent event) {
        showVersions();
    }
    
    @FXML
    private void onAccountsClick(MouseEvent event) {
        showAccounts();
    }
    
    @FXML
    private void onSettingsClick(MouseEvent event) {
        showSettings();
    }
    
    // ==================== 页面显示 ====================
    
    private void showHome() {
        currentPage = "home";
        contentArea.getChildren().clear();
        
        VBox homeBox = new VBox(20);
        homeBox.setPadding(new Insets(30));
        homeBox.setStyle("-fx-background-color: #1A1A2E;");
        
        // Logo和标题
        Label title = new Label("SCL");
        title.setStyle("-fx-font-size: 48px; -fx-font-weight: bold; -fx-text-fill: #E94560;");
        
        Label subtitle = new Label("Minecraft 启动器");
        subtitle.setStyle("-fx-font-size: 18px; -fx-text-fill: #B0B0B0;");
        
        // 快速开始卡片
        HBox cards = new HBox(20);
        
        // 版本卡片
        VBox versionCard = createQuickCard("🎮", "版本管理", 
            "管理已安装的游戏版本\n快速切换不同的Minecraft版本");
        versionCard.setOnMouseClicked(e -> showVersions());
        
        // 账户卡片
        VBox accountCard = createQuickCard("👤", "账户管理", 
            currentAccount != null ? "当前: " + currentAccount.getUsername() : "未登录账户");
        accountCard.setOnMouseClicked(e -> showAccounts());
        
        // 设置卡片
        VBox settingsCard = createQuickCard("⚙️", "游戏设置", 
            "配置Java、内存和启动参数");
        settingsCard.setOnMouseClicked(e -> showSettings());
        
        cards.getChildren().addAll(versionCard, accountCard, settingsCard);
        
        // 启动按钮
        Button launchBtn = new Button("▶ 启动游戏");
        launchBtn.setStyle("-fx-background-color: #E94560; -fx-text-fill: white; " +
                         "-fx-font-size: 24px; -fx-padding: 20 60; -fx-background-radius: 10;");
        launchBtn.setOnAction(e -> onLaunchGame());
        
        homeBox.getChildren().addAll(title, subtitle, cards, launchBtn);
        contentArea.getChildren().add(homeBox);
    }
    
    private VBox createQuickCard(String emoji, String title, String desc) {
        VBox card = new VBox(10);
        card.setStyle("-fx-background-color: #16213E; -fx-padding: 25; -fx-background-radius: 12; " +
                     "-fx-cursor: hand;");
        card.setPrefWidth(250);
        card.setPrefHeight(180);
        
        Label emojiLabel = new Label(emoji);
        emojiLabel.setStyle("-fx-font-size: 36px;");
        
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: white;");
        
        Label descLabel = new Label(desc);
        descLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #B0B0B0;");
        descLabel.setWrapText(true);
        
        card.getChildren().addAll(emojiLabel, titleLabel, descLabel);
        
        // Hover效果
        card.setOnMouseEntered(e -> card.setStyle("-fx-background-color: #1E3A5F; -fx-padding: 25; " +
                                                  "-fx-background-radius: 12; -fx-cursor: hand;"));
        card.setOnMouseExited(e -> card.setStyle("-fx-background-color: #16213E; -fx-padding: 25; " +
                                                  "-fx-background-radius: 12; -fx-cursor: hand;"));
        
        return card;
    }
    
    private void showVersions() {
        currentPage = "versions";
        contentArea.getChildren().clear();
        
        VBox vBox = new VBox(15);
        vBox.setPadding(new Insets(20));
        vBox.setStyle("-fx-background-color: #1A1A2E;");
        
        // 标题栏
        HBox header = new HBox();
        Label title = new Label("游戏版本");
        title.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: white;");
        
        Button refreshBtn = new Button("🔄 刷新");
        refreshBtn.setStyle("-fx-background-color: #16213E; -fx-text-fill: white; -fx-padding: 8 16;");
        refreshBtn.setOnAction(e -> {
            statusLabel.setText("正在刷新版本列表...");
            loadVersions();
        });
        
        HBox spacer = new HBox();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        header.getChildren().addAll(title, spacer, refreshBtn);
        
        // 版本列表
        versionList.setStyle("-fx-background-color: #16213E; -fx-control-inner-background: #16213E;");
        
        // 底部按钮
        HBox bottomBar = new HBox(10);
        Button installBtn = new Button("📥 安装");
        Button deleteBtn = new Button("🗑️ 删除");
        Button playBtn = new Button("▶ 启动");
        
        for (Button btn : new Button[]{installBtn, deleteBtn, playBtn}) {
            btn.setStyle("-fx-background-color: #1E88E5; -fx-text-fill: white; -fx-padding: 10 20;");
        }
        
        installBtn.setOnAction(e -> {
            if (selectedVersion != null && !selectedVersion.isInstalled()) {
                installVersion(selectedVersion);
            }
        });
        
        playBtn.setOnAction(e -> onLaunchGame());
        
        // 版本选择监听
        versionList.getSelectionModel().selectedItemProperty().addListener((obs, old, newVal) -> {
            selectedVersion = newVal;
        });
        
        bottomBar.getChildren().addAll(installBtn, deleteBtn, playBtn);
        
        vBox.getChildren().addAll(header, versionList, bottomBar);
        VBox.setVgrow(versionList, Priority.ALWAYS);
        
        contentArea.getChildren().add(vBox);
    }
    
    private void showAccounts() {
        currentPage = "accounts";
        contentArea.getChildren().clear();
        
        VBox vBox = new VBox(15);
        vBox.setPadding(new Insets(20));
        vBox.setStyle("-fx-background-color: #1A1A2E;");
        
        Label title = new Label("账户管理");
        title.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: white;");
        
        // 添加账户按钮
        HBox addBar = new HBox(10);
        
        Button offlineBtn = new Button("➕ 离线账户");
        Button microsoftBtn = new Button("🌐 微软账户");
        Button thirdBtn = new Button("🎨 第三方登录");
        
        for (Button btn : new Button[]{offlineBtn, microsoftBtn, thirdBtn}) {
            btn.setStyle("-fx-background-color: #1E88E5; -fx-text-fill: white; -fx-padding: 10 20;");
        }
        
        offlineBtn.setOnAction(e -> showAddOfflineDialog());
        
        // 账户列表
        accountListView.setStyle("-fx-background-color: #16213E; -fx-control-inner-background: #16213E;");
        
        HBox bottomBar = new HBox(10);
        Button useBtn = new Button("✓ 使用此账户");
        Button deleteBtn = new Button("🗑️ 删除");
        
        for (Button btn : new Button[]{useBtn, deleteBtn}) {
            btn.setStyle("-fx-background-color: #E94560; -fx-text-fill: white; -fx-padding: 10 20;");
        }
        
        useBtn.setOnAction(e -> {
            Account selected = accountListView.getSelectionModel().getSelectedItem();
            if (selected != null) {
                Launcher.getInstance().getAuthManager().setCurrentAccount(selected);
                currentAccount = selected;
                accountLabel.setText(selected.getUsername());
                statusLabel.setText("已选择账户: " + selected.getUsername());
            }
        });
        
        deleteBtn.setOnAction(e -> {
            Account selected = accountListView.getSelectionModel().getSelectedItem();
            if (selected != null) {
                Launcher.getInstance().getAuthManager().removeAccount(selected);
                loadAccounts();
            }
        });
        
        addBar.getChildren().addAll(offlineBtn, microsoftBtn, thirdBtn);
        bottomBar.getChildren().addAll(useBtn, deleteBtn);
        
        vBox.getChildren().addAll(title, addBar, accountListView, bottomBar);
        VBox.setVgrow(accountListView, Priority.ALWAYS);
        
        contentArea.getChildren().add(vBox);
    }
    
    private void showSettings() {
        currentPage = "settings";
        contentArea.getChildren().clear();
        
        VBox vBox = new VBox(20);
        vBox.setPadding(new Insets(20));
        vBox.setStyle("-fx-background-color: #1A1A2E;");
        
        Label title = new Label("游戏设置");
        title.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: white;");
        
        // 设置表单
        GridPane grid = new GridPane();
        grid.setHgap(20);
        grid.setVgap(15);
        grid.setStyle("-fx-background-color: #16213E; -fx-padding: 20; -fx-background-radius: 10;");
        
        Config config = Launcher.getInstance().getConfig();
        
        // Java路径
        Label javaLabel = new Label("Java路径:");
        javaLabel.setStyle("-fx-text-fill: white;");
        javaPathField = new TextField(config.getJavaPath());
        javaPathField.setStyle("-fx-background-color: #0F0F23; -fx-text-fill: white; -fx-padding: 10;");
        
        // 游戏目录
        Label dirLabel = new Label("游戏目录:");
        dirLabel.setStyle("-fx-text-fill: white;");
        gameDirField = new TextField(config.getGameDir());
        gameDirField.setStyle("-fx-background-color: #0F0F23; -fx-text-fill: white; -fx-padding: 10;");
        
        // 内存设置
        Label memLabel = new Label("最大内存 (MB):");
        memLabel.setStyle("-fx-text-fill: white;");
        Spinner<Integer> memSpinner = new Spinner<>(512, 16384, config.getMaxMemory(), 256);
        memSpinner.setStyle("-fx-background-color: #0F0F23; -fx-text-fill: white;");
        
        // 分辨率
        Label resLabel = new Label("分辨率:");
        resLabel.setStyle("-fx-text-fill: white;");
        HBox resBox = new HBox(10);
        Spinner<Integer> widthSpinner = new Spinner<>(640, 3840, config.getWidth(), 1);
        Spinner<Integer> heightSpinner = new Spinner<>(480, 2160, config.getHeight(), 1);
        widthSpinner.setStyle("-fx-background-color: #0F0F23; -fx-text-fill: white;");
        heightSpinner.setStyle("-fx-background-color: #0F0F23; -fx-text-fill: white;");
        resBox.getChildren().addAll(widthSpinner, new Label("×"), heightSpinner);
        
        // 保存按钮
        Button saveBtn = new Button("💾 保存设置");
        saveBtn.setStyle("-fx-background-color: #E94560; -fx-text-fill: white; -fx-padding: 12 30;");
        saveBtn.setOnAction(e -> {
            config.setJavaPath(javaPathField.getText());
            config.setGameDir(gameDirField.getText());
            config.setMaxMemory(memSpinner.getValue());
            config.setWidth(widthSpinner.getValue());
            config.setHeight(heightSpinner.getValue());
            config.save();
            statusLabel.setText("设置已保存!");
        });
        
        int row = 0;
        grid.add(javaLabel, 0, row);
        grid.add(javaPathField, 1, row++);
        grid.add(dirLabel, 0, row);
        grid.add(gameDirField, 1, row++);
        grid.add(memLabel, 0, row);
        grid.add(memSpinner, 1, row++);
        grid.add(resLabel, 0, row);
        grid.add(resBox, 1, row++);
        
        vBox.getChildren().addAll(title, grid, saveBtn);
        
        contentArea.getChildren().add(vBox);
    }
    
    // ==================== 对话框 ====================
    
    private void showAddOfflineDialog() {
        Dialog<Account> dialog = new Dialog<>();
        dialog.setTitle("添加离线账户");
        dialog.setHeaderText("输入用户名");
        
        DialogPane pane = dialog.getDialogPane();
        pane.setStyle("-fx-background-color: #1A1A2E;");
        
        TextField usernameField = new TextField();
        usernameField.setPromptText("用户名");
        usernameField.setStyle("-fx-background-color: #16213E; -fx-text-fill: white; -fx-padding: 10;");
        
        pane.setContent(usernameField);
        pane.getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        
        dialog.setResultConverter(btn -> {
            if (btn == ButtonType.OK) {
                String username = usernameField.getText().trim();
                if (!username.isEmpty()) {
                    return Launcher.getInstance().getAuthManager().addOfflineAccount(username);
                }
            }
            return null;
        });
        
        dialog.showAndWait().ifPresent(account -> {
            loadAccounts();
            statusLabel.setText("已添加离线账户: " + account.getUsername());
        });
    }
    
    // ==================== 游戏操作 ====================
    
    private void installVersion(GameVersion version) {
        statusLabel.setText("正在安装 " + version.getId() + "...");
        
        new Thread(() -> {
            Launcher.getInstance().getVersionManager().installVersion(version.getId(), 
                new com.SCL.core.version.VersionManager.DownloadProgressListener() {
                    @Override
                    public void onProgress(int percentage, String currentFile) {
                        Platform.runLater(() -> statusLabel.setText("下载中: " + percentage + "%"));
                    }
                    
                    @Override
                    public void onComplete(String versionId) {
                        Platform.runLater(() -> {
                            loadVersions();
                            statusLabel.setText("版本安装完成: " + versionId);
                        });
                    }
                    
                    @Override
                    public void onError(String error) {
                        Platform.runLater(() -> statusLabel.setText("安装失败: " + error));
                    }
                });
        }).start();
    }
    
    private void onLaunchGame() {
        if (selectedVersion == null) {
            // 使用列表中的第一个版本
            List<GameVersion> installed = Launcher.getInstance().getVersionManager().getInstalledVersions();
            if (installed.isEmpty()) {
                statusLabel.setText("请先安装一个游戏版本!");
                return;
            }
            selectedVersion = installed.get(0);
        }
        
        if (currentAccount == null) {
            // 使用第一个账户
            List<Account> accounts = Launcher.getInstance().getAuthManager().getAccounts();
            if (accounts.isEmpty()) {
                statusLabel.setText("请先添加一个账户!");
                showAccounts();
                return;
            }
            currentAccount = accounts.get(0);
        }
        
        statusLabel.setText("正在启动 " + selectedVersion.getId() + "...");
        
        new Thread(() -> {
            Process process = Launcher.getInstance().getGameLauncher().launch(selectedVersion, currentAccount);
            if (process != null) {
                Platform.runLater(() -> statusLabel.setText("游戏运行中..."));
            } else {
                Platform.runLater(() -> statusLabel.setText("启动失败!"));
            }
        }).start();
    }
    
    // ==================== 内部类 ====================
    
    static class VersionListCell extends ListCell<GameVersion> {
        @Override
        protected void updateItem(GameVersion version, boolean empty) {
            super.updateItem(version, empty);
            if (empty || version == null) {
                setText(null);
                setGraphic(null);
            } else {
                String style = version.isInstalled() ? "#4CAF50" : "#FF9800";
                String status = version.isInstalled() ? "✓ 已安装" : "○ 未安装";
                String type = version.getVersionType().getDisplayName();
                
                VBox box = new VBox(5);
                box.setStyle("-fx-background-color: #16213E; -fx-padding: 10;");
                
                Label nameLabel = new Label(version.getId());
                nameLabel.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: white;");
                
                Label infoLabel = new Label(type + " | " + status);
                infoLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #B0B0B0;");
                
                box.getChildren().addAll(nameLabel, infoLabel);
                setGraphic(box);
            }
        }
    }
    
    static class AccountListCell extends ListCell<Account> {
        @Override
        protected void updateItem(Account account, boolean empty) {
            super.updateItem(account, empty);
            if (empty || account == null) {
                setText(null);
                setGraphic(null);
            } else {
                String emoji = account.getType() == Account.AccountType.OFFLINE ? "👤" :
                              account.getType() == Account.AccountType.MICROSOFT ? "🌐" : "🎨";
                
                VBox box = new VBox(5);
                box.setStyle("-fx-background-color: #16213E; -fx-padding: 10;");
                
                Label nameLabel = new Label(emoji + " " + account.getUsername());
                nameLabel.setStyle("-fx-font-size: 16px; -fx-font-weight: bold; -fx-text-fill: white;");
                
                Label typeLabel = new Label(account.getType().getDisplayName());
                typeLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: #B0B0B0;");
                
                box.getChildren().addAll(nameLabel, typeLabel);
                setGraphic(box);
            }
        }
    }
    
    // ==================== 窗口控制 ====================
    
    @FXML
    private void onMinimize() {
        ((Stage) statusLabel.getScene().getWindow()).setIconified(true);
    }
    
    @FXML
    private void onClose() {
        Launcher.getInstance().shutdown();
        Platform.exit();
    }
}
