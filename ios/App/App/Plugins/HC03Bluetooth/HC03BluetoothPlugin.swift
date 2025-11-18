//
//  HC03BluetoothPlugin.swift
//  24/7 Tele H
//
//  Capacitor plugin for HC03 Bluetooth device integration
//  Based on HC03 Flutter SDK API Guide v1.0
//
//  Supports all 6 detection types:
//  - ECG (Electrocardiogram)
//  - OX (Blood Oxygen/SpO2)
//  - BP (Blood Pressure)
//  - BG (Blood Glucose)
//  - BATTERY (Battery Level)
//  - BT (Body Temperature)
//

import Foundation
import Capacitor

@objc(HC03BluetoothPlugin)
public class HC03BluetoothPlugin: CAPPlugin {
    
    private var sdkHealthMonitor: SDKHealthMonitor?
    private var isInitialized = false
    private var activeDetections = Set<String>()
    
    // Detection type constants matching HC03 Flutter SDK API
    private let DETECTION_ECG = "ECG"
    private let DETECTION_OX = "OX"
    private let DETECTION_BP = "BP"
    private let DETECTION_BG = "BG"
    private let DETECTION_BATTERY = "BATTERY"
    private let DETECTION_BT = "BT"
    
    override public func load() {
        sdkHealthMonitor = SDKHealthMonitor()
        
        // Set up data callback to send events to JavaScript
        sdkHealthMonitor?.dataCallback = { [weak self] (type, value) in
            self?.sendECGData(type: type, value: value)
        }
    }
    
    /**
     * Initialize HC03 SDK
     * As per Flutter SDK API: Hc03Sdk.getInstance()
     */
    @objc func initialize(_ call: CAPPluginCall) {
        guard let monitor = sdkHealthMonitor else {
            call.reject("SDK not available")
            return
        }
        
        if !isInitialized {
            monitor.startECGWithDefVal()
            isInitialized = true
        }
        
        call.resolve([
            "success": true,
            "message": "HC03 iOS SDK initialized",
            "isNativeAvailable": true
        ])
    }
    
    /**
     * Start detection for a specific measurement type
     * As per Flutter SDK API: startDetect(Detection detection)
     */
    @objc func startDetect(_ call: CAPPluginCall) {
        guard let detection = call.getString("detection") else {
            call.reject("Detection type is required")
            return
        }
        
        guard isInitialized else {
            call.reject("SDK not initialized. Call initialize() first.")
            return
        }
        
        // Add to active detections
        activeDetections.insert(detection)
        
        // For ECG, NeuroSky SDK is ready to process data
        if detection == DETECTION_ECG {
            // ECG processing handled by processEcgData() when Bluetooth data arrives
        }
        
        // For other types, we'll process raw Bluetooth data in parseData()
        
        call.resolve([
            "success": true,
            "detection": detection,
            "message": "\(detection) detection started"
        ])
        
        // Notify listeners
        notifyListeners("detectionStarted", data: [
            "detection": detection,
            "status": "started"
        ])
    }
    
    /**
     * Stop detection for a specific measurement type
     * As per Flutter SDK API: stopDetect(Detection detection)
     */
    @objc func stopDetect(_ call: CAPPluginCall) {
        guard let detection = call.getString("detection") else {
            call.reject("Detection type is required")
            return
        }
        
        // Remove from active detections
        activeDetections.remove(detection)
        
        call.resolve([
            "success": true,
            "detection": detection,
            "message": "\(detection) detection stopped"
        ])
        
        // Notify listeners
        notifyListeners("detectionStopped", data: [
            "detection": detection,
            "status": "stopped"
        ])
    }
    
    /**
     * Parse raw Bluetooth data from HC03 device
     * As per Flutter SDK API: parseData(data)
     * 
     * Routes data to appropriate parser based on command byte
     */
    @objc func parseData(_ call: CAPPluginCall) {
        guard let dataArray = call.getArray("data", Int.self) else {
            call.reject("Data parameter is required")
            return
        }
        
        // Convert to byte array
        let bytes = dataArray.compactMap { UInt8($0 & 0xFF) }
        
        guard bytes.count >= 2 else {
            call.reject("Invalid data: too short")
            return
        }
        
        // Get command byte to determine data type
        let command = bytes[0]
        
        // Route to appropriate parser
        switch command {
        case 0x01: // ECG data
            if activeDetections.contains(DETECTION_ECG) {
                processEcgDataBytes(bytes)
            }
        case 0x02: // Blood oxygen data
            if activeDetections.contains(DETECTION_OX) {
                parseBloodOxygenData(bytes)
            }
        case 0x03: // Blood pressure data
            if activeDetections.contains(DETECTION_BP) {
                parseBloodPressureData(bytes)
            }
        case 0x04: // Temperature data
            if activeDetections.contains(DETECTION_BT) {
                parseTemperatureData(bytes)
            }
        case 0x05: // Blood glucose data
            if activeDetections.contains(DETECTION_BG) {
                parseBloodGlucoseData(bytes)
            }
        case 0x06: // Battery data
            if activeDetections.contains(DETECTION_BATTERY) {
                parseBatteryData(bytes)
            }
        default:
            print("Unknown command: 0x\(String(format:"%02X", command))")
        }
        
        call.resolve(["success": true])
    }
    
    /**
     * Process ECG data using NeuroSky SDK
     * Legacy method for backward compatibility
     */
    @objc func processEcgData(_ call: CAPPluginCall) {
        guard let monitor = sdkHealthMonitor else {
            call.reject("SDK not initialized")
            return
        }
        
        guard let dataString = call.getString("data") else {
            call.reject("Data parameter is required")
            return
        }
        
        // Parse comma-separated hex values
        let hexValues = dataString.components(separatedBy: ",")
        var bytes: [UInt8] = []
        
        for hexValue in hexValues {
            if let byteValue = UInt8(hexValue.trimmingCharacters(in: .whitespaces), radix: 16) {
                bytes.append(byteValue)
            }
        }
        
        processEcgDataBytes(bytes)
        
        call.resolve(["success": true])
    }
    
    /**
     * Process ECG data bytes using NeuroSky SDK
     */
    private func processEcgDataBytes(_ bytes: [UInt8]) {
        sdkHealthMonitor?.decodeECGData(bytes)
    }
    
    /**
     * Parse blood oxygen data from HC03 device
     * As per Flutter SDK API: getBloodOxygen
     */
    private func parseBloodOxygenData(_ data: [UInt8]) {
        guard data.count >= 6 else {
            print("Blood oxygen data too short")
            return
        }
        
        let bloodOxygen = Int(data[2])
        let heartRate = Int(data[3]) | (Int(data[4]) << 8)
        let fingerDetected = data[5] == 1
        
        let result: [String: Any] = [
            "type": "bloodOxygen",
            "bloodOxygen": bloodOxygen,
            "heartRate": heartRate,
            "fingerDetection": fingerDetected,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        notifyListeners("hc03:bloodoxygen:data", data: result)
    }
    
    /**
     * Parse blood pressure data from HC03 device
     * As per Flutter SDK API: getBloodPressureData
     */
    private func parseBloodPressureData(_ data: [UInt8]) {
        guard data.count >= 8 else {
            print("Blood pressure data too short")
            return
        }
        
        let systolic = Int(data[2]) | (Int(data[3]) << 8)
        let diastolic = Int(data[4]) | (Int(data[5]) << 8)
        let heartRate = Int(data[6]) | (Int(data[7]) << 8)
        let progress = data.count > 8 ? Int(data[8]) : 100
        
        let result: [String: Any] = [
            "type": "bloodPressure",
            "systolic": systolic,
            "diastolic": diastolic,
            "heartRate": heartRate,
            "progress": progress,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        notifyListeners("hc03:bloodpressure:result", data: result)
    }
    
    /**
     * Parse blood glucose data from HC03 device
     * As per Flutter SDK API: getBloodGlucoseData
     */
    private func parseBloodGlucoseData(_ data: [UInt8]) {
        guard data.count >= 6 else {
            print("Blood glucose data too short")
            return
        }
        
        let glucoseRaw = Int(data[2]) | (Int(data[3]) << 8)
        let glucose = Double(glucoseRaw) / 10.0 // Convert to mg/dL
        let testStripStatus = Int(data[4])
        
        let statusMap = ["ready", "insert_strip", "apply_sample", "measuring", "complete", "error"]
        let status = testStripStatus < statusMap.count ? statusMap[testStripStatus] : "unknown"
        
        let result: [String: Any] = [
            "type": "bloodGlucose",
            "glucose": glucose,
            "paperState": status,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        notifyListeners("hc03:bloodglucose:result", data: result)
    }
    
    /**
     * Parse battery data from HC03 device
     * As per Flutter SDK API: getBattery
     */
    private func parseBatteryData(_ data: [UInt8]) {
        guard data.count >= 4 else {
            print("Battery data too short")
            return
        }
        
        let batteryLevel = Int(data[2])
        let isCharging = data[3] == 1
        
        let result: [String: Any] = [
            "type": "battery",
            "level": batteryLevel,
            "charging": isCharging,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        notifyListeners("hc03:battery:level", data: result)
    }
    
    /**
     * Parse temperature data from HC03 device
     */
    private func parseTemperatureData(_ data: [UInt8]) {
        guard data.count >= 4 else {
            print("Temperature data too short")
            return
        }
        
        let tempRaw = Int(data[2]) | (Int(data[3]) << 8)
        let temperature = Double(tempRaw) / 100.0 // Convert to Celsius
        
        let result: [String: Any] = [
            "type": "temperature",
            "temperature": temperature,
            "unit": "C",
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        notifyListeners("hc03:temperature:data", data: result)
    }
    
    /**
     * Start measurement (legacy method for backward compatibility)
     */
    @objc func startMeasurement(_ call: CAPPluginCall) {
        guard let monitor = sdkHealthMonitor else {
            call.reject("SDK not initialized")
            return
        }
        
        let username = call.getString("username") ?? ""
        let isFemale = call.getBool("isFemale") ?? true
        let age = call.getInt("age") ?? 0
        let height = call.getInt("height") ?? 0
        let weight = call.getInt("weight") ?? 0
        
        monitor.startECG(username: username, gender: isFemale, age: age, height: height, weight: weight)
        
        call.resolve([
            "success": true,
            "message": "Measurement started"
        ])
    }
    
    /**
     * Stop measurement (legacy method for backward compatibility)
     */
    @objc func stopMeasurement(_ call: CAPPluginCall) {
        guard let monitor = sdkHealthMonitor else {
            call.reject("SDK not initialized")
            return
        }
        
        monitor.endECG()
        
        call.resolve([
            "success": true,
            "message": "Measurement stopped"
        ])
    }
    
    /**
     * Send ECG data to JavaScript
     */
    private func sendECGData(type: String, value: Any) {
        var data: [String: Any] = [
            "type": type,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        if type == "wave" {
            data["data"] = value
            notifyListeners("hc03:ecg:wave", data: data)
        } else if type == "touch" {
            data["isTouch"] = value
            notifyListeners("hc03:ecg:metrics", data: data)
        } else {
            data["value"] = value
            notifyListeners("hc03:ecg:metrics", data: data)
        }
    }
}
