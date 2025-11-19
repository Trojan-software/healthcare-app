package com.ecg;
/**
 * @author czq841
 */
public interface EcgListener {

    void onDrawWave(int wave);

    void onSignalQuality(int level);

    void onECGValues(int key, int value);

    void onFingerDetection(boolean fingerDetected);
}
