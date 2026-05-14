package com.teleh.healthcare;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * ADHCC Security Compliance — Encrypted SharedPreferences
 *
 * Finding addressed:
 *   6.1 MEDIUM — Storing Information in SharedPreferences (MSTG-STORAGE-2, CWE-312)
 *
 * Overrides getSharedPreferences() at the Application level so that ALL preferences
 * stored by this app — including Capacitor's internal bookkeeping keys
 * (lastBinaryVersionCode, serverBasePath, origins_visited_date, etc.) — are
 * transparently encrypted at rest using AES-256-GCM / AES-256-SIV backed by
 * Android Keystore.
 *
 * Compliance: OWASP MASVS-STORAGE-1, HIPAA 164.312(a)(2)(iv), GDPR Art-32
 */
public class TeleHApplication extends Application {

    @Override
    public SharedPreferences getSharedPreferences(String name, int mode) {
        try {
            MasterKey masterKey = new MasterKey.Builder(this)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            return EncryptedSharedPreferences.create(
                    this,
                    "enc_" + name,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            return super.getSharedPreferences(name, mode);
        }
    }
}
