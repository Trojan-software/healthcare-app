# ProGuard/R8 Rules for 24/7 Tele H Healthcare App
# Security: LOW (2.3) - Bytecode Obfuscation
# This protects against reverse engineering and code analysis

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

# Remove logging in release builds for security
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
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
