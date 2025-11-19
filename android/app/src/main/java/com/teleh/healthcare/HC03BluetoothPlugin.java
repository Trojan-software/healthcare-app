package com.teleh.healthcare;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.ecg.Constant;
import com.ecg.EcgListener;
import com.ecg.EcgManager;
import java.util.HashSet;
import java.util.Set;

/**
 * HC03 Bluetooth Plugin
 * Based on HC03 Flutter SDK API Guide v1.0
 * 
 * Supports all 6 detection types:
 * - ECG (Electrocardiogram)
 * - OX (Blood Oxygen/SpO2)
 * - BP (Blood Pressure)
 * - BG (Blood Glucose)
 * - BATTERY (Battery Level)
 * - BT (Body Temperature)
 */
@CapacitorPlugin(name = "HC03Bluetooth")
public class HC03BluetoothPlugin extends Plugin implements EcgListener {
    private static final String TAG = "HC03BluetoothPlugin";
    private EcgManager ecgManager;
    private boolean isInitialized = false;
    private Set<String> activeDetections = new HashSet<>();
    
    // Detection type constants matching HC03 Flutter SDK API
    private static final String DETECTION_ECG = "ECG";
    private static final String DETECTION_OX = "OX";
    private static final String DETECTION_BP = "BP";
    private static final String DETECTION_BG = "BG";
    private static final String DETECTION_BATTERY = "BATTERY";
    private static final String DETECTION_BT = "BT";

    @Override
    public void load() {
        super.load();
        ecgManager = EcgManager.getInstance();
        Log.d(TAG, "HC03BluetoothPlugin loaded");
    }

    /**
     * Initialize HC03 SDK
     * As per Flutter SDK API: Hc03Sdk.getInstance()
     */
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
            ret.put("isNativeAvailable", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize HC03 SDK", e);
            call.reject("Initialization failed: " + e.getMessage());
        }
    }

    /**
     * Start detection for a specific measurement type
     * As per Flutter SDK API: startDetect(Detection detection)
     * 
     * @param call Contains "detection" parameter: ECG, OX, BP, BG, BATTERY, or BT
     */
    @PluginMethod
    public void startDetect(PluginCall call) {
        try {
            String detection = call.getString("detection");
            if (detection == null) {
                call.reject("Detection type is required");
                return;
            }

            if (!isInitialized) {
                call.reject("SDK not initialized. Call initialize() first.");
                return;
            }

            Log.d(TAG, "Starting detection: " + detection);
            
            // Add to active detections
            activeDetections.add(detection);
            
            // For ECG, start NeuroSky processing
            if (DETECTION_ECG.equals(detection)) {
                // ECG processing is handled by processEcgData() when Bluetooth data arrives
                Log.d(TAG, "ECG detection started - ready to process data");
            }
            
            // For other types, we'll process raw Bluetooth data in parseData()
            // (Blood oxygen, blood pressure, glucose, battery, temperature)
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("detection", detection);
            ret.put("message", detection + " detection started");
            call.resolve(ret);
            
            // Notify listeners
            JSObject event = new JSObject();
            event.put("detection", detection);
            event.put("status", "started");
            notifyListeners("detectionStarted", event);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start detection", e);
            call.reject("Start detection failed: " + e.getMessage());
        }
    }

    /**
     * Stop detection for a specific measurement type
     * As per Flutter SDK API: stopDetect(Detection detection)
     * 
     * @param call Contains "detection" parameter: ECG, OX, BP, BG, or BT
     */
    @PluginMethod
    public void stopDetect(PluginCall call) {
        try {
            String detection = call.getString("detection");
            if (detection == null) {
                call.reject("Detection type is required");
                return;
            }

            Log.d(TAG, "Stopping detection: " + detection);
            
            // Remove from active detections
            activeDetections.remove(detection);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("detection", detection);
            ret.put("message", detection + " detection stopped");
            call.resolve(ret);
            
            // Notify listeners
            JSObject event = new JSObject();
            event.put("detection", detection);
            event.put("status", "stopped");
            notifyListeners("detectionStopped", event);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop detection", e);
            call.reject("Stop detection failed: " + e.getMessage());
        }
    }

    /**
     * Parse raw Bluetooth data from HC03 device
     * As per Flutter SDK API: parseData(data)
     * 
     * Routes data to appropriate parser based on command byte
     */
    @PluginMethod
    public void parseData(PluginCall call) {
        try {
            JSArray dataArray = call.getArray("data");
            if (dataArray == null || dataArray.length() == 0) {
                call.reject("Data parameter is required");
                return;
            }

            // Convert JSArray to byte array
            byte[] bytes = new byte[dataArray.length()];
            for (int i = 0; i < dataArray.length(); i++) {
                bytes[i] = (byte) dataArray.getInt(i);
            }

            if (bytes.length < 2) {
                call.reject("Invalid data: too short");
                return;
            }

            // Get command byte to determine data type
            int command = bytes[0] & 0xFF;
            
            Log.d(TAG, "Parsing data - Command: 0x" + Integer.toHexString(command) + ", Length: " + bytes.length);
            
            // Route to appropriate parser
            switch (command) {
                case 0x01: // ECG data
                    if (activeDetections.contains(DETECTION_ECG)) {
                        processEcgDataBytes(bytes);
                    }
                    break;
                case 0x02: // Blood oxygen data
                    if (activeDetections.contains(DETECTION_OX)) {
                        parseBloodOxygenData(bytes);
                    }
                    break;
                case 0x03: // Blood pressure data
                    if (activeDetections.contains(DETECTION_BP)) {
                        parseBloodPressureData(bytes);
                    }
                    break;
                case 0x04: // Temperature data
                    if (activeDetections.contains(DETECTION_BT)) {
                        parseTemperatureData(bytes);
                    }
                    break;
                case 0x05: // Blood glucose data
                    if (activeDetections.contains(DETECTION_BG)) {
                        parseBloodGlucoseData(bytes);
                    }
                    break;
                case 0x06: // Battery data
                    if (activeDetections.contains(DETECTION_BATTERY)) {
                        parseBatteryData(bytes);
                    }
                    break;
                default:
                    Log.w(TAG, "Unknown command: 0x" + Integer.toHexString(command));
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse data", e);
            call.reject("Parse data failed: " + e.getMessage());
        }
    }

    /**
     * Process ECG data using NeuroSky SDK
     * Legacy method for backward compatibility
     */
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

            processEcgDataBytes(bytes);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to process ECG data", e);
            call.reject("Processing failed: " + e.getMessage());
        }
    }
    
    /**
     * Process ECG data bytes using NeuroSky SDK
     */
    private void processEcgDataBytes(byte[] bytes) {
        ecgManager.dealEcgVal(bytes);
    }

    /**
     * Parse blood oxygen data from HC03 device
     * As per Flutter SDK API: getBloodOxygen
     * Frame structure: [0xAA, 0x55, cmd, len, ...data..., checksum]
     */
    private void parseBloodOxygenData(byte[] data) {
        try {
            // Validate frame structure: [0xAA, 0x55, 0x02, len, bloodOxygen, heartRate_L, heartRate_H, fingerDetected, checksum]
            if (data.length < 9) {
                Log.w(TAG, "Blood oxygen data too short: " + data.length);
                return;
            }
            
            // Validate header
            if ((data[0] & 0xFF) != 0xAA || (data[1] & 0xFF) != 0x55) {
                Log.w(TAG, "Invalid blood oxygen frame header");
                return;
            }
            
            // Validate command
            if ((data[2] & 0xFF) != 0x02) {
                Log.w(TAG, "Invalid blood oxygen command: 0x" + Integer.toHexString(data[2] & 0xFF));
                return;
            }
            
            int length = data[3] & 0xFF;
            if (data.length < 4 + length + 1) {
                Log.w(TAG, "Blood oxygen data length mismatch");
                return;
            }
            
            // Verify checksum
            int calculatedChecksum = calculateChecksum(data, 2, 4 + length - 1);
            int receivedChecksum = data[4 + length] & 0xFF;
            if (calculatedChecksum != receivedChecksum) {
                Log.w(TAG, "Blood oxygen checksum mismatch");
                return;
            }
            
            // Parse data fields (little-endian for heart rate)
            int bloodOxygen = data[4] & 0xFF;
            int heartRate = (data[5] & 0xFF) | ((data[6] & 0xFF) << 8);
            boolean fingerDetected = (data[7] & 0xFF) == 1;
            
            JSObject result = new JSObject();
            result.put("type", "bloodOxygen");
            result.put("bloodOxygen", bloodOxygen);
            result.put("heartRate", heartRate);
            result.put("fingerDetection", fingerDetected);
            result.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Blood Oxygen: " + bloodOxygen + "%, HR: " + heartRate + ", Finger: " + fingerDetected);
            
            notifyListeners("hc03:bloodoxygen:data", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood oxygen data", e);
        }
    }

    /**
     * Parse blood pressure data from HC03 device
     * As per Flutter SDK API: getBloodPressureData
     * Frame structure: [0xAA, 0x55, cmd, len, ...data..., checksum]
     */
    private void parseBloodPressureData(byte[] data) {
        try {
            // Validate frame structure: [0xAA, 0x55, 0x03, len, systolic_L, systolic_H, diastolic_L, diastolic_H, heartRate_L, heartRate_H, progress, checksum]
            if (data.length < 11) {
                Log.w(TAG, "Blood pressure data too short: " + data.length);
                return;
            }
            
            // Validate header
            if ((data[0] & 0xFF) != 0xAA || (data[1] & 0xFF) != 0x55) {
                Log.w(TAG, "Invalid blood pressure frame header");
                return;
            }
            
            // Validate command
            if ((data[2] & 0xFF) != 0x03) {
                Log.w(TAG, "Invalid blood pressure command: 0x" + Integer.toHexString(data[2] & 0xFF));
                return;
            }
            
            int length = data[3] & 0xFF;
            if (data.length < 4 + length + 1) {
                Log.w(TAG, "Blood pressure data length mismatch");
                return;
            }
            
            // Verify checksum
            int calculatedChecksum = calculateChecksum(data, 2, 4 + length - 1);
            int receivedChecksum = data[4 + length] & 0xFF;
            if (calculatedChecksum != receivedChecksum) {
                Log.w(TAG, "Blood pressure checksum mismatch");
                return;
            }
            
            // Parse data fields (little-endian)
            int systolic = (data[4] & 0xFF) | ((data[5] & 0xFF) << 8);
            int diastolic = (data[6] & 0xFF) | ((data[7] & 0xFF) << 8);
            int heartRate = (data[8] & 0xFF) | ((data[9] & 0xFF) << 8);
            int progress = data.length > 10 ? (data[10] & 0xFF) : 100;
            
            JSObject result = new JSObject();
            result.put("type", "bloodPressure");
            result.put("systolic", systolic);
            result.put("diastolic", diastolic);
            result.put("heartRate", heartRate);
            result.put("progress", progress);
            result.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Blood Pressure: " + systolic + "/" + diastolic + " mmHg, HR: " + heartRate);
            
            notifyListeners("hc03:bloodpressure:result", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood pressure data", e);
        }
    }

    /**
     * Parse blood glucose data from HC03 device
     * As per Flutter SDK API: getBloodGlucoseData
     */
    private void parseBloodGlucoseData(byte[] data) {
        try {
            if (data.length < 6) {
                Log.w(TAG, "Blood glucose data too short");
                return;
            }
            
            int glucoseRaw = ((data[3] & 0xFF) << 8) | (data[2] & 0xFF);
            double glucose = glucoseRaw / 10.0; // Convert to mg/dL
            int testStripStatus = data[4] & 0xFF;
            
            String[] statusMap = {"ready", "insert_strip", "apply_sample", "measuring", "complete", "error"};
            String status = testStripStatus < statusMap.length ? statusMap[testStripStatus] : "unknown";
            
            JSObject result = new JSObject();
            result.put("type", "bloodGlucose");
            result.put("glucose", glucose);
            result.put("paperState", status);
            result.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Blood Glucose: " + glucose + " mg/dL, Status: " + status);
            
            notifyListeners("hc03:bloodglucose:result", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood glucose data", e);
        }
    }

    /**
     * Parse battery data from HC03 device
     * As per Flutter SDK API: getBattery
     */
    private void parseBatteryData(byte[] data) {
        try {
            if (data.length < 4) {
                Log.w(TAG, "Battery data too short");
                return;
            }
            
            int batteryLevel = data[2] & 0xFF;
            boolean isCharging = (data[3] & 0xFF) == 1;
            
            JSObject result = new JSObject();
            result.put("type", "battery");
            result.put("level", batteryLevel);
            result.put("charging", isCharging);
            result.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Battery: " + batteryLevel + "%, Charging: " + isCharging);
            
            notifyListeners("hc03:battery:level", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing battery data", e);
        }
    }

    /**
     * Parse temperature data from HC03 device
     */
    private void parseTemperatureData(byte[] data) {
        try {
            if (data.length < 4) {
                Log.w(TAG, "Temperature data too short");
                return;
            }
            
            int tempRaw = ((data[3] & 0xFF) << 8) | (data[2] & 0xFF);
            double temperature = tempRaw / 100.0; // Convert to Celsius
            
            JSObject result = new JSObject();
            result.put("type", "temperature");
            result.put("temperature", temperature);
            result.put("unit", "C");
            result.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Temperature: " + temperature + "°C");
            
            notifyListeners("hc03:temperature:data", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing temperature data", e);
        }
    }

    // ========================================================================
    // ECG LISTENER CALLBACKS (NeuroSky SDK)
    // ========================================================================

    @Override
    public void onDrawWave(int wave) {
        JSObject data = new JSObject();
        data.put("type", "wave");
        data.put("data", wave);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("hc03:ecg:wave", data);
    }

    @Override
    public void onSignalQuality(int level) {
        JSObject data = new JSObject();
        data.put("type", "signalQuality");
        data.put("level", level);
        data.put("timestamp", System.currentTimeMillis());
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
                type = "RESPIRATORY_RATE";
                break;
        }
        
        JSObject data = new JSObject();
        data.put("type", type);
        data.put("value", value);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("hc03:ecg:metrics", data);
    }

    @Override
    public void onFingerDetection(boolean fingerDetected) {
        JSObject data = new JSObject();
        data.put("type", "touch");
        data.put("isTouch", fingerDetected);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("hc03:ecg:metrics", data);
    }
}
