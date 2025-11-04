package com.teleh.healthcare;

import android.os.Bundle;
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
    }
}
