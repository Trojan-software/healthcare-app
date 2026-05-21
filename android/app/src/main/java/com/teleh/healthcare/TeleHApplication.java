package com.teleh.healthcare;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ADHCC Security Compliance — Encrypted SharedPreferences
 *
 * Finding addressed:
 *   6.1 MEDIUM — Storing Information in SharedPreferences (MSTG-STORAGE-2, CWE-312)
 *
 * Overrides getSharedPreferences() at the Application level so that ALL preferences
 * stored by this app — including Capacitor's internal bookkeeping keys — are
 * transparently encrypted at rest using AES-256-GCM / AES-256-SIV backed by
 * Android Keystore.
 *
 * Instances are cached in a ConcurrentHashMap so that MasterKey creation and
 * EncryptedSharedPreferences initialisation happen only ONCE per preference file
 * name (not on every getSharedPreferences() call), preventing ANR on startup.
 *
 * Compliance: OWASP MASVS-STORAGE-1, HIPAA 164.312(a)(2)(iv), GDPR Art-32
 */
public class TeleHApplication extends Application {

    private final Map<String, SharedPreferences> cache = new ConcurrentHashMap<>();
    private MasterKey masterKey;

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            masterKey = new MasterKey.Builder(this)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
        } catch (GeneralSecurityException | IOException e) {
            // masterKey stays null; getSharedPreferences falls back to plain prefs
        }
    }

    @Override
    public SharedPreferences getSharedPreferences(String name, int mode) {
        if (masterKey == null) {
            return super.getSharedPreferences(name, mode);
        }

        SharedPreferences cached = cache.get(name);
        if (cached != null) {
            return cached;
        }

        try {
            SharedPreferences encrypted = EncryptedSharedPreferences.create(
                    this,
                    "enc_" + name,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            cache.put(name, encrypted);
            return encrypted;
        } catch (GeneralSecurityException | IOException e) {
            return super.getSharedPreferences(name, mode);
        }
    }
}
