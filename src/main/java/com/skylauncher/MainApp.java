package com.scl;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import java.io.InputStream;

/**
 * JavaFX应用主类
 */
public class MainApp extends Application {
    
    private static Stage primaryStage;
    
    @Override
    public void start(Stage stage) {
        try {
            System.out.println("正在加载界面...");
            primaryStage = stage;
            
            // 加载主界面
            FXMLLoader loader = new FXMLLoader();
            InputStream fxmlStream = getClass().getResourceAsStream("/fxml/main.fxml");
            
            if (fxmlStream == null) {
                throw new RuntimeException("无法找到 main.fxml 文件！请检查资源文件是否正确打包。");
            }
            
            Parent root = loader.load(fxmlStream);
            fxmlStream.close();
            
            Scene scene = new Scene(root, 1280, 800);
            
            // 加载CSS样式
            String cssPath = getClass().getResource("/css/style.css").toExternalForm();
            if (cssPath != null) {
                scene.getStylesheets().add(cssPath);
            }
            
            // 设置窗口
            stage.setTitle("SCL - Minecraft启动器");
            stage.setScene(scene);
            stage.setMinWidth(1024);
            stage.setMinHeight(680);
            stage.show();
            
            // 初始化启动器
            System.out.println("初始化启动器...");
            Launcher.getInstance().init();
            
        } catch (Exception e) {
            System.err.println("加载界面失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @Override
    public void stop() {
        System.out.println("SCL 正在关闭...");
        try {
            Launcher.getInstance().shutdown();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static Stage getPrimaryStage() {
        return primaryStage;
    }
}
