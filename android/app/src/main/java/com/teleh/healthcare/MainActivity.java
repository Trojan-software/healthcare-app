package com.teleh.healthcare;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.teleh.healthcare.security.SecurityManager;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private SecurityManager securityManager;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        securityManager = SecurityManager.getInstance(this);
        
        registerPlugin(HC03BluetoothPlugin.class);
        registerPlugin(SecurityPlugin.class);
        
        performSecurityChecks();
        
        applySecurityProtections();
        
        configureSecureWebView();
    }
    
    private void performSecurityChecks() {
        if (securityManager.isRooted()) {
            showSecurityWarning("Device appears to be rooted. Some features may be restricted.");
        }
        
        if (securityManager.isHookingFrameworkDetected()) {
            showSecurityWarning("Security framework detected. App functionality may be limited.");
        }
        
        if (securityManager.isDeveloperOptionsEnabled()) {
        }
        
        if (securityManager.isAdbEnabled()) {
        }
    }
    
    private void applySecurityProtections() {
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        
        enableTapjackingProtection();
    }
    
    private void configureSecureWebView() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                
                settings.setAllowFileAccessFromFileURLs(false);
                settings.setAllowUniversalAccessFromFileURLs(false);
                
                settings.setAllowFileAccess(false);
                settings.setAllowContentAccess(false);
                
                settings.setGeolocationEnabled(false);
                
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                
                settings.setSaveFormData(false);
                settings.setSavePassword(false);
            }
        } catch (Exception e) {
        }
    }
    
    private void enableTapjackingProtection() {
        View rootView = getWindow().getDecorView().getRootView();
        if (rootView != null) {
            rootView.setFilterTouchesWhenObscured(true);
        }
    }
    
    private void showSecurityWarning(String message) {
        runOnUiThread(() -> {
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }
    
    @Override
    public void onResume() {
        super.onResume();
        applySecurityProtections();
    }
}
