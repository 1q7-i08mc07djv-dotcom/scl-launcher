package com.scl;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import java.io.*;
import java.lang.reflect.Method;

/**
 * SCL - SUPER CRAFT LAUNCHER - Minecraft启动器
 * 程序入口类
 */
public class Main {
    
    private static Stage primaryStage;
    
    public static void main(String[] args) {
        try {
            System.out.println("SCL 启动中...");
            System.out.println("SUPER CRAFT LAUNCHER - Minecraft启动器");
            
            // 设置JavaFX模块路径
            setupJavaFX();
            
            // 启动JavaFX应用
            launchApplication(args);
            
        } catch (Exception e) {
            System.err.println("启动失败: " + e.getMessage());
            e.printStackTrace();
            
            // 显示错误对话框
            showErrorDialog(e);
        }
    }
    
    private static void setupJavaFX() {
        System.setProperty("javafx.preloader", "");
        System.setProperty("glass.platform", "win");
        System.setProperty("monocle.platform", "Off");
        System.setProperty("prism.order", "sw");
    }
    
    private static void launchApplication(String[] args) throws Exception {
        Class<?> appClass = com.scl.MainApp.class;
        Method launchMethod = Application.class.getMethod("launch", Class.class, String[].class);
        launchMethod.invoke(null, appClass, (Object) args);
    }
    
    private static void showErrorDialog(Exception e) {
        try {
            System.err.println("错误: " + e.getMessage());
            javax.swing.JOptionPane.showMessageDialog(null,
                "SCL 启动失败!\n\n错误: " + e.getMessage() + "\n\n请确保已安装 JDK 21 和 JavaFX",
                "启动错误",
                javax.swing.JOptionPane.ERROR_MESSAGE);
        } catch (Exception ex) {
            // 忽略
        }
    }
}
