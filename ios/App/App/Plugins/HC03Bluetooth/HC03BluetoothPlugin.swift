//
//  HC03BluetoothPlugin.swift
//  24/7 Tele H
//
//  Capacitor plugin for HC03 Bluetooth device integration
//  Based on HC03 Flutter SDK API Guide v1.0.1
//
//  Implements complete HC03 protocol:
//  - Frame structure: [START, LENGTH(2 LE), BT_EDITION, TYPE, HEADER_CRC, ...CONTENT..., TAIL_CRC(2 LE), END]
//  - CRC validation (encryHead, encryTail)
//  - Multi-packet handling (head/tail frame caching)
//  - All 6 detection types: ECG, OX, BP, BG, BATTERY, BT
//

import Foundation
import Capacitor
import CoreBluetooth

@objc(HC03BluetoothPlugin)
public class HC03BluetoothPlugin: CAPPlugin, CBCentralManagerDelegate, CBPeripheralDelegate {
    
    // MARK: - Protocol Constants (from Flutter SDK)
    private let PACKAGE_TOTAL_LENGTH = 10
    private let PACKAGE_INDEX_START = 0
    private let PACKAGE_INDEX_LENGTH = 1
    private let PACKAGE_INDEX_BT_EDITION = 3
    private let PACKAGE_INDEX_TYPE = 4
    private let PACKAGE_INDEX_HEADER_CRC = 5
    private let PACKAGE_INDEX_CONTENT = 6
    private let ATTR_START_REQ: UInt8 = 0x01
    private let ATTR_START_RES: UInt8 = 0x02
    private let BT_EDITION: UInt8 = 0x04
    private let ATTR_END_REQ: UInt8 = 0xff
    private let FULL_PACKAGE_MAX_DATA_SIZE = 11
    
    // Response Type Constants
    private let RESPONSE_CHECK_BATTERY: UInt8 = 0x8F
    private let BT_RES_TYPE: UInt8 = 0x82  // Temperature
    private let BG_RES_TYPE: UInt8 = 0x83  // Blood Glucose
    private let OX_RES_TYPE_NORMAL: UInt8 = 0x84  // Blood Oxygen
    private let BP_RES_TYPE: UInt8 = 0x81  // Blood Pressure
    
    // Blood Pressure Content Types
    private let BP_RES_CONTENT_CALIBRATE_PARAMETER: UInt8 = 0x01
    private let BP_RES_CONTENT_CALIBRATE_TEMPERATURE: UInt8 = 0x02
    private let BP_RES_CONTENT_PRESSURE_DATA: UInt8 = 0x03
    
    // Battery Status
    private let BATTERY_QUERY: UInt8 = 0x00
    private let BATTERY_CHARGING: UInt8 = 0x01
    private let BATTERY_FULLY: UInt8 = 0x02
    
    // Detection Types
    private let DETECTION_ECG = "ECG"
    private let DETECTION_OX = "OX"
    private let DETECTION_BP = "BP"
    private let DETECTION_BG = "BG"
    private let DETECTION_BATTERY = "BATTERY"
    private let DETECTION_BT = "BT"
    
    // MARK: - Instance Variables
    private var sdkHealthMonitor: SDKHealthMonitor?
    private var isInitialized = false
    private var activeDetections = Set<String>()
    
    // Multi-packet frame cache
    private var cacheType: UInt8 = 0
    private var cacheMap = [UInt8: [UInt8]]()
    
    // MARK: - BLE Connection Manager (from Flutter SDK bluetooth_manager.dart)
    private let SERVICE_UUID = CBUUID(string: "0000FFF0-0000-1000-8000-00805F9B34FB")
    private let WRITE_CHARACTERISTIC_UUID = CBUUID(string: "0000FFF1-0000-1000-8000-00805F9B34FB")
    private let NOTIFY_CHARACTERISTIC_UUID = CBUUID(string: "0000FFF2-0000-1000-8000-00805F9B34FB")
    
    private var centralManager: CBCentralManager?
    private var connectedPeripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var notifyCharacteristic: CBCharacteristic?
    private var discoveredDevices = [CBPeripheral]()
    private var isScanning = false
    private var scanTimer: Timer?
    
    // MARK: - Lifecycle
    override public func load() {
        sdkHealthMonitor = SDKHealthMonitor()
        
        // Set up data callback to send events to JavaScript
        sdkHealthMonitor?.dataCallback = { [weak self] (type, value) in
            self?.sendECGData(type: type, value: value)
        }
        
        // Initialize CBCentralManager once
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    // MARK: - Plugin Methods
    
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
    
    @objc func startDetect(_ call: CAPPluginCall) {
        guard let detection = call.getString("detection") else {
            call.reject("Detection type is required")
            return
        }
        
        guard isInitialized else {
            call.reject("SDK not initialized. Call initialize() first.")
            return
        }
        
        activeDetections.insert(detection)
        
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
    
    @objc func stopDetect(_ call: CAPPluginCall) {
        guard let detection = call.getString("detection") else {
            call.reject("Detection type is required")
            return
        }
        
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
    
    @objc func parseData(_ call: CAPPluginCall) {
        guard let dataArray = call.getArray("data", Int.self) else {
            call.reject("Data parameter is required")
            return
        }
        
        // Convert to byte array
        let rawData = dataArray.compactMap { UInt8($0 & 0xFF) }
        
        // Unpack frame
        if let originData = generalUnpackRawData(rawData) {
            // Route to appropriate parser
            routeData(type: originData.type, data: originData.data)
        }
        
        call.resolve(["success": true])
    }
    
    // MARK: - Frame Unpacking (from Flutter SDK)
    
    private func generalUnpackRawData(_ rawData: [UInt8]) -> OriginData? {
        guard rawData.count >= PACKAGE_TOTAL_LENGTH - 1 else {
            print("Insufficient data length: \(rawData.count)")
            return nil
        }
        
        let start = rawData[PACKAGE_INDEX_START]
        var length = Int(rawData[PACKAGE_INDEX_LENGTH]) | (Int(rawData[PACKAGE_INDEX_LENGTH + 1]) << 8)
        let btEdition = rawData[PACKAGE_INDEX_BT_EDITION]
        var type = rawData[PACKAGE_INDEX_TYPE]
        let headerCrc = rawData[PACKAGE_INDEX_HEADER_CRC]
        
        // Validate header CRC
        let headerBytes = Array(rawData[PACKAGE_INDEX_START..<PACKAGE_INDEX_HEADER_CRC])
        let checkEncryHead = encryHead(headerBytes)
        
        let isFull = btEdition == BT_EDITION &&
                     start == ATTR_START_RES &&
                     headerCrc == checkEncryHead &&
                     length <= FULL_PACKAGE_MAX_DATA_SIZE
        
        let isHead = isFull ||
                     (!isFull &&
                      btEdition == BT_EDITION &&
                      start == ATTR_START_RES &&
                      headerCrc == checkEncryHead)
        
        let isTail = isFull || (!isFull && !isHead)
        
        var data: [UInt8]? = nil
        
        if isFull {
            // Full packet - validate tail CRC
            let tailCrcIndex = PACKAGE_INDEX_CONTENT + length
            guard rawData.count >= tailCrcIndex + 2 else {
                print("Incomplete tail CRC")
                return nil
            }
            
            let tailCrc = Int(rawData[tailCrcIndex]) | (Int(rawData[tailCrcIndex + 1]) << 8)
            let tailBytes = Array(rawData[PACKAGE_INDEX_START..<tailCrcIndex])
            let checkEncryTail = encryTail(tailBytes)
            
            guard tailCrc == checkEncryTail else {
                print("Invalid tail CRC")
                return nil
            }
            
            data = Array(rawData[PACKAGE_INDEX_CONTENT..<PACKAGE_INDEX_CONTENT + length])
            
        } else if isHead {
            // Head packet - cache for multi-packet reconstruction
            // Head structure: [START, LEN(2), VER, TYPE, HDR_CRC, CONTENT...] (no tail CRC/END)
            cacheMap.removeAll()
            cacheType = type
            cacheMap[type] = rawData
            return nil
            
        } else if isTail {
            // Tail packet - combine with cached head and validate CRC
            // Tail structure: [CONTENT..., TAIL_CRC(2), END(1)]
            guard cacheType != 0, let headData = cacheMap[cacheType] else {
                cacheType = 0
                cacheMap.removeAll()
                print("Missing head data for tail packet")
                return nil
            }
            
            // Extract header info from head packet (overwrite garbage values from tail)
            length = Int(headData[PACKAGE_INDEX_LENGTH]) | (Int(headData[PACKAGE_INDEX_LENGTH + 1]) << 8)
            type = headData[PACKAGE_INDEX_TYPE]
            
            // Extract payload from head (skip header bytes)
            let headContentLength = headData.count - PACKAGE_INDEX_CONTENT
            let headContent = Array(headData[PACKAGE_INDEX_CONTENT..<headData.count])
            
            // Extract payload from tail (strip last 3 bytes: TAIL_CRC(2) + END(1))
            guard rawData.count >= 3 else {
                print("Tail packet too short")
                cacheType = 0
                cacheMap.removeAll()
                return nil
            }
            
            let tailContentLength = rawData.count - 3
            let tailContent = Array(rawData[0..<tailContentLength])
            
            // Get tail CRC from tail frame (last 2 bytes before END marker)
            let tailCrc = Int(rawData[tailContentLength]) | (Int(rawData[tailContentLength + 1]) << 8)
            
            // Combine payload bytes
            data = headContent + tailContent
            
            // Validate combined payload length matches header
            if data!.count != length {
                print("Multi-packet length mismatch: expected \(length), got \(data!.count)")
            }
            
            // Reconstruct full packet for CRC validation: [HDR + CONTENT]
            var fullPacket = Array(headData[0..<PACKAGE_INDEX_CONTENT])
            fullPacket.append(contentsOf: data!)
            
            // Validate tail CRC over reconstructed packet
            let checkEncryTail = encryTail(fullPacket)
            guard tailCrc == checkEncryTail else {
                print("Multi-packet CRC validation failed: expected 0x\(String(checkEncryTail, radix: 16)), got 0x\(String(tailCrc, radix: 16))")
                cacheType = 0
                cacheMap.removeAll()
                return nil
            }
            
            cacheType = 0
            cacheMap.removeAll()
        }
        
        if let data = data {
            return OriginData(type: type, data: data)
        }
        
        return nil
    }
    
    // MARK: - CRC Calculations (from Flutter SDK)
    
    private func encryHead(_ data: [UInt8]) -> UInt8 {
        var result: UInt16 = 0
        for byte in data {
            let transe = UInt16(byte)
            result ^= transe
            result &= 0xFFFF
        }
        return UInt8(result & 0xFF)
    }
    
    private func encryTail(_ data: [UInt8]) -> Int {
        var result: UInt16 = 0xFFFF
        for byte in data {
            let transe = UInt16(byte)
            result = ((result >> 8) & 0xFF) | (result << 8)
            result &= 0xFFFF
            result ^= transe
            result &= 0xFFFF
            result ^= (result & 0xFF) >> 4
            result &= 0xFFFF
            result ^= (result << 8) << 4
            result &= 0xFFFF
            result ^= ((result & 0xFF) << 4) << 1
            result &= 0xFFFF
        }
        return Int(result & 0xFFFF)
    }
    
    // MARK: - Data Routing
    
    private func routeData(type: UInt8, data: [UInt8]) {
        switch type {
        case RESPONSE_CHECK_BATTERY:
            if activeDetections.contains(DETECTION_BATTERY) {
                parseBatteryData(data)
            }
        case BT_RES_TYPE:
            if activeDetections.contains(DETECTION_BT) {
                parseTemperatureData(data)
            }
        case BG_RES_TYPE:
            if activeDetections.contains(DETECTION_BG) {
                parseBloodGlucoseData(data)
            }
        case OX_RES_TYPE_NORMAL:
            if activeDetections.contains(DETECTION_OX) {
                parseBloodOxygenData(data)
            }
        case BP_RES_TYPE:
            if activeDetections.contains(DETECTION_BP) {
                parseBloodPressureData(data)
            }
        default:
            print("Unknown type: 0x\(String(format:"%02X", type))")
        }
    }
    
    // MARK: - Data Parsers (from Flutter SDK)
    
    private func parseBatteryData(_ bytes: [UInt8]) {
        guard bytes.count >= 3 else {
            print("Battery data too short")
            return
        }
        
        let status = bytes[0]
        
        switch status {
        case BATTERY_QUERY:
            let batteryValue = Int(bytes[1]) << 8 | Int(bytes[2])
            let level = getBatteryLevel(batteryValue)
            
            notifyListeners("hc03:battery:level", data: [
                "type": "battery",
                "level": level,
                "charging": false,
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
            
        case BATTERY_CHARGING:
            notifyListeners("hc03:battery:level", data: [
                "type": "battery",
                "charging": true,
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
            
        case BATTERY_FULLY:
            notifyListeners("hc03:battery:level", data: [
                "type": "battery",
                "level": 100,
                "charging": false,
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
            
        default:
            break
        }
    }
    
    private func getBatteryLevel(_ d: Int) -> Int {
        let data = Int((Double(d) / 8191.0) * 3.3 * 3 * 1000)
        
        if data >= 4090 { return 100 }
        else if data >= 4070 { return 99 }
        else if data >= 4056 { return 97 }
        else if data >= 4040 { return 95 }
        else if data >= 4028 { return 93 }
        else if data >= 4000 { return 91 }
        else if data >= 3980 { return 86 }
        else if data >= 3972 { return 83 }
        else if data >= 3944 { return 78 }
        else if data >= 3916 { return 73 }
        else if data >= 3888 { return 69 }
        else if data >= 3860 { return 65 }
        else if data >= 3832 { return 61 }
        else if data >= 3804 { return 56 }
        else if data >= 3776 { return 50 }
        else if data >= 3748 { return 42 }
        else if data >= 3720 { return 30 }
        else if data >= 3692 { return 19 }
        else if data >= 3664 { return 15 }
        else if data >= 3636 { return 11 }
        else if data >= 3608 { return 8 }
        else if data >= 3580 { return 7 }
        else if data >= 3524 { return 6 }
        else if data >= 3468 { return 5 }
        else if data >= 3300 { return 4 }
        return 0
    }
    
    private func parseTemperatureData(_ bytes: [UInt8]) {
        guard bytes.count >= 8 else {
            print("Temperature data too short")
            return
        }
        
        // Parse temperature values (little-endian)
        let temperatureBdF = Int(bytes[1]) << 8 | Int(bytes[0])
        let temperatureEvF = Int(bytes[3]) << 8 | Int(bytes[2])
        
        // Convert to Celsius
        let tempBT = Double(temperatureBdF) * 0.02 - 273.15
        let tempET = Double(temperatureEvF) * 0.02 - 273.15
        
        // Apply body temperature calculation (simplified)
        let bodyTemp = tempBT + (tempET / 100.0)
        let rounded = round(bodyTemp * 10) / 10.0
        
        notifyListeners("hc03:temperature:data", data: [
            "type": "temperature",
            "temperature": rounded,
            "unit": "C",
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ])
    }
    
    private func parseBloodGlucoseData(_ data: [UInt8]) {
        guard data.count >= 4 else {
            print("Blood glucose data too short")
            return
        }
        
        // Parse glucose value
        let glucoseRaw = Int(data[0]) << 8 | Int(data[1])
        let glucose = Double(glucoseRaw) / 10.0
        
        notifyListeners("hc03:bloodglucose:result", data: [
            "type": "bloodGlucose",
            "glucose": glucose,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ])
    }
    
    private func parseBloodOxygenData(_ data: [UInt8]) {
        guard data.count >= 30 else {
            print("Blood oxygen data incomplete")
            return
        }
        
        // Resolve wave data (30 bytes -> 10 values)
        var waveData = [Int]()
        for i in stride(from: 0, to: 30, by: 3) {
            let first = Int(data[i]) << 16
            let second = Int(data[i + 1]) << 8
            let third = Int(data[i + 2])
            waveData.append(first + second + third)
        }
        
        notifyListeners("hc03:bloodoxygen:data", data: [
            "type": "bloodOxygen",
            "waveData": waveData,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ])
    }
    
    private func parseBloodPressureData(_ data: [UInt8]) {
        guard data.count >= 2 else {
            print("Blood pressure data too short")
            return
        }
        
        let contentType = data[0]
        
        switch contentType {
        case BP_RES_CONTENT_PRESSURE_DATA:
            guard data.count >= 7 else { return }
            
            let systolic = Int(data[1]) | (Int(data[2]) << 8)
            let diastolic = Int(data[3]) | (Int(data[4]) << 8)
            let heartRate = Int(data[5]) | (Int(data[6]) << 8)
            
            notifyListeners("hc03:bloodpressure:result", data: [
                "type": "bloodPressure",
                "systolic": systolic,
                "diastolic": diastolic,
                "heartRate": heartRate,
                "timestamp": Int(Date().timeIntervalSince1970 * 1000)
            ])
            
        case BP_RES_CONTENT_CALIBRATE_PARAMETER,
             BP_RES_CONTENT_CALIBRATE_TEMPERATURE:
            // Calibration data - log but don't emit event
            print("BP calibration data received")
            
        default:
            break
        }
    }
    
    // MARK: - Legacy Methods (backward compatibility)
    
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
        
        monitor.decodeECGData(bytes)
        
        call.resolve(["success": true])
    }
    
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
    
    // MARK: - ECG Data Handling
    
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
    
    // MARK: - BLE Connection Methods
    
    @objc func startScan(_ call: CAPPluginCall) {
        guard let central = centralManager else {
            call.reject("Central Manager not available")
            return
        }
        
        if central.state == .poweredOn {
            // Start scanning immediately if powered on
            startScanningInternal()
            call.resolve(["success": true])
        } else if central.state == .poweredOff {
            call.reject("Bluetooth is powered off")
        } else if central.state == .unauthorized {
            call.reject("Bluetooth permission not granted")
        } else if central.state == .unsupported {
            call.reject("Bluetooth not supported on this device")
        } else {
            // State is .unknown or .resetting - wait for power on
            call.resolve([
                "success": true,
                "message": "Waiting for Bluetooth to power on"
            ])
        }
    }
    
    private func startScanningInternal() {
        guard let central = centralManager, central.state == .poweredOn else {
            return
        }
        
        if isScanning {
            stopScanInternal()
        }
        
        isScanning = true
        // Scan without service filter to find all HC03 devices
        central.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
        
        // Stop scan after 10 seconds
        scanTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: false) { [weak self] _ in
            self?.stopScanInternal()
            
            // Notify scan complete
            self?.notifyListeners("hc03:scan:complete", data: [:])
        }
        
        print("BLE scan started")
    }
    
    @objc func stopScan(_ call: CAPPluginCall) {
        stopScanInternal()
        call.resolve(["success": true])
    }
    
    private func stopScanInternal() {
        if isScanning {
            centralManager?.stopScan()
            isScanning = false
            scanTimer?.invalidate()
            scanTimer = nil
        }
    }
    
    @objc func connect(_ call: CAPPluginCall) {
        guard let deviceAddress = call.getString("deviceAddress") else {
            call.reject("Device address is required")
            return
        }
        
        // Find peripheral by UUID
        if let peripheral = discoveredDevices.first(where: { $0.identifier.uuidString == deviceAddress }) {
            connectedPeripheral = peripheral
            peripheral.delegate = self
            centralManager?.connect(peripheral, options: nil)
            call.resolve(["success": true])
        } else {
            call.reject("Device not found")
        }
    }
    
    @objc func disconnect(_ call: CAPPluginCall) {
        if let peripheral = connectedPeripheral {
            centralManager?.cancelPeripheralConnection(peripheral)
        }
        connectedPeripheral = nil
        writeCharacteristic = nil
        notifyCharacteristic = nil
        call.resolve(["success": true])
    }
    
    // MARK: - CBCentralManagerDelegate
    
    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            print("Bluetooth is powered on")
            notifyListeners("hc03:bluetooth:state", data: ["powered": true])
            
            // Auto-start scanning if requested while BT was off
            if isScanning {
                startScanningInternal()
            }
        case .poweredOff:
            print("Bluetooth is powered off")
            notifyListeners("hc03:bluetooth:state", data: ["powered": false])
            stopScanInternal()
            
            // Cancel scan timer if Bluetooth powers off
            scanTimer?.invalidate()
            scanTimer = nil
        case .unauthorized:
            print("Bluetooth is unauthorized")
            notifyListeners("hc03:bluetooth:state", data: ["powered": false, "unauthorized": true])
        case .unsupported:
            print("Bluetooth is unsupported")
            notifyListeners("hc03:bluetooth:state", data: ["powered": false, "unsupported": true])
        case .unknown:
            print("Bluetooth state unknown")
        case .resetting:
            print("Bluetooth is resetting")
        @unknown default:
            print("Bluetooth state unknown")
        }
    }
    
    public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        let deviceName = peripheral.name ?? "Unknown"
        
        // Filter for HC03 devices
        if deviceName.hasPrefix("HC") || deviceName.contains("HC03") {
            if !discoveredDevices.contains(where: { $0.identifier == peripheral.identifier }) {
                discoveredDevices.append(peripheral)
                
                let deviceInfo: [String: Any] = [
                    "name": deviceName,
                    "address": peripheral.identifier.uuidString,
                    "rssi": RSSI.intValue
                ]
                
                notifyListeners("hc03:device:found", data: deviceInfo)
                print("Found HC03 device: \(deviceName) (\(peripheral.identifier.uuidString))")
            }
        }
    }
    
    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        print("Connected to peripheral: \(peripheral.name ?? "Unknown")")
        peripheral.discoverServices([SERVICE_UUID])
        
        notifyListeners("hc03:connection:state", data: ["connected": true])
    }
    
    public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print("Disconnected from peripheral: \(peripheral.name ?? "Unknown")")
        
        var eventData: [String: Any] = ["connected": false]
        if let error = error {
            print("Disconnect error: \(error.localizedDescription)")
            eventData["error"] = error.localizedDescription
        }
        
        connectedPeripheral = nil
        writeCharacteristic = nil
        notifyCharacteristic = nil
        
        notifyListeners("hc03:connection:state", data: eventData)
    }
    
    public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("Failed to connect to peripheral: \(peripheral.name ?? "Unknown")")
        
        var eventData: [String: Any] = ["connected": false]
        if let error = error {
            print("Connection error: \(error.localizedDescription)")
            eventData["error"] = error.localizedDescription
        }
        
        connectedPeripheral = nil
        writeCharacteristic = nil
        notifyCharacteristic = nil
        
        notifyListeners("hc03:connection:error", data: eventData)
    }
    
    // MARK: - CBPeripheralDelegate
    
    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil, let services = peripheral.services else {
            print("Error discovering services: \(error?.localizedDescription ?? "unknown")")
            return
        }
        
        for service in services {
            if service.uuid == SERVICE_UUID {
                peripheral.discoverCharacteristics([WRITE_CHARACTERISTIC_UUID, NOTIFY_CHARACTERISTIC_UUID], for: service)
            }
        }
    }
    
    public func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil, let characteristics = service.characteristics else {
            print("Error discovering characteristics: \(error?.localizedDescription ?? "unknown")")
            return
        }
        
        for characteristic in characteristics {
            if characteristic.uuid == WRITE_CHARACTERISTIC_UUID {
                writeCharacteristic = characteristic
            } else if characteristic.uuid == NOTIFY_CHARACTERISTIC_UUID {
                notifyCharacteristic = characteristic
                peripheral.setNotifyValue(true, for: characteristic)
                print("Enabled notifications for HC03 data")
                
                notifyListeners("hc03:device:ready", data: ["ready": true])
            }
        }
    }
    
    public func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard error == nil else {
            print("Error updating value: \(error?.localizedDescription ?? "unknown")")
            return
        }
        
        if characteristic.uuid == NOTIFY_CHARACTERISTIC_UUID, let data = characteristic.value {
            // Convert Data to [UInt8] and feed to HC03 protocol parser
            let bytes = [UInt8](data)
            if let originData = generalUnpackRawData(bytes) {
                routeData(type: originData.type, data: originData.data)
            }
        }
    }
    
    // MARK: - Data Structures
    
    private struct OriginData {
        let type: UInt8
        let data: [UInt8]
    }
}
