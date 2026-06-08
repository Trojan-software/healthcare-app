---
name: ADHCC Android security audit triage
description: How to read ADHCC Android APK scan reports and the recurring debug-vs-release root cause
---

# ADHCC Android audit triage

ADHCC scans an uploaded APK and emails a password-protected PDF (password rotates per report;
arrives in their email). Reports land in `attached_assets/ADHCC-*.pdf`. Open with
`pdftotext -upw <password> file.pdf -`.

## Recurring root cause: DEBUG apk submitted instead of RELEASE
**Tell-tale:** if BOTH "Application Logs" (writing logs to system logs) AND "Bytecode Obfuscation"
fail in the same report, the scanned APK was a DEBUG/unminified build.
**Why:** both only pass when `minifyEnabled true` (ProGuard/R8) runs — which is release-only.
`build.gradle` release block is correct (minify+shrink+debuggable false); debug block has
`minifyEnabled false, debuggable true`.
**How to apply:** before debugging code, confirm the submitted artifact is
`android/app/build/outputs/apk/release/app-release.apk`, NOT `app-debug.apk`. Codemagic
artifact glob `**/*.apk` captures BOTH, so the wrong one is easy to grab.

## SharedPreferences 6.1 is effectively a false positive
Dynamic scan flags plaintext prefs but the only values found are Capacitor's own
`lastBinaryVersionCode=1` / `lastBinaryVersionName=1.0` (non-sensitive version numbers Capacitor
writes itself). Encrypting ALL prefs via TeleHApplication.getSharedPreferences override CRASHES
the app (Capacitor expects plaintext; upgrade from older build can't decrypt existing plaintext).
**Resolution:** only encrypt our own named pref files; request ADHCC override for 6.1.

## Weak PRNG 3.5 is a false positive
Native Android security code uses `java.security.SecureRandom` correctly. Scanner decompiles the
bundled WebView JS bundle and flags `Math.random()` (used for demo vital values + UI keys in the
React app) — not credential generation.

## App-launched signal
If the dynamic scan reports actual SharedPreferences values, the app LAUNCHED successfully
(no crash) in that build.
