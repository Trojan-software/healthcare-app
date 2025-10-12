package com.teleh.healthcare;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.ecg.Constant;
import com.ecg.EcgListener;
import com.ecg.EcgManager;

@CapacitorPlugin(name = "HC03Bluetooth")
public class HC03BluetoothPlugin extends Plugin implements EcgListener {
    private static final String TAG = "HC03BluetoothPlugin";
    private EcgManager ecgManager;
    private boolean isInitialized = false;

    @Override
    public void load() {
        super.load();
        ecgManager = EcgManager.getInstance();
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            if (!isInitialized) {
                ecgManager.init();
                ecgManager.setOnEcgResultListener(this);
                isInitialized = true;
                Log.d(TAG, "HC03 SDK initialized successfully");
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "HC03 SDK initialized");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize HC03 SDK", e);
            call.reject("Initialization failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void processEcgData(PluginCall call) {
        try {
            String dataString = call.getString("data");
            if (dataString == null) {
                call.reject("Data parameter is required");
                return;
            }

            String[] hexValues = dataString.split(",");
            byte[] bytes = new byte[hexValues.length];
            for (int i = 0; i < hexValues.length; i++) {
                bytes[i] = (byte) Integer.parseInt(hexValues[i].trim(), 16);
            }

            ecgManager.dealEcgVal(bytes);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to process ECG data", e);
            call.reject("Processing failed: " + e.getMessage());
        }
    }

    @Override
    public void onDrawWave(int wave) {
        JSObject data = new JSObject();
        data.put("type", "wave");
        data.put("data", wave);
        notifyListeners("ecgData", data);
    }

    @Override
    public void onSignalQuality(int level) {
        JSObject data = new JSObject();
        data.put("type", "signalQuality");
        data.put("level", level);
        notifyListeners("ecgData", data);
    }

    @Override
    public void onECGValues(int key, int value) {
        String type = "";
        switch (key) {
            case Constant.ECG_KEY_HEART_RATE:
                type = "HR";
                break;
            case Constant.ECG_KEY_ROBUST_HR:
                type = "ROBUST_HR";
                break;
            case Constant.ECG_KEY_MOOD:
                type = "Mood Index";
                break;
            case Constant.ECG_KEY_R2R:
                type = "RR";
                break;
            case Constant.ECG_KEY_HRV:
                type = "HRV";
                break;
            case Constant.ECG_KEY_HEART_AGE:
                type = "HEART_AGE";
                break;
            case Constant.ECG_KEY_STRESS:
                type = "STRESS";
                break;
            case Constant.ECG_KEY_HEART_BEAT:
                type = "HEART_BEAT";
                break;
            case Constant.ECG_KEY_RESPIRATORY_RATE:
                type = "RESPIRATORY RATE";
                break;
        }
        
        JSObject data = new JSObject();
        data.put("type", type);
        data.put("value", value);
        notifyListeners("ecgData", data);
    }

    @Override
    public void onFingerDetection(boolean fingerDetected) {
        JSObject data = new JSObject();
        data.put("type", "touch");
        data.put("isTouch", fingerDetected);
        notifyListeners("ecgData", data);
    }
}
