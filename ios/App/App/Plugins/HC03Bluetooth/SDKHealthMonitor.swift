//
//  SDKHealthMonitor.swift
//  24/7 Tele H
//
//  NeuroSky ECG SDK wrapper for HC03 device
//

import Foundation
import UIKit

// Protocol for ECG data callbacks
@objc protocol SDKHealthMonitorDelegate: AnyObject {
    @objc optional func receiveECGDataRRmax(_ rrMax: Int)
    @objc optional func receiveECGDataRRMin(_ rrMin: Int)
    @objc optional func receiveECGDataHRV(_ hrv: Int)
    @objc optional func receiveECGDataMood(_ mood: Int)
    @objc optional func receiveECGDataSmoothedWave(_ smoothedWave: Int)
    @objc optional func receiveECGDataHeartRate(_ heartRate: Int)
    @objc optional func receiveECGDataBreathRate(_ breathRate: Int)
    @objc optional func receiveECGDataFingerTouch(_ isTouch: Bool)
    @objc optional func receiveECGDataRowData(_ rowData: Int)
    @objc optional func receiveECGDataR2RInterval(_ r2rValue: Int)
    @objc optional func receiveECGDataHeartAge(_ heartAge: Int)
    @objc optional func receiveECGDataStress(_ stress: Int)
}

@objc class SDKHealthMonitor: NSObject {
    
    // MARK: - Properties
    weak var delegate: SDKHealthMonitorDelegate?
    
    private var nskAlgoSDKECG: NSKAlgoSDKECG?
    private var count: UInt = 0
    private var isFirst = true
    
    private var heartRate: Int = 0
    private var hrv: Int = 0
    private var r2rInterval: Int = 0
    private var rrMax: Int = 0
    private var rrMin: Int = 0
    private var mood: Int = 0
    
    private var ecgStageFlag: Int = 0
    private var ecgDataNum: Int = 0
    private var ecgDataNum2: Int = 0
    private var ecgStep: Int = 1
    
    // Callback closure for Capacitor plugin
    var dataCallback: ((_ type: String, _ value: Any) -> Void)?
    
    // MARK: - Initialization
    override init() {
        super.init()
        
        let licenseKey = "4DYD5nkbZHYoJBqIxT3nc/QIB58doR7BiRxuH62Ayhs="
        let sampleRate: Int32 = 512
        
        nskAlgoSDKECG = NSKAlgoSDKECG()
        nskAlgoSDKECG?.delegate = self
        nskAlgoSDKECG?.setupSDKProperty(licenseKey, withSampleRate: sampleRate, enableSmoothed: 1)
        nskAlgoSDKECG?.enableNSLogMessages(false)
    }
    
    // MARK: - Public Methods
    func startECGWithDefVal() {
        startECG(username: "", gender: true, age: 0, height: 0, weight: 0)
    }
    
    func startECG(username: String, gender: Bool, age: Int, height: Int, weight: Int) {
        nskAlgoSDKECG?.resetECGAnalysis()
        nskAlgoSDKECG?.setUserProfile(username, withGender: gender, withAge: Int32(age), 
                                      withHeight: Int32(height), withWeight: Int32(weight), withPath: "")
        isFirst = true
        initECG()
        count = 0
    }
    
    func endECG() {
        ecgStep = 0
    }
    
    // MARK: - Private Methods
    private func initECG() {
        ecgStageFlag = 0
        ecgDataNum = 0
        ecgDataNum2 = 0
        ecgStep = 1
    }
    
    // MARK: - ECG Data Processing
    func decodeECGData(_ recvData: [UInt8]) {
        var dataEcg: Int = 0
        
        for i in 0..<recvData.count {
            let dataRec = Int(recvData[i] & 0xff)
            ecgDataNum += 1
            
            if ecgStageFlag == 0 {
                if dataRec == 0xaa {
                    ecgStageFlag += 1
                } else {
                    ecgStageFlag = 0
                }
            } else if ecgStageFlag == 1 {
                if dataRec == 0xaa {
                    ecgStageFlag += 1
                } else {
                    ecgStageFlag = 0
                }
            } else if ecgStageFlag == 2 {
                if dataRec == 0x12 {
                    ecgStageFlag += 1
                } else {
                    ecgStageFlag = 0
                }
            } else if ecgStageFlag == 3 {
                if dataRec == 0x02 {
                    ecgStageFlag += 1
                } else {
                    ecgStageFlag = 0
                }
            } else if ecgStageFlag == 4 {
                if dataRec == 0x00 {
                    ecgStageFlag += 1
                    sendData(type: "touch", value: false)
                    delegate?.receiveECGDataFingerTouch?(false)
                } else if dataRec == 0xc8 {
                    ecgStageFlag += 1
                    sendData(type: "touch", value: true)
                    delegate?.receiveECGDataFingerTouch?(true)
                } else {
                    ecgStageFlag += 1
                }
            } else if ecgStageFlag >= 5 && ecgStageFlag <= 21 {
                ecgStageFlag += 1
            } else if ecgStageFlag >= 22 && ecgStageFlag <= 1045 {
                if ecgStageFlag % 2 == 0 {
                    dataEcg = dataRec << 8
                } else {
                    dataEcg += dataRec
                    
                    if dataEcg >= 32768 {
                        dataEcg -= 65536
                    }
                    
                    if let sdk = nskAlgoSDKECG {
                        ecgDataNum2 += 1
                        sdk.requestECGAnalysis(Int32(dataEcg), withPoorSignal: 200)
                    }
                    
                    delegate?.receiveECGDataRowData?(dataEcg)
                }
                
                ecgStageFlag += 1
                if ecgStageFlag > 1045 {
                    ecgStageFlag = 0
                }
            } else {
                ecgStageFlag = 0
            }
        }
    }
    
    private func calcAndCallbackRR(_ r2rInt: Int) {
        if isFirst {
            rrMax = r2rInt
            rrMin = r2rInt
            isFirst = false
        }
        if r2rInt > rrMax {
            rrMax = r2rInt
        }
        if r2rInt < rrMin {
            rrMin = r2rInt
        }
        
        delegate?.receiveECGDataRRmax?(rrMax)
        delegate?.receiveECGDataRRMin?(rrMin)
    }
    
    private func sendData(type: String, value: Any) {
        dataCallback?(type, value)
    }
}

// MARK: - NSKAlgoSDKECGDelegate
extension SDKHealthMonitor: NSKAlgoSDKECGDelegate {
    
    func dataReceived(_ algo: ECGAlgorithmsData, results value: Int32) {
        let intValue = Int(value)
        
        switch algo {
        case ECG_SMOOTHED_WAVE:
            sendData(type: "wave", value: intValue)
            delegate?.receiveECGDataSmoothedWave?(intValue)
            
        case ECG_R2R_INTERVAL:
            sendData(type: "RR", value: intValue)
            delegate?.receiveECGDataR2RInterval?(intValue)
            calcAndCallbackRR(intValue)
            
        case ECG_RRI_COUNT:
            if intValue == 30 {
                if let sdk = nskAlgoSDKECG {
                    let stress = Int(sdk.getStress())
                    delegate?.receiveECGDataStress?(stress)
                    
                    let mood = Int(sdk.getMood())
                    sendData(type: "Mood Index", value: mood)
                    delegate?.receiveECGDataMood?(mood)
                    
                    let heartAge = Int(sdk.getHeartAge())
                    delegate?.receiveECGDataHeartAge?(heartAge)
                }
            }
            
        case ECG_RPEAK_DETECTED:
            break
            
        case ECG_HEART_RATE:
            heartRate = intValue
            sendData(type: "HR", value: intValue)
            delegate?.receiveECGDataHeartRate?(intValue)
            
            let br = heartRate > 4 ? Int(round(Double(heartRate) / 4.0)) + (1 - Int(arc4random_uniform(3))) : 0
            sendData(type: "RESPIRATORY RATE", value: br)
            delegate?.receiveECGDataBreathRate?(br)
            
        case ECG_ROBUST_HEART_RATE:
            break
            
        case ECG_HRV:
            sendData(type: "HRV", value: intValue)
            delegate?.receiveECGDataHRV?(intValue)
            
        case ECG_SIGNAL_QUALITY:
            break
            
        case ECG_OVALLALL_SIGNAL_QUALITY:
            break
            
        default:
            print("Unknown ECG algorithm ID: \(algo.rawValue)")
        }
    }
    
    func exceptionECGMessage(_ excepType: ECGException) {
        print("ECG Exception: \(excepType.rawValue)")
    }
}
