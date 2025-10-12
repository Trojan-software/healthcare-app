//
//  HC03BluetoothPlugin.swift
//  24/7 Tele H
//
//  Capacitor plugin for HC03 Bluetooth device integration
//

import Foundation
import Capacitor

@objc(HC03BluetoothPlugin)
public class HC03BluetoothPlugin: CAPPlugin {
    
    private var sdkHealthMonitor: SDKHealthMonitor?
    private var isInitialized = false
    
    override public func load() {
        sdkHealthMonitor = SDKHealthMonitor()
        
        // Set up data callback to send events to JavaScript
        sdkHealthMonitor?.dataCallback = { [weak self] (type, value) in
            self?.sendECGData(type: type, value: value)
        }
    }
    
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
            "message": "HC03 iOS SDK initialized"
        ])
    }
    
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
        
        call.resolve([
            "success": true
        ])
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
    
    private func sendECGData(type: String, value: Any) {
        var data: [String: Any] = ["type": type]
        
        if type == "wave" {
            data["data"] = value
        } else if type == "touch" {
            data["isTouch"] = value
        } else {
            data["value"] = value
        }
        
        notifyListeners("ecgData", data: data)
    }
}
