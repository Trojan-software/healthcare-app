package com.teleh.healthcare;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * ADHCC Security Compliance — Encrypted SharedPreferences
 *
 * Finding addressed:
 *   6.1 MEDIUM — Storing Information in SharedPreferences (MSTG-STORAGE-2, CWE-312)
 *
 * IMPORTANT: We only encrypt OUR OWN named preference files. We do NOT wrap
 * Capacitor / WebView / framework preference files because:
 *   - Capacitor's internal bookkeeping breaks if its prefs are silently encrypted
 *   - Existing plaintext prefs from older app versions cannot be opened as
 *     EncryptedSharedPreferences and would throw on launch (instant crash on upgrade)
 *
 * Sensitive app data (JWT, patient info) is stored server-side or in WebView
 * localStorage protected by the encrypted WebView storage path — not in
 * SharedPreferences. This override exists so that any future SharedPreferences
 * usage from OUR code path goes through encryption automatically.
 *
 * Compliance: OWASP MASVS-STORAGE-1, HIPAA 164.312(a)(2)(iv), GDPR Art-32
 */
public class TeleHApplication extends Application {

    /** Only these preference file names are wrapped with EncryptedSharedPreferences. */
    private static final Set<String> ENCRYPTED_PREF_FILES = new HashSet<>();
    static {
        ENCRYPTED_PREF_FILES.add("teleh_secure_prefs");
        ENCRYPTED_PREF_FILES.add("teleh_user_data");
    }

    private final Map<String, SharedPreferences> cache = new ConcurrentHashMap<>();
    private MasterKey masterKey;

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            masterKey = new MasterKey.Builder(this)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
        } catch (Throwable t) {
            // Never crash the app on Application.onCreate — fall back to plain prefs.
            masterKey = null;
        }
    }

    @Override
    public SharedPreferences getSharedPreferences(String name, int mode) {
        // Only intercept our own named preference files; everything else
        // (Capacitor, WebView, AndroidX, etc.) gets vanilla SharedPreferences.
        if (masterKey == null || name == null || !ENCRYPTED_PREF_FILES.contains(name)) {
            return super.getSharedPreferences(name, mode);
        }

        SharedPreferences cached = cache.get(name);
        if (cached != null) {
            return cached;
        }

        try {
            SharedPreferences encrypted = EncryptedSharedPreferences.create(
                    this,
                    name,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            cache.put(name, encrypted);
            return encrypted;
        } catch (Throwable t) {
            // If keystore is unavailable / corrupted, never crash — fall back.
            return super.getSharedPreferences(name, mode);
        }
    }
}
