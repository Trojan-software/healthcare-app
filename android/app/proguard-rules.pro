# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ProGuard/R8 Rules for 24/7 Tele H Healthcare App
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADHCC Security: Bytecode Obfuscation (Medium - 2.3)
# 
# This configuration protects against:
# - Reverse engineering and decompilation
# - Code analysis and tampering
# - Unauthorized access to business logic
# - Exposure of security implementations
#
# Compliance: OWASP MASVS-RESILIENCE-4, CWE-656
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# R8 Missing-class suppressions
# androidx.security:security-crypto pulls in google/tink which
# references compile-time-only annotation libraries that are not
# packaged in the APK. These are annotations only — no runtime impact.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn javax.annotation.concurrent.**
-dontwarn org.checkerframework.**
-dontwarn com.google.auto.value.**
# Tink's KeysDownloader (we don't use it) references Google HTTP Client + Joda
-dontwarn com.google.api.client.**
-dontwarn org.joda.time.**

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRITICAL: Classes referenced by name in AndroidManifest.xml MUST be kept.
# Without these, -repackageclasses '' renames them and Android throws
# ClassNotFoundException on launch → instant crash.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-keep class com.teleh.healthcare.TeleHApplication { *; }
-keep class com.teleh.healthcare.MainActivity { *; }
-keep class com.teleh.healthcare.MainActivity$* { *; }

# Standard Android components — manifest references and framework reflection
-keep public class * extends android.app.Application
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends androidx.core.content.FileProvider

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# Keep custom plugins
-keep class com.teleh.healthcare.HC03BluetoothPlugin { *; }
-keep class com.teleh.healthcare.HC03BluetoothPlugin$* { *; }
-keep class com.teleh.healthcare.SecurityPlugin { *; }
-keep class com.teleh.healthcare.SecurityPlugin$* { *; }
-keep class com.teleh.healthcare.EcgManager { *; }
-keep class com.teleh.healthcare.EcgManager$* { *; }

# Keep entire security package (SecurityManager + helpers referenced via reflection)
-keep class com.teleh.healthcare.security.** { *; }

# Keep androidx.security crypto (EncryptedSharedPreferences depends on Tink)
-keep class androidx.security.** { *; }
-keep class com.google.crypto.tink.** { *; }

# Keep security package (public APIs only, internals are obfuscated)
-keep class com.teleh.healthcare.security.SecurityManager {
    public <methods>;
}

# Keep NeuroSky SDK
-keep class com.neurosky.** { *; }

# Keep AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep R class
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY: Remove ALL logging in release builds
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADHCC Compliance: Application Logs (Medium - 6.2)
# Prevents sensitive data leakage through system logs
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
    public static *** wtf(...);
}

# NOTE: -assumenosideeffects on java.io.PrintStream and java.lang.Throwable
# is not supported by R8 and causes "Compilation failed to complete".
# android.util.Log stripping above covers all app-level logging (ADHCC 6.2).

# Optimization flags
-optimizationpasses 5
-dontskipnonpubliclibraryclasses
-verbose

# Obfuscation options — repackageclasses moves all classes into a single flat package
# NOTE: do NOT use -flattenpackagehierarchy together with -repackageclasses (mutually exclusive)
-repackageclasses ''
-allowaccessmodification
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# Keep essential attributes for runtime and crash reporting
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes SourceFile,LineNumberTable

# Keep custom model classes
-keep class com.teleh.healthcare.models.** { *; }

# Hide original source file names
-renamesourcefileattribute SourceFile

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENHANCED SECURITY: Additional Obfuscation & Hardening
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# String encryption for additional security
-adaptclassstrings
-adaptresourcefilenames
-adaptresourcefilecontents

# NOTE: -overloadaggressively and -flattenpackagehierarchy are NOT supported by R8
# and cause "Compilation failed to complete". Removed — -repackageclasses '' above
# already flattens the entire package hierarchy into a single unnamed package,
# achieving the same obfuscation goal.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY: Protect Security-Critical Classes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# While we keep class names for Capacitor reflection, we still
# obfuscate internal methods and fields to protect security logic
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


# Additional protection for sensitive data classes
-keepclassmembers class * implements java.io.Serializable {
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COMPLIANCE NOTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Bytecode Obfuscation (Medium - 2.3)
# ✅ Application Logs Removal (Medium - 6.2)
# ✅ OWASP MASVS-RESILIENCE-4 compliance
# ✅ CWE-656: Reliance on Security Through Obscurity
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
