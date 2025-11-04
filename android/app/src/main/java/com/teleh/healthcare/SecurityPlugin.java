package com.teleh.healthcare;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Security")
public class SecurityPlugin extends Plugin {

    private SecurityManager securityManager;

    @Override
    public void load() {
        securityManager = new SecurityManager(getContext());
    }

    @PluginMethod
    public void checkRootStatus(PluginCall call) {
        boolean isRooted = securityManager.isDeviceRooted();
        
        JSObject ret = new JSObject();
        ret.put("isRooted", isRooted);
        ret.put("severity", "HIGH");
        ret.put("score", 6.8);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void checkDeveloperOptions(PluginCall call) {
        boolean isEnabled = securityManager.isDeveloperOptionsEnabled();
        
        JSObject ret = new JSObject();
        ret.put("isEnabled", isEnabled);
        ret.put("severity", "LOW");
        ret.put("score", 3.4);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void checkAdbStatus(PluginCall call) {
        boolean isEnabled = securityManager.isAdbEnabled();
        
        JSObject ret = new JSObject();
        ret.put("isEnabled", isEnabled);
        ret.put("severity", "LOW");
        ret.put("score", 3.4);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void checkHookingStatus(PluginCall call) {
        boolean isDetected = securityManager.isHookingDetected();
        
        JSObject ret = new JSObject();
        ret.put("isDetected", isDetected);
        ret.put("severity", "MEDIUM");
        ret.put("score", 5.7);
        
        call.resolve(ret);
    }

    @PluginMethod
    public void getComprehensiveSecurityStatus(PluginCall call) {
        SecurityManager.SecurityStatus status = securityManager.getSecurityStatus();
        
        JSObject ret = new JSObject();
        ret.put("isRooted", status.isRooted);
        ret.put("isDeveloperOptionsEnabled", status.isDeveloperOptionsEnabled);
        ret.put("isAdbEnabled", status.isAdbEnabled);
        ret.put("isHookingDetected", status.isHookingDetected);
        ret.put("isSecure", status.isSecure);
        
        // Add recommendations
        JSObject recommendations = new JSObject();
        if (status.isRooted) {
            recommendations.put("root", "Device is rooted. App may be compromised.");
        }
        if (status.isDeveloperOptionsEnabled) {
            recommendations.put("devOptions", "Developer options are enabled. Disable for production use.");
        }
        if (status.isAdbEnabled) {
            recommendations.put("adb", "ADB is enabled. This poses a security risk.");
        }
        if (status.isHookingDetected) {
            recommendations.put("hooking", "Hooking framework detected (Frida/Xposed). App may be compromised.");
        }
        
        ret.put("recommendations", recommendations);
        
        call.resolve(ret);
    }
}
