package com.ecg;
import android.util.Log;
import com.neurosky.AlgoSdk.NskAlgoDataType;
import com.neurosky.AlgoSdk.NskAlgoECGValueType;
import com.neurosky.AlgoSdk.NskAlgoProfile;
import com.neurosky.AlgoSdk.NskAlgoSampleRate;
import com.neurosky.AlgoSdk.NskAlgoSdk;
import com.neurosky.AlgoSdk.NskAlgoState;
import com.neurosky.AlgoSdk.NskAlgoType;

public class EcgManager {
    private final static String TAG = "EcgManager";
    private final static String NSK_ALGO_SDK_LICENCE = "NeuroSky_Release_To_GeneralFreeLicense_Use_Only_Dec  1 2016";
    private final static int OUTPUT_INTERVAL = 30;

    private boolean isEcgTest = false;
    private int ecgStageFlag = 0;
    public int ecgStep = 0;
    private int dataEcg = 0;

    private EcgListener mEcgListener;
    private boolean isModuleExist;
    private boolean outputRawData = false;
    private boolean outputArrayData;
    private boolean isFingerTouchOnSensor;
    private NskAlgoSdk mNskAlgoSdk;
    private int ecgDataIndex;
    private int activeProfile;

    private int pkgIndex = 0;
    private static final int pkgLen = 128;
    private int[] outputPkg;
    
    private static EcgManager ecgManager=new EcgManager();
    
    public static EcgManager getInstance(){
        return ecgManager;
    }

    public void init(int... algoTypes){
        mNskAlgoSdk = new NskAlgoSdk();
        mNskAlgoSdk.setOnStateChangeListener((state, reason) ->
                Log.e(TAG, "state:" + new NskAlgoState(state)
                        + ", reason:" + new NskAlgoState(reason)));
        if (algoTypes == null || algoTypes.length == 0) {
            algoTypes = new int[]{Constant.ECG_KEY_HEART_AGE, Constant.ECG_KEY_HEART_RATE
                    , Constant.ECG_KEY_HRV, Constant.ECG_KEY_MOOD
                    , Constant.ECG_KEY_RESPIRATORY_RATE
                    , Constant.ECG_KEY_SMOOTH, Constant.ECG_KEY_STRESS};
        }
        int algoType = 0;
        for (int type : algoTypes) {
            algoType |= type;
        }
        final int ret = NskAlgoSdk.NskAlgoInit(algoType, "", NSK_ALGO_SDK_LICENCE);
        if (ret == 0) {
            Log.e(TAG, "ECG algo has been initialized successfully.");
        } else {
            Log.e(TAG, "Failed to initialize ECG algo, code = " + ret);
        }
        if (!mNskAlgoSdk.setBaudRate(NskAlgoDataType.NSK_ALGO_DATA_TYPE_ECG
                , NskAlgoSampleRate.NSK_ALGO_SAMPLE_RATE_512)) {
                    Log.e(TAG, "Failed to set the sampling rate: " + NskAlgoSampleRate.NSK_ALGO_SAMPLE_RATE_512);
            return;
        }

        mNskAlgoSdk.setOnSignalQualityListener(new NskAlgoSdk.OnSignalQualityListener() {
            @Override
            public void onSignalQuality(int level) {
                if (mEcgListener != null)
                    mEcgListener.onSignalQuality(level);
            }

            @Override
            public void onOverallSignalQuality(int value) {
            }
        });

        String sdkVersion = "SDK ver: " + NskAlgoSdk.NskAlgoSdkVersion();
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_HEARTAGE) != 0) {
            NskAlgoSdk.NskAlgoSetECGConfigHeartage(OUTPUT_INTERVAL);
            sdkVersion += "\nHeartage ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_HEARTAGE);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_HEARTRATE) != 0) {
            sdkVersion += "\nHeartrate ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_HEARTRATE);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_HRV) != 0) {
            NskAlgoSdk.NskAlgoSetECGConfigHRV(OUTPUT_INTERVAL);
            sdkVersion += "\nHRV ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_HRV);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_MOOD) != 0) {
            sdkVersion += "\nMood ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_MOOD);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_RESPIRATORY) != 0) {
            sdkVersion += "\nResp ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_RESPIRATORY);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_SMOOTH) != 0) {
            sdkVersion += "\nSmooth ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_SMOOTH);
        }
        if ((algoType & NskAlgoType.NSK_ALGO_TYPE_ECG_STRESS) != 0) {
            NskAlgoSdk.NskAlgoSetECGConfigStress(OUTPUT_INTERVAL, OUTPUT_INTERVAL);
            sdkVersion += "\nStress ver: " + NskAlgoSdk.NskAlgoAlgoVersion(NskAlgoType.NSK_ALGO_TYPE_ECG_STRESS);
        }
        Log.d(TAG, sdkVersion);
        
        mNskAlgoSdk.setOnECGAlgoIndexListener((type, value) -> {
            switch (type) {
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_HR:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_HEART_RATE, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_ROBUST_HR:
                    if (mEcgListener != null && value > 0) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_ROBUST_HR, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_MOOD:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_MOOD, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_R2R:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_R2R, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_HRV:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_HRV, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_HEARTAGE:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_HEART_AGE, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_RDETECTED:
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_SMOOTH:
                    if (outputArrayData) {
                        if (pkgIndex % pkgLen == 0) {
                            pkgIndex = 0;
                            outputPkg = new int[pkgLen];
                        }
                        outputPkg[pkgIndex] = value;
                        pkgIndex++;
                    } else {
                        if (mEcgListener != null) {
                            mEcgListener.onDrawWave(value);
                        }
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_STRESS:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_STRESS, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_HEARTBEAT:
                    if (mEcgListener != null) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_HEART_BEAT, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_VALUE_TYPE_RESPIRATORY_RATE:
                    if (mEcgListener != null && value > 0) {
                        mEcgListener.onECGValues(Constant.ECG_KEY_RESPIRATORY_RATE, value);
                    }
                    break;
                case NskAlgoECGValueType.NSK_ALGO_ECG_TYPE_UNKNOWN:
                default:
                    break;
            }
        });
    }

    public void setOnEcgResultListener(EcgListener listener) {
        this.mEcgListener = listener;
    }

    public void dealEcgVal(byte[] bytes) {
        for (byte b : bytes) {
            int dataRec = (b & 0xff);
            if (ecgStageFlag == 0) {
                if (dataRec == 0xaa) {
                    ecgStageFlag++;
                }
            } else if (ecgStageFlag == 1) {
                if (dataRec == 0xaa) {
                    ecgStageFlag++;
                } else {
                    ecgStageFlag = 0;
                }
            } else if (ecgStageFlag == 2) {
                if (dataRec == 0x12) {
                    ecgStageFlag++;
                } else {
                    ecgStageFlag = 0;
                }
            } else if (ecgStageFlag == 3) {
                if (dataRec == 0x02) {
                    ecgStageFlag++;
                } else {
                    ecgStageFlag = 0;
                }
            } else if (ecgStageFlag == 4) {
                if (dataRec == 0x00) {
                    if (isFingerTouchOnSensor && !outputRawData) {
                        NskAlgoSdk.NskAlgoPause();
                        NskAlgoSdk.NskAlgoStop();
                    }
                    isFingerTouchOnSensor = false;
                } else if (dataRec == 0xC8) {
                    pkgIndex = 0;
                    if (!isFingerTouchOnSensor && !outputRawData) {
                        NskAlgoSdk.NskAlgoStart(false);
                    }
                    isFingerTouchOnSensor = true;
                }
                if (mEcgListener != null) {
                    mEcgListener.onFingerDetection(isFingerTouchOnSensor);
                }
                ecgStageFlag++;
            } else if (ecgStageFlag >= 5 && ecgStageFlag <= 21) {
                ecgStageFlag++;
            } else if (ecgStageFlag >= 22 && ecgStageFlag <= 1045) {
                if (ecgStageFlag % 2 == 0) {
                    dataEcg = dataRec << 8;
                } else {
                    dataEcg += dataRec;
                    if (dataEcg >= 32768) {
                        dataEcg -= 65536;
                    }
                    if (outputRawData) {
                        if (isFingerTouchOnSensor) {
                            if (outputArrayData) {
                                if (pkgIndex % pkgLen == 0) {
                                    pkgIndex = 0;
                                    outputPkg = new int[pkgLen];
                                }
                                outputPkg[pkgIndex] = dataEcg;
                                pkgIndex++;
                            } else {
                                if (mEcgListener != null) {
                                    mEcgListener.onDrawWave(dataEcg);
                                }
                            }
                        }
                    } else {
                        if (ecgDataIndex == 0 || ecgDataIndex % 256 == 0) {
                            short[] pqValue = {(short) 200};
                            NskAlgoSdk.NskAlgoDataStream(NskAlgoDataType.NSK_ALGO_DATA_TYPE_ECG_PQ, pqValue, 1);
                        }
                        NskAlgoSdk.NskAlgoDataStream(NskAlgoDataType.NSK_ALGO_DATA_TYPE_ECG, new short[]{(short) dataEcg}, 1);
                    }
                    ecgDataIndex++;
                }
                ecgStageFlag = ecgStageFlag == 1045 ? 0 : ecgStageFlag + 1;
            } else {
                ecgStageFlag = 0;
            }
        }
    }
}
