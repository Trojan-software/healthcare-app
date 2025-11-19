package com.teleh.healthcare;

import android.content.Context;
import android.util.Log;

import com.ecg.Constant;
import com.ecg.EcgListener;
import com.ecg.EcgManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSArray;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;

/**
 * HC03 Bluetooth Plugin for Android
 * Based on HC03 Flutter SDK API Guide v1.0.1
 * 
 * Implements complete HC03 protocol:
 * - Frame structure: [START, LENGTH(2 LE), BT_EDITION, TYPE, HEADER_CRC, ...CONTENT..., TAIL_CRC(2 LE), END]
 * - CRC validation (encryHead, encryTail)
 * - Multi-packet handling (head/tail frame caching)
 * - All 6 detection types: ECG, OX, BP, BG, BATTERY, BT
 */
@CapacitorPlugin(name = "HC03BluetoothPlugin")
public class HC03BluetoothPlugin extends Plugin {
    
    private static final String TAG = "HC03Bluetooth";
    
    // HC03 Protocol Constants (from Flutter SDK baseCommon.dart)
    private static final int PACKAGE_TOTAL_LENGTH = 10;
    private static final int PACKAGE_INDEX_START = 0;
    private static final int PACKAGE_INDEX_LENGTH = 1;
    private static final int PACKAGE_INDEX_BT_EDITION = 3;
    private static final int PACKAGE_INDEX_TYPE = 4;
    private static final int PACKAGE_INDEX_HEADER_CRC = 5;
    private static final int PACKAGE_INDEX_CONTENT = 6;
    private static final int PACKAGE_INDEX_HEAD_CRC = 5;
    private static final int ATTR_START_REQ = 0x01;
    private static final int ATTR_START_RES = 0x02;
    private static final int BT_EDITION = 0x04;
    private static final int ATTR_END_REQ = 0xff;
    private static final int FULL_PACKAGE_MAX_DATA_SIZE = 11;
    
    // Response Type Constants
    private static final int RESPONSE_CHECK_BATTERY = 0x8F;
    private static final int BT_RES_TYPE = 0x82;  // Temperature
    private static final int BG_RES_TYPE = 0x83;  // Blood Glucose
    private static final int OX_RES_TYPE_NORMAL = 0x84;  // Blood Oxygen
    private static final int BP_RES_TYPE = 0x81;  // Blood Pressure
    
    // Blood Pressure Content Types
    private static final int BP_RES_CONTENT_CALIBRATE_PARAMETER = 0x01;
    private static final int BP_RES_CONTENT_CALIBRATE_TEMPERATURE = 0x02;
    private static final int BP_RES_CONTENT_PRESSURE_DATA = 0x03;
    
    // Battery Status
    private static final int BATTERY_QUERY = 0x00;
    private static final int BATTERY_CHARGING = 0x01;
    private static final int BATTERY_FULLY = 0x02;
    
    // Detection Type Constants
    private static final String DETECTION_ECG = "ECG";
    private static final String DETECTION_OX = "OX";
    private static final String DETECTION_BP = "BP";
    private static final String DETECTION_BG = "BG";
    private static final String DETECTION_BATTERY = "BATTERY";
    private static final String DETECTION_BT = "BT";
    
    // Multi-packet frame cache
    private int cacheType = 0;
    private Map<Integer, byte[]> cacheMap = new HashMap<>();
    
    // Active detection tracking
    private Set<String> activeDetections = new HashSet<>();
    
    // BLE Connection Manager (from Flutter SDK bluetooth_manager.dart)
    private static final UUID SERVICE_UUID = UUID.fromString("0000fff0-0000-1000-8000-00805f9b34fb");
    private static final UUID WRITE_CHARACTERISTIC_UUID = UUID.fromString("0000fff1-0000-1000-8000-00805f9b34fb");
    private static final UUID NOTIFY_CHARACTERISTIC_UUID = UUID.fromString("0000fff2-0000-1000-8000-00805f9b34fb");
    private static final UUID CLIENT_CHARACTERISTIC_CONFIG = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    private static final long SCAN_PERIOD = 10000; // 10 seconds
    
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bleScanner;
    private BluetoothGatt bluetoothGatt;
    private BluetoothGattCharacteristic writeCharacteristic;
    private BluetoothGattCharacteristic notifyCharacteristic;
    private Handler handler = new Handler(Looper.getMainLooper());
    private boolean isScanning = false;
    private boolean isConnected = false;
    private List<BluetoothDevice> discoveredDevices = new ArrayList<>();
    
    // ECG Manager (NeuroSky SDK)
    private EcgManager ecgManager;
    private boolean isInitialized = false;
    
    @Override
    public void load() {
        ecgManager = EcgManager.getInstance();
        
        // Initialize ECG manager if needed
        if (!isInitialized) {
            ecgManager.init();
            
            // Set up ECG data listener
            ecgManager.setOnEcgResultListener(new EcgListener() {
                @Override
                public void onDrawWave(int wave) {
                    sendECGData("wave", wave);
                }
                
                @Override
                public void onSignalQuality(int level) {
                    sendECGData("signalQuality", level);
                }
                
                @Override
                public void onECGValues(int key, int value) {
                    String type = getECGValueType(key);
                    sendECGData(type, value);
                }
                
                @Override
                public void onFingerDetection(boolean fingerDetected) {
                    sendECGData("touch", fingerDetected);
                }
            });
            
            isInitialized = true;
        }
        
        Log.d(TAG, "HC03 Bluetooth Plugin loaded");
    }
    
    /**
     * Map ECG key constants to event type names
     */
    private String getECGValueType(int key) {
        if (key == Constant.ECG_KEY_HEART_RATE) return "HR";
        if (key == Constant.ECG_KEY_HRV) return "HRV";
        if (key == Constant.ECG_KEY_MOOD) return "Mood Index";
        if (key == Constant.ECG_KEY_R2R) return "RR";
        if (key == Constant.ECG_KEY_RESPIRATORY_RATE) return "RESPIRATORY RATE";
        if (key == Constant.ECG_KEY_STRESS) return "STRESS";
        if (key == Constant.ECG_KEY_HEART_AGE) return "HEART AGE";
        if (key == Constant.ECG_KEY_ROBUST_HR) return "ROBUST HR";
        if (key == Constant.ECG_KEY_HEART_BEAT) return "HEART BEAT";
        return "UNKNOWN";
    }
    
    /**
     * Initialize HC03 SDK
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            // ECG manager is already initialized in load()
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "HC03 Android SDK initialized");
            ret.put("isNativeAvailable", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize", e);
            call.reject("Initialization failed: " + e.getMessage());
        }
    }
    
    /**
     * Start detection for a specific measurement type
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
            
            activeDetections.add(detection);
            
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
     */
    @PluginMethod
    public void stopDetect(PluginCall call) {
        try {
            String detection = call.getString("detection");
            if (detection == null) {
                call.reject("Detection type is required");
                return;
            }
            
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
     * Implements generalUnpackRawData from Flutter SDK
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
            byte[] rawData = new byte[dataArray.length()];
            for (int i = 0; i < dataArray.length(); i++) {
                rawData[i] = (byte) dataArray.getInt(i);
            }
            
            // Unpack frame
            OriginData originData = generalUnpackRawData(rawData);
            
            if (originData != null) {
                // Route to appropriate engine based on type
                routeData(originData.type, originData.data);
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
     * General frame unpacking (from Flutter SDK baseCommon.dart)
     * Handles multi-packet frames with CRC validation
     */
    private OriginData generalUnpackRawData(byte[] rawData) {
        if (rawData.length < PACKAGE_TOTAL_LENGTH - 1) {
            Log.w(TAG, "Insufficient data length: " + rawData.length);
            return null;
        }
        
        ByteBuffer buffer = ByteBuffer.wrap(rawData).order(ByteOrder.LITTLE_ENDIAN);
        
        int start = buffer.get(PACKAGE_INDEX_START) & 0xFF;
        int length = buffer.getShort(PACKAGE_INDEX_LENGTH) & 0xFFFF;
        int btEdition = buffer.get(PACKAGE_INDEX_BT_EDITION) & 0xFF;
        int type = buffer.get(PACKAGE_INDEX_TYPE) & 0xFF;
        int headerCrc = buffer.get(PACKAGE_INDEX_HEADER_CRC) & 0xFF;
        
        // Validate header CRC
        byte[] headerBytes = new byte[PACKAGE_INDEX_HEADER_CRC];
        System.arraycopy(rawData, PACKAGE_INDEX_START, headerBytes, 0, PACKAGE_INDEX_HEADER_CRC);
        int checkEncryHead = encryHead(headerBytes);
        
        boolean isFull = btEdition == BT_EDITION &&
                        start == ATTR_START_RES &&
                        headerCrc == checkEncryHead &&
                        length <= FULL_PACKAGE_MAX_DATA_SIZE;
        
        boolean isHead = isFull ||
                        (!isFull &&
                         btEdition == BT_EDITION &&
                         start == ATTR_START_RES &&
                         headerCrc == checkEncryHead);
        
        boolean isTail = isFull || (!isFull && !isHead);
        
        byte[] data = null;
        
        if (isFull) {
            // Full packet - validate tail CRC
            int tailCrcIndex = PACKAGE_INDEX_CONTENT + length;
            if (rawData.length < tailCrcIndex + 2) {
                Log.w(TAG, "Incomplete tail CRC");
                return null;
            }
            
            int tailCrc = buffer.getShort(tailCrcIndex) & 0xFFFF;
            byte[] tailBytes = new byte[tailCrcIndex];
            System.arraycopy(rawData, PACKAGE_INDEX_START, tailBytes, 0, tailCrcIndex);
            int checkEncryTail = encryTail(tailBytes);
            
            if (tailCrc != checkEncryTail) {
                Log.w(TAG, "Invalid tail CRC");
                return null;
            }
            
            data = new byte[length];
            System.arraycopy(rawData, PACKAGE_INDEX_CONTENT, data, 0, length);
            
        } else if (isHead) {
            // Head packet - cache for multi-packet reconstruction
            // Head structure: [START, LEN(2), VER, TYPE, HDR_CRC, CONTENT...] (no tail CRC/END)
            cacheMap.clear();
            cacheType = type;
            cacheMap.put(type, rawData);
            return null;
            
        } else if (isTail) {
            // Tail packet - combine with cached head and validate CRC
            // Tail structure: [CONTENT..., TAIL_CRC(2), END(1)]
            if (cacheType == 0 || !cacheMap.containsKey(cacheType)) {
                cacheType = 0;
                cacheMap.clear();
                Log.w(TAG, "Missing head data for tail packet");
                return null;
            }
            
            byte[] headData = cacheMap.get(cacheType);
            
            // Extract header info from head packet
            ByteBuffer headBuffer = ByteBuffer.wrap(headData).order(ByteOrder.LITTLE_ENDIAN);
            length = headBuffer.getShort(PACKAGE_INDEX_LENGTH) & 0xFFFF;
            type = headBuffer.get(PACKAGE_INDEX_TYPE) & 0xFF;
            
            // Extract payload from head (skip header bytes)
            int headContentLength = headData.length - PACKAGE_INDEX_CONTENT;
            byte[] headContent = new byte[headContentLength];
            System.arraycopy(headData, PACKAGE_INDEX_CONTENT, headContent, 0, headContentLength);
            
            // Extract payload from tail (strip last 3 bytes: TAIL_CRC(2) + END(1))
            if (rawData.length < 3) {
                Log.w(TAG, "Tail packet too short");
                cacheType = 0;
                cacheMap.clear();
                return null;
            }
            
            int tailContentLength = rawData.length - 3;
            byte[] tailContent = new byte[tailContentLength];
            System.arraycopy(rawData, 0, tailContent, 0, tailContentLength);
            
            // Get tail CRC from tail frame (last 2 bytes before END marker)
            ByteBuffer tailBuffer = ByteBuffer.wrap(rawData).order(ByteOrder.LITTLE_ENDIAN);
            int tailCrc = tailBuffer.getShort(tailContentLength) & 0xFFFF;
            
            // Combine payload bytes
            data = new byte[headContentLength + tailContentLength];
            System.arraycopy(headContent, 0, data, 0, headContentLength);
            System.arraycopy(tailContent, 0, data, headContentLength, tailContentLength);
            
            // Validate combined payload length matches header
            if (data.length != length) {
                Log.w(TAG, "Multi-packet length mismatch: expected " + length + ", got " + data.length);
            }
            
            // Reconstruct full packet for CRC validation: [HDR + CONTENT]
            byte[] fullPacket = new byte[PACKAGE_INDEX_CONTENT + data.length];
            System.arraycopy(headData, 0, fullPacket, 0, PACKAGE_INDEX_CONTENT);
            System.arraycopy(data, 0, fullPacket, PACKAGE_INDEX_CONTENT, data.length);
            
            // Validate tail CRC over reconstructed packet
            int checkEncryTail = encryTail(fullPacket);
            if (tailCrc != checkEncryTail) {
                Log.w(TAG, "Multi-packet CRC validation failed: expected 0x" + 
                      Integer.toHexString(checkEncryTail) + ", got 0x" + Integer.toHexString(tailCrc));
                cacheType = 0;
                cacheMap.clear();
                return null;
            }
            
            cacheType = 0;
            cacheMap.clear();
        }
        
        if (data != null) {
            return new OriginData(type, data);
        }
        
        return null;
    }
    
    /**
     * CRC Head calculation (from Flutter SDK)
     */
    private int encryHead(byte[] data) {
        int result = 0;
        for (byte b : data) {
            int transe = b & 0xFF;
            result ^= transe;
            result &= 0xFFFF;
        }
        return result & 0xFF;
    }
    
    /**
     * CRC Tail calculation (from Flutter SDK)
     */
    private int encryTail(byte[] data) {
        int result = 0xFFFF;
        for (byte b : data) {
            int transe = b & 0xFF;
            result = ((result >> 8) & 0xFF) | (result << 8);
            result &= 0xFFFF;
            result ^= transe;
            result &= 0xFFFF;
            result ^= (result & 0xFF) >> 4;
            result &= 0xFFFF;
            result ^= (result << 8) << 4;
            result &= 0xFFFF;
            result ^= ((result & 0xFF) << 4) << 1;
            result &= 0xFFFF;
        }
        return result & 0xFFFF;
    }
    
    /**
     * Route unpacked data to appropriate parser
     */
    private void routeData(int type, byte[] data) {
        switch (type) {
            case RESPONSE_CHECK_BATTERY:
                if (activeDetections.contains(DETECTION_BATTERY)) {
                    parseBatteryData(data);
                }
                break;
            case BT_RES_TYPE:
                if (activeDetections.contains(DETECTION_BT)) {
                    parseTemperatureData(data);
                }
                break;
            case BG_RES_TYPE:
                if (activeDetections.contains(DETECTION_BG)) {
                    parseBloodGlucoseData(data);
                }
                break;
            case OX_RES_TYPE_NORMAL:
                if (activeDetections.contains(DETECTION_OX)) {
                    parseBloodOxygenData(data);
                }
                break;
            case BP_RES_TYPE:
                if (activeDetections.contains(DETECTION_BP)) {
                    parseBloodPressureData(data);
                }
                break;
            default:
                Log.d(TAG, "Unknown type: 0x" + Integer.toHexString(type));
        }
    }
    
    /**
     * Parse battery data (from Flutter SDK battery.dart)
     */
    private void parseBatteryData(byte[] bytes) {
        try {
            if (bytes.length < 3) {
                Log.w(TAG, "Battery data too short");
                return;
            }
            
            int status = bytes[0] & 0xFF;
            
            switch (status) {
                case BATTERY_QUERY:
                    int batteryValue = ((bytes[1] & 0xFF) << 8) | (bytes[2] & 0xFF);
                    int level = getBatteryLevel(batteryValue);
                    
                    JSObject result = new JSObject();
                    result.put("type", "battery");
                    result.put("level", level);
                    result.put("charging", false);
                    result.put("timestamp", System.currentTimeMillis());
                    
                    notifyListeners("hc03:battery:level", result);
                    break;
                    
                case BATTERY_CHARGING:
                    JSObject charging = new JSObject();
                    charging.put("type", "battery");
                    charging.put("charging", true);
                    charging.put("timestamp", System.currentTimeMillis());
                    
                    notifyListeners("hc03:battery:level", charging);
                    break;
                    
                case BATTERY_FULLY:
                    JSObject full = new JSObject();
                    full.put("type", "battery");
                    full.put("level", 100);
                    full.put("charging", false);
                    full.put("timestamp", System.currentTimeMillis());
                    
                    notifyListeners("hc03:battery:level", full);
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing battery data", e);
        }
    }
    
    /**
     * Calculate battery level from voltage (from Flutter SDK)
     */
    private int getBatteryLevel(int d) {
        int data = (int) ((d / 8191.0) * 3.3 * 3 * 1000);
        
        if (data >= 4090) return 100;
        else if (data >= 4070) return 99;
        else if (data >= 4056) return 97;
        else if (data >= 4040) return 95;
        else if (data >= 4028) return 93;
        else if (data >= 4000) return 91;
        else if (data >= 3980) return 86;
        else if (data >= 3972) return 83;
        else if (data >= 3944) return 78;
        else if (data >= 3916) return 73;
        else if (data >= 3888) return 69;
        else if (data >= 3860) return 65;
        else if (data >= 3832) return 61;
        else if (data >= 3804) return 56;
        else if (data >= 3776) return 50;
        else if (data >= 3748) return 42;
        else if (data >= 3720) return 30;
        else if (data >= 3692) return 19;
        else if (data >= 3664) return 15;
        else if (data >= 3636) return 11;
        else if (data >= 3608) return 8;
        else if (data >= 3580) return 7;
        else if (data >= 3524) return 6;
        else if (data >= 3468) return 5;
        else if (data >= 3300) return 4;
        return 0;
    }
    
    /**
     * Parse temperature data (from Flutter SDK Temperature.dart)
     */
    private void parseTemperatureData(byte[] bytes) {
        try {
            if (bytes.length < 8) {
                Log.w(TAG, "Temperature data too short");
                return;
            }
            
            // Parse temperature values (little-endian)
            int temperatureBdF = (bytes[1] & 0xFF) << 8 | (bytes[0] & 0xFF);
            int temperatureEvF = (bytes[3] & 0xFF) << 8 | (bytes[2] & 0xFF);
            
            // Convert to Celsius
            double tempBT = temperatureBdF * 0.02 - 273.15;
            double tempET = temperatureEvF * 0.02 - 273.15;
            
            // Apply body temperature calculation (simplified)
            double bodyTemp = tempBT + (tempET / 100.0);
            
            JSObject result = new JSObject();
            result.put("type", "temperature");
            result.put("temperature", Math.round(bodyTemp * 10) / 10.0);
            result.put("unit", "C");
            result.put("timestamp", System.currentTimeMillis());
            
            notifyListeners("hc03:temperature:data", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing temperature data", e);
        }
    }
    
    /**
     * Parse blood glucose data (from Flutter SDK bloodglucose.dart)
     */
    private void parseBloodGlucoseData(byte[] data) {
        try {
            if (data.length < 4) {
                Log.w(TAG, "Blood glucose data too short");
                return;
            }
            
            // Parse glucose value (big-endian for this sensor)
            int glucoseRaw = (data[0] << 8) | (data[1] & 0xFF);
            double glucose = glucoseRaw / 10.0;
            
            JSObject result = new JSObject();
            result.put("type", "bloodGlucose");
            result.put("glucose", glucose);
            result.put("timestamp", System.currentTimeMillis());
            
            notifyListeners("hc03:bloodglucose:result", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood glucose data", e);
        }
    }
    
    /**
     * Parse blood oxygen data (from Flutter SDK oxEngine.dart)
     */
    private void parseBloodOxygenData(byte[] data) {
        try {
            if (data.length < 30) {
                Log.w(TAG, "Blood oxygen data incomplete");
                return;
            }
            
            // Resolve wave data (30 bytes -> 10 values)
            int[] waveData = new int[10];
            for (int i = 0; i < 30; i += 3) {
                int first = (data[i] & 0xFF) << 16;
                int second = (data[i + 1] & 0xFF) << 8;
                int third = data[i + 2] & 0xFF;
                waveData[i / 3] = first + second + third;
            }
            
            JSObject result = new JSObject();
            result.put("type", "bloodOxygen");
            result.put("waveData", new JSArray(waveData));
            result.put("timestamp", System.currentTimeMillis());
            
            notifyListeners("hc03:bloodoxygen:data", result);
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood oxygen data", e);
        }
    }
    
    /**
     * Parse blood pressure data (from Flutter SDK bpEngine.dart)
     */
    private void parseBloodPressureData(byte[] data) {
        try {
            if (data.length < 2) {
                Log.w(TAG, "Blood pressure data too short");
                return;
            }
            
            int contentType = data[0] & 0xFF;
            
            switch (contentType) {
                case BP_RES_CONTENT_PRESSURE_DATA:
                    if (data.length >= 7) {
                        int systolic = (data[1] & 0xFF) | ((data[2] & 0xFF) << 8);
                        int diastolic = (data[3] & 0xFF) | ((data[4] & 0xFF) << 8);
                        int heartRate = (data[5] & 0xFF) | ((data[6] & 0xFF) << 8);
                        
                        JSObject result = new JSObject();
                        result.put("type", "bloodPressure");
                        result.put("systolic", systolic);
                        result.put("diastolic", diastolic);
                        result.put("heartRate", heartRate);
                        result.put("timestamp", System.currentTimeMillis());
                        
                        notifyListeners("hc03:bloodpressure:result", result);
                    }
                    break;
                    
                case BP_RES_CONTENT_CALIBRATE_PARAMETER:
                case BP_RES_CONTENT_CALIBRATE_TEMPERATURE:
                    // Calibration data - log but don't emit event
                    Log.d(TAG, "BP calibration data received");
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blood pressure data", e);
        }
    }
    
    /**
     * Process ECG data (legacy method for backward compatibility)
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
            
            ecgManager.dealEcgVal(bytes);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to process ECG data", e);
            call.reject("Processing failed: " + e.getMessage());
        }
    }
    
    /**
     * Send ECG data to JavaScript
     */
    private void sendECGData(String type, Object value) {
        JSObject data = new JSObject();
        data.put("type", type);
        data.put("timestamp", System.currentTimeMillis());
        
        if ("wave".equals(type)) {
            data.put("data", value);
            notifyListeners("hc03:ecg:wave", data);
        } else if ("touch".equals(type)) {
            data.put("isTouch", value);
            notifyListeners("hc03:ecg:metrics", data);
        } else {
            data.put("value", value);
            notifyListeners("hc03:ecg:metrics", data);
        }
    }
    
    /**
     * Scan for HC03 Bluetooth devices
     */
    @PluginMethod
    public void startScan(PluginCall call) {
        try {
            Context context = getContext();
            
            // Check Bluetooth feature support
            if (!context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
                call.reject("BLE not supported on this device");
                return;
            }
            
            BluetoothManager bluetoothManager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
            bluetoothAdapter = bluetoothManager.getAdapter();
            
            if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
                call.reject("Bluetooth is not enabled");
                return;
            }
            
            bleScanner = bluetoothAdapter.getBluetoothLeScanner();
            if (bleScanner == null) {
                call.reject("BLE scanner not available");
                return;
            }
            
            discoveredDevices.clear();
            isScanning = true;
            bleScanner.startScan(scanCallback);
            
            // Stop scan after period
            handler.postDelayed(() -> {
                if (isScanning) {
                    stopScanInternal();
                }
            }, SCAN_PERIOD);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
            Log.d(TAG, "BLE scan started");
        } catch (SecurityException e) {
            Log.e(TAG, "Missing Bluetooth permissions", e);
            call.reject("Missing Bluetooth permissions. Please grant BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start scan", e);
            call.reject("Scan failed: " + e.getMessage());
        }
    }
    
    /**
     * Stop BLE scan
     */
    @PluginMethod
    public void stopScan(PluginCall call) {
        if (isScanning) {
            stopScanInternal();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "No scan in progress");
            call.resolve(ret);
        }
    }
    
    private void stopScanInternal() {
        if (isScanning && bleScanner != null) {
            try {
                bleScanner.stopScan(scanCallback);
                isScanning = false;
                Log.d(TAG, "BLE scan stopped");
            } catch (SecurityException e) {
                Log.e(TAG, "Permission denied while stopping scan", e);
            }
        }
    }
    
    /**
     * Connect to HC03 device
     */
    @PluginMethod
    public void connect(PluginCall call) {
        try {
            String deviceAddress = call.getString("deviceAddress");
            if (deviceAddress == null) {
                call.reject("Device address is required");
                return;
            }
            
            // Clean up existing connection
            if (bluetoothGatt != null) {
                bluetoothGatt.close();
                bluetoothGatt = null;
            }
            
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(deviceAddress);
            if (device == null) {
                call.reject("Device not found");
                return;
            }
            
            Context context = getContext();
            // Use TRANSPORT_LE for proper BLE connection (API 23+)
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                bluetoothGatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE);
            } else {
                bluetoothGatt = device.connectGatt(context, false, gattCallback);
            }
            
            if (bluetoothGatt == null) {
                call.reject("Failed to create GATT connection");
                return;
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
            Log.d(TAG, "Connecting to device: " + deviceAddress);
        } catch (SecurityException e) {
            Log.e(TAG, "Missing Bluetooth permissions", e);
            call.reject("Missing Bluetooth permissions. Please grant BLUETOOTH_CONNECT permission.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to connect", e);
            call.reject("Connection failed: " + e.getMessage());
        }
    }
    
    /**
     * Disconnect from HC03 device
     */
    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    private void disconnectInternal() {
        if (bluetoothGatt != null) {
            bluetoothGatt.disconnect();
            bluetoothGatt.close();
            bluetoothGatt = null;
        }
        isConnected = false;
        writeCharacteristic = null;
        notifyCharacteristic = null;
        Log.d(TAG, "Disconnected from device");
    }
    
    /**
     * BLE Scan Callback
     */
    private final ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            BluetoothDevice device = result.getDevice();
            String deviceName = device.getName();
            
            // Filter for HC03 devices
            if (deviceName != null && (deviceName.startsWith("HC") || deviceName.contains("HC03"))) {
                if (!discoveredDevices.contains(device)) {
                    discoveredDevices.add(device);
                    
                    JSObject deviceInfo = new JSObject();
                    deviceInfo.put("name", deviceName);
                    deviceInfo.put("address", device.getAddress());
                    deviceInfo.put("rssi", result.getRssi());
                    
                    notifyListeners("hc03:device:found", deviceInfo);
                    Log.d(TAG, "Found HC03 device: " + deviceName + " (" + device.getAddress() + ")");
                }
            }
        }
        
        @Override
        public void onScanFailed(int errorCode) {
            JSObject error = new JSObject();
            error.put("errorCode", errorCode);
            notifyListeners("hc03:scan:error", error);
            Log.e(TAG, "BLE scan failed with error: " + errorCode);
        }
    };
    
    /**
     * GATT Callback for connection and data
     */
    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    isConnected = true;
                    Log.d(TAG, "Connected to GATT server, status: " + status);
                    
                    // Discover services after successful connection
                    try {
                        boolean result = gatt.discoverServices();
                        if (!result) {
                            Log.e(TAG, "Failed to start service discovery");
                        }
                    } catch (SecurityException e) {
                        Log.e(TAG, "Permission denied during service discovery", e);
                    }
                    
                    JSObject event = new JSObject();
                    event.put("connected", true);
                    notifyListeners("hc03:connection:state", event);
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    isConnected = false;
                    Log.d(TAG, "Disconnected from GATT server");
                    
                    JSObject event = new JSObject();
                    event.put("connected", false);
                    notifyListeners("hc03:connection:state", event);
                    
                    // Clean up on disconnect
                    writeCharacteristic = null;
                    notifyCharacteristic = null;
                }
            } else {
                // Handle GATT errors (e.g., status 133)
                Log.e(TAG, "GATT connection error: status=" + status + ", newState=" + newState);
                isConnected = false;
                
                // Clean up characteristics
                writeCharacteristic = null;
                notifyCharacteristic = null;
                
                // Emit error event to JavaScript layer
                JSObject errorEvent = new JSObject();
                errorEvent.put("connected", false);
                errorEvent.put("error", "GATT error: " + status);
                errorEvent.put("status", status);
                notifyListeners("hc03:connection:error", errorEvent);
                
                // Emit disconnect event
                JSObject disconnectEvent = new JSObject();
                disconnectEvent.put("connected", false);
                notifyListeners("hc03:connection:state", disconnectEvent);
                
                // Close and cleanup on error (no retry - let JS layer handle)
                if (gatt != null) {
                    try {
                        gatt.close();
                    } catch (Exception e) {
                        Log.e(TAG, "Error closing GATT", e);
                    }
                    bluetoothGatt = null;
                }
            }
        }
        
        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                BluetoothGattService service = gatt.getService(SERVICE_UUID);
                if (service != null) {
                    writeCharacteristic = service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);
                    notifyCharacteristic = service.getCharacteristic(NOTIFY_CHARACTERISTIC_UUID);
                    
                    if (notifyCharacteristic != null) {
                        // Enable notifications on the client side
                        boolean notifyEnabled = gatt.setCharacteristicNotification(notifyCharacteristic, true);
                        if (!notifyEnabled) {
                            Log.e(TAG, "Failed to enable characteristic notification");
                            return;
                        }
                        
                        // Write descriptor to enable notifications on the device
                        BluetoothGattDescriptor descriptor = notifyCharacteristic.getDescriptor(CLIENT_CHARACTERISTIC_CONFIG);
                        if (descriptor != null) {
                            try {
                                descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                                boolean writeResult = gatt.writeDescriptor(descriptor);
                                if (!writeResult) {
                                    Log.e(TAG, "Failed to write notification descriptor");
                                }
                                Log.d(TAG, "HC03 service found, notifications enabled: " + writeResult);
                            } catch (SecurityException e) {
                                Log.e(TAG, "Permission denied while enabling notifications", e);
                            }
                        } else {
                            Log.e(TAG, "Client Characteristic Config descriptor not found");
                        }
                    } else {
                        Log.e(TAG, "Notify characteristic not found");
                    }
                } else {
                    Log.e(TAG, "HC03 service not found");
                }
            } else {
                Log.e(TAG, "Service discovery failed with status: " + status);
            }
        }
        
        @Override
        public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                if (CLIENT_CHARACTERISTIC_CONFIG.equals(descriptor.getUuid())) {
                    Log.d(TAG, "Notification descriptor written successfully");
                    
                    JSObject event = new JSObject();
                    event.put("ready", true);
                    notifyListeners("hc03:device:ready", event);
                }
            } else {
                Log.e(TAG, "Descriptor write failed with status: " + status);
                
                // Clear characteristics
                writeCharacteristic = null;
                notifyCharacteristic = null;
                isConnected = false;
                
                // Emit error event
                JSObject errorEvent = new JSObject();
                errorEvent.put("error", "Failed to enable notifications: " + status);
                notifyListeners("hc03:connection:error", errorEvent);
                
                // Emit disconnect state before cleanup
                JSObject disconnectEvent = new JSObject();
                disconnectEvent.put("connected", false);
                notifyListeners("hc03:connection:state", disconnectEvent);
                
                // Clean up failed connection
                if (bluetoothGatt != null) {
                    try {
                        bluetoothGatt.disconnect();
                        bluetoothGatt.close();
                    } catch (SecurityException e) {
                        Log.e(TAG, "Permission denied during cleanup", e);
                    }
                    bluetoothGatt = null;
                }
            }
        }
        
        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
            if (NOTIFY_CHARACTERISTIC_UUID.equals(characteristic.getUuid())) {
                byte[] data = characteristic.getValue();
                if (data != null && data.length > 0) {
                    // Feed raw data to parseData() for HC03 protocol processing
                    OriginData originData = generalUnpackRawData(data);
                    if (originData != null) {
                        routeData(originData.type, originData.data);
                    }
                }
            }
        }
    };
    
    /**
     * Internal data structure for unpacked frames
     */
    private static class OriginData {
        int type;
        byte[] data;
        
        OriginData(int type, byte[] data) {
            this.type = type;
            this.data = data;
        }
    }
}
