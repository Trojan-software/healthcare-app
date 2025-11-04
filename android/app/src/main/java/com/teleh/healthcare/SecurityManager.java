package com.teleh.healthcare;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

public class SecurityManager {
    private static final String TAG = "SecurityManager";
    private final Context context;

    public SecurityManager(Context context) {
        this.context = context;
    }

    /**
     * Root Detection - Check if device is rooted
     * Severity: HIGH (6.8)
     */
    public boolean isDeviceRooted() {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3();
    }

    // Check for su binary
    private boolean checkRootMethod1() {
        String[] paths = {
            "/system/app/Superuser.apk",
            "/sbin/su", "/system/bin/su", "/system/xbin/su",
            "/data/local/xbin/su", "/data/local/bin/su",
            "/system/sd/xbin/su", "/system/bin/failsafe/su",
            "/data/local/su", "/su/bin/su"
        };
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    // Check for root management apps
    private boolean checkRootMethod2() {
        String[] packages = {
            "com.noshufou.android.su",
            "com.noshufou.android.su.elite",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellow.flashtool",
            "com.topjohnwu.magisk"
        };

        PackageManager pm = context.getPackageManager();
        for (String packageName : packages) {
            try {
                pm.getPackageInfo(packageName, 0);
                return true;
            } catch (PackageManager.NameNotFoundException e) {
                // Package not found, continue
            }
        }
        return false;
    }

    // Check for test-keys
    private boolean checkRootMethod3() {
        String buildTags = Build.TAGS;
        return buildTags != null && buildTags.contains("test-keys");
    }

    /**
     * Developer Options Detection
     * Severity: LOW (3.4)
     */
    public boolean isDeveloperOptionsEnabled() {
        try {
            return Settings.Global.getInt(
                context.getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
            ) != 0;
        } catch (Exception e) {
            Log.e(TAG, "Error checking developer options", e);
            return false;
        }
    }

    /**
     * ADB (Android Debug Bridge) Detection
     * Severity: LOW (3.4)
     */
    public boolean isAdbEnabled() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                return Settings.Global.getInt(
                    context.getContentResolver(),
                    Settings.Global.ADB_ENABLED, 0
                ) != 0;
            } else {
                return Settings.Secure.getInt(
                    context.getContentResolver(),
                    Settings.Secure.ADB_ENABLED, 0
                ) != 0;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking ADB status", e);
            return false;
        }
    }

    /**
     * Hooking Detection - Check for Frida, Xposed, Substrate
     * Severity: MEDIUM (5.7)
     */
    public boolean isHookingDetected() {
        return checkForFrida() || checkForXposed() || checkForSubstrate();
    }

    private boolean checkForFrida() {
        // Check for Frida server port
        try {
            File fridaFile = new File("/data/local/tmp/frida-server");
            if (fridaFile.exists()) return true;
        } catch (Exception e) {
            // Ignored
        }

        // Check for Frida libraries in memory
        try {
            Process process = Runtime.getRuntime().exec("cat /proc/self/maps");
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.toLowerCase().contains("frida")) {
                    reader.close();
                    return true;
                }
            }
            reader.close();
        } catch (Exception e) {
            // Ignored
        }

        return false;
    }

    private boolean checkForXposed() {
        try {
            PackageManager pm = context.getPackageManager();
            pm.getPackageInfo("de.robv.android.xposed.installer", 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private boolean checkForSubstrate() {
        try {
            PackageManager pm = context.getPackageManager();
            pm.getPackageInfo("com.saurik.substrate", 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * Get comprehensive security status
     */
    public SecurityStatus getSecurityStatus() {
        SecurityStatus status = new SecurityStatus();
        status.isRooted = isDeviceRooted();
        status.isDeveloperOptionsEnabled = isDeveloperOptionsEnabled();
        status.isAdbEnabled = isAdbEnabled();
        status.isHookingDetected = isHookingDetected();
        status.isSecure = !status.isRooted && 
                         !status.isDeveloperOptionsEnabled && 
                         !status.isAdbEnabled && 
                         !status.isHookingDetected;
        return status;
    }

    public static class SecurityStatus {
        public boolean isRooted;
        public boolean isDeveloperOptionsEnabled;
        public boolean isAdbEnabled;
        public boolean isHookingDetected;
        public boolean isSecure;
    }
}
