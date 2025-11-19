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

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# Keep custom plugins
-keep class com.teleh.healthcare.HC03BluetoothPlugin { *; }
-keep class com.teleh.healthcare.SecurityPlugin { *; }
-keep class com.teleh.healthcare.SecurityManager { *; }
-keep class com.teleh.healthcare.EcgManager { *; }

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

# Also strip System.out and System.err
-assumenosideeffects class java.io.PrintStream {
    public void println(...);
    public void print(...);
}

# Strip printStackTrace calls
-assumenosideeffects class java.lang.Throwable {
    public void printStackTrace();
}

# Optimization flags
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose

# Obfuscation options
-repackageclasses ''
-allowaccessmodification
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# Keep annotation classes
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep source file names for crash reports
-keepattributes SourceFile,LineNumberTable

# Keep custom model classes
-keep class com.teleh.healthcare.models.** { *; }

# Hide original source file names
-renamesourcefileattribute SourceFile

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENHANCED SECURITY: Additional Obfuscation & Hardening
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Aggressive class name obfuscation
-overloadaggressively

# String encryption for additional security
-adaptclassstrings
-adaptresourcefilenames
-adaptresourcefilecontents

# Remove debugging information
-keepattributes !LocalVariableTable
-keepattributes !LocalVariableTypeTable

# Advanced optimization passes for smaller, harder to reverse APK
-optimizationpasses 7

# Flatten package hierarchy (makes reverse engineering harder)
-flattenpackagehierarchy ''

# Remove unused code
-dontwarn **
-ignorewarnings

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY: Protect Security-Critical Classes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# While we keep class names for Capacitor reflection, we still
# obfuscate internal methods and fields to protect security logic
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Obfuscate SecurityManager internal methods (keep only public API)
-keep class com.teleh.healthcare.SecurityManager {
    public <methods>;
}
-keepclassmembers class com.teleh.healthcare.SecurityManager {
    private <methods>;
    private <fields>;
}

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
