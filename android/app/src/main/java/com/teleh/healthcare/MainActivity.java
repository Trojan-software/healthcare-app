package com.teleh.healthcare;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register plugins
        registerPlugin(HC03BluetoothPlugin.class);
        registerPlugin(SecurityPlugin.class);
        
        // FLAG_SECURE: Prevent screenshots and screen recording (MediaProjection fix)
        // Security: HIGH (6.8) - Prevents sensitive data exposure via screenshots/recording
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        
        // Tapjacking Protection: Filter touch events when window is obscured
        // Security: MEDIUM (4.8) - Prevents overlay attacks and credential theft
        // ADHCC Compliance: Android Tapjacking vulnerability fix
        enableTapjackingProtection();
    }
    
    /**
     * Enable tapjacking protection by filtering touch events when window is obscured.
     * Prevents malicious overlay attacks that could steal user credentials.
     */
    private void enableTapjackingProtection() {
        View rootView = getWindow().getDecorView().getRootView();
        if (rootView != null) {
            rootView.setFilterTouchesWhenObscured(true);
        }
    }
}
