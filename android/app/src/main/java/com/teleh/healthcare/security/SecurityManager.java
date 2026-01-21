package com.teleh.healthcare.security;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.app.Activity;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.security.SecureRandom;

public class SecurityManager {
    
    private static final String TAG = "SecurityManager";
    private final Context context;
    private static SecurityManager instance;
    
    private SecurityManager(Context context) {
        this.context = context.getApplicationContext();
    }
    
    public static synchronized SecurityManager getInstance(Context context) {
        if (instance == null) {
            instance = new SecurityManager(context);
        }
        return instance;
    }
    
    public boolean isRooted() {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3();
    }
    
    private boolean checkRootMethod1() {
        String buildTags = Build.TAGS;
        return buildTags != null && buildTags.contains("test-keys");
    }
    
    private boolean checkRootMethod2() {
        String[] paths = {
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su",
            "/system/app/SuperSU.apk",
            "/system/app/SuperSU/SuperSU.apk",
            "/system/xbin/daemonsu",
            "/system/etc/init.d/99telecast"
        };
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }
    
    private boolean checkRootMethod3() {
        Process process = null;
        try {
            process = Runtime.getRuntime().exec(new String[] { "/system/xbin/which", "su" });
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            if (in.readLine() != null) return true;
            return false;
        } catch (Throwable t) {
            return false;
        } finally {
            if (process != null) process.destroy();
        }
    }
    
    public boolean isHookingFrameworkDetected() {
        return isFridaDetected() || isXposedDetected() || isSubstrateDetected();
    }
    
    private boolean isFridaDetected() {
        try {
            String[] fridaFiles = {
                "frida-server",
                "frida-agent",
                "frida-gadget",
                "libfrida-gadget.so"
            };
            
            String[] paths = {
                "/data/local/tmp/",
                "/data/local/",
                "/system/lib/",
                "/system/lib64/"
            };
            
            for (String path : paths) {
                for (String file : fridaFiles) {
                    if (new File(path + file).exists()) {
                        return true;
                    }
                }
            }
            
            try {
                java.net.Socket socket = new java.net.Socket("127.0.0.1", 27042);
                socket.close();
                return true;
            } catch (Exception e) {
            }
            
            try {
                java.net.Socket socket = new java.net.Socket("127.0.0.1", 27043);
                socket.close();
                return true;
            } catch (Exception e) {
            }
            
        } catch (Exception e) {
        }
        return false;
    }
    
    private boolean isXposedDetected() {
        try {
            throw new Exception("Xposed detection");
        } catch (Exception e) {
            StackTraceElement[] stackTrace = e.getStackTrace();
            for (StackTraceElement element : stackTrace) {
                if (element.getClassName().contains("de.robv.android.xposed") ||
                    element.getClassName().contains("com.saurik.substrate")) {
                    return true;
                }
            }
        }
        
        String[] xposedPackages = {
            "de.robv.android.xposed.installer",
            "com.saurik.substrate",
            "de.robv.android.xposed",
            "io.va.exposed"
        };
        
        PackageManager pm = context.getPackageManager();
        for (String pkg : xposedPackages) {
            try {
                pm.getPackageInfo(pkg, 0);
                return true;
            } catch (PackageManager.NameNotFoundException e) {
            }
        }
        
        return false;
    }
    
    private boolean isSubstrateDetected() {
        try {
            Class.forName("com.saurik.substrate.MS");
            return true;
        } catch (ClassNotFoundException e) {
        }
        return false;
    }
    
    public boolean isDeveloperOptionsEnabled() {
        return Settings.Secure.getInt(context.getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1;
    }
    
    public boolean isAdbEnabled() {
        return Settings.Global.getInt(context.getContentResolver(),
                Settings.Global.ADB_ENABLED, 0) == 1;
    }
    
    public boolean isDebuggable() {
        return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }
    
    public void enableTapjackingProtection(Activity activity) {
        if (activity != null && activity.getWindow() != null) {
            activity.getWindow().getDecorView().setFilterTouchesWhenObscured(true);
        }
    }
    
    public void enableScreenshotProtection(Activity activity) {
        if (activity != null && activity.getWindow() != null) {
            activity.getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            );
        }
    }
    
    public void applySecurityProtections(Activity activity) {
        enableTapjackingProtection(activity);
        enableScreenshotProtection(activity);
    }
    
    public byte[] generateSecureRandomBytes(int length) {
        SecureRandom secureRandom = new SecureRandom();
        byte[] bytes = new byte[length];
        secureRandom.nextBytes(bytes);
        return bytes;
    }
    
    public String generateSecureToken(int length) {
        SecureRandom secureRandom = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return sb.toString();
    }
    
    public boolean performSecurityChecks() {
        if (isRooted()) {
            return false;
        }
        
        if (isHookingFrameworkDetected()) {
            return false;
        }
        
        if (isDebuggable()) {
            return false;
        }
        
        return true;
    }
    
    public String getSecurityStatus() {
        StringBuilder status = new StringBuilder();
        status.append("Security Status:\n");
        status.append("- Rooted: ").append(isRooted() ? "YES (RISK)" : "NO").append("\n");
        status.append("- Hooking Framework: ").append(isHookingFrameworkDetected() ? "DETECTED (RISK)" : "NOT DETECTED").append("\n");
        status.append("- Developer Options: ").append(isDeveloperOptionsEnabled() ? "ENABLED" : "DISABLED").append("\n");
        status.append("- ADB: ").append(isAdbEnabled() ? "ENABLED" : "DISABLED").append("\n");
        status.append("- Debuggable: ").append(isDebuggable() ? "YES (RISK)" : "NO").append("\n");
        return status.toString();
    }
}
