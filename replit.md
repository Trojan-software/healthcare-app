# 24/7 Tele H - Health Monitoring System

## Overview
The 24/7 Tele H platform is a comprehensive telemedicine and health monitoring system designed for healthcare professionals and patients. Its core purpose is to provide real-time vital signs monitoring, integrate with HC03 medical devices, and offer a mobile-first Progressive Web App (PWA) experience. The system aims to enhance patient care through continuous monitoring, early alert systems, and robust data analytics, ultimately improving health outcomes and operational efficiency for healthcare providers.

## User Preferences
```
Preferred communication style: Simple, everyday language.
Technical documentation: Comprehensive technology descriptions when requested.
PDF documentation: Professional technical documentation with detailed specifications.
```

## System Architecture
The system employs a modern full-stack architecture. The frontend is built with **React 18** and **TypeScript**, utilizing **Tailwind CSS** with `shadcn/ui` for styling, **TanStack Query** for state management, and **Wouter** for routing. It is built with **Vite** and includes full **PWA** support with offline capabilities.

The backend uses **Node.js** with **TypeScript** and **Express.js** for its REST API. **PostgreSQL**, specifically **Neon Database** (serverless), is used with **Drizzle ORM** for data management. **JWT-based authentication** with `bcrypt` ensures secure user access.

**Key Features and Design Decisions:**
- **Enhanced Patient Registration**: Comprehensive signup, UAE mobile validation, patient ID generation, Abu Dhabi hospital selection, OTP email verification, secure passwords, and role-based access.
- **Health Monitoring**: Tracks heart rate, blood pressure, temperature, oxygen, blood glucose, and integrates with HC03 devices via Bluetooth for real-time ECG and blood oxygen monitoring. Includes health analytics and a critical event alert system.
- **Native Android Bluetooth Integration**: Capacitor plugin with HC03 native SDK (NskAlgoSdk) for reliable Bluetooth connectivity on Android devices. Includes ECG signal processing, heart rate variability analysis, mood index calculation, and respiratory rate detection. Falls back to Web Bluetooth API for web browsers.
- **Mobile-First Design**: PWA with offline support, mobile-optimized dashboards, device installation without app store, push notifications, and cross-platform compatibility.
- **Data Flow**: Secure JWT authentication, real-time data capture from HC03 devices via native Android plugin or Web Bluetooth API, data validation and storage, immediate alert generation for critical readings, and an analytics pipeline for insights.
- **Bilingual Support**: Comprehensive Arabic/English internationalization with RTL/LTR layouts across all interfaces, including forms, dashboards, and reports.
- **Advanced Monitoring**: ECG monitoring with interval analysis, arrhythmia detection, and clinical interpretation using NeuroSky ECG algorithms. Comprehensive battery and blood glucose monitoring systems with real-time data and alerts.
- **Patient Management**: Full CRUD operations for patient records, advanced search and filtering, comprehensive audit trails, and enhanced patient details view with comprehensive modal interface replacing basic alert dialogs.
- **Enhanced UI Components**: Interactive health metrics cards with detailed modal views featuring trend charts, health tips, and status indicators. Professional patient details interface with organized sections including personal information, vital signs, health overview, and recent activity timeline.
- **Deployment**: Development on Replit (Node.js 20, PostgreSQL 16), production builds using Vite and esbuild, Drizzle for schema migrations, and self-hosted PWA distribution.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe ORM for database interactions.
- **@tanstack/react-query**: Server state management and caching.
- **@radix-ui/***: Accessible UI component primitives.
- **chart.js**: Data visualization.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: JWT authentication.
- **wouter**: Lightweight client-side routing.
- **tailwind CSS**: Utility-first CSS framework.
- **vite**: Frontend build tool.
- **tsx**: TypeScript execution for development.
- **esbuild**: JavaScript bundler.
- **drizzle-kit**: Database schema migrations.
- **@capacitor/core**: Cross-platform native runtime for web apps.
- **@capacitor/android**: Android platform support for Capacitor.
- **@capacitor/ios**: iOS platform support for Capacitor.

## HC03 Native Bluetooth Implementation
The system includes Capacitor-based native plugins for reliable HC03 Bluetooth connectivity on both Android and iOS platforms:

### Android Implementation

**Android Components:**
- **NskAlgoSdk.jar**: NeuroSky algorithm library for ECG signal processing (v1.0)
- **EcgManager.java**: Singleton manager for ECG data processing with algorithm callbacks
- **HC03BluetoothPlugin.java**: Capacitor plugin bridge between native Android and React
- **Native Libraries**: ARM64, ARMv7, x86, x86_64 .so libraries for signal processing

**Bluetooth Permissions (AndroidManifest.xml):**
- BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_SCAN, BLUETOOTH_CONNECT
- ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION (required for BLE on Android)

**Build Configuration:**
- JAR library integration in android/app/build.gradle
- Native .so libraries in android/app/src/main/jniLibs/
- Minimum SDK: 21 (Android 5.0)
- Target SDK: Latest Android version

### iOS Implementation

**iOS Components:**
- **libNSKAlgoSDKECG.a**: NeuroSky static library for ECG signal processing (3.8 MB)
- **NSKAlgoSDKECG.h**: Objective-C header for NeuroSky SDK
- **SDKHealthMonitor.swift**: Swift wrapper for ECG data processing and analysis
- **HC03BluetoothPlugin.swift**: Capacitor plugin bridge between native iOS and React
- **HC03Bluetooth-Bridging-Header.h**: Bridging header to expose Objective-C SDK to Swift

**Bluetooth Permissions (Info.plist):**
- NSBluetoothAlwaysUsageDescription: Bluetooth access for HC03 medical device
- NSBluetoothPeripheralUsageDescription: Bluetooth peripheral access
- UIBackgroundModes: bluetooth-central (for background Bluetooth operations)

**Build Configuration:**
- Static library integration via Podfile
- Library search paths configured for NeuroSky SDK
- Swift-Objective-C bridging header setup
- Minimum iOS: 14.0
- Target iOS: Latest iOS version

### TypeScript Integration

**Shared Components:**
- **HC03BluetoothPlugin**: Capacitor plugin TypeScript definitions
- **HC03NativeService**: Hybrid service that uses native plugin on Android/iOS and Web Bluetooth API in browsers
- Automatic fallback mechanism for cross-platform compatibility

### Features (Both Platforms)

- Real-time ECG waveform processing (512Hz sampling rate)
- Heart rate and HRV (Heart Rate Variability) calculation
- Mood index analysis (1-100 scale: chill to excitement/anxiety)
- Respiratory rate detection
- RR interval analysis for cardiac health
- Stress level assessment
- Heart age calculation
- Finger touch detection for signal quality
- Signal quality monitoring

## Security Implementation (November 2025)

Following ADHCC Mobile Application Security Assessment (Oct 9, 2025), comprehensive security measures have been implemented:

### Security Features

**HIGH Priority (Critical):**
1. **Root Detection** (CVSS 6.8) - Detects rooted devices, SU binaries, root management apps
   - Implementation: `SecurityManager.java`, `SecurityPlugin.java`
   - Compliance: OWASP MASVS-RESILIENCE-1, HIPAA 164.308(a)(4), PCI-DSS 7.1-7.2

2. **SSL Certificate Pinning** (CVSS 5.9) - Prevents MITM attacks
   - Implementation: `network_security_config.xml`
   - HTTPS-only enforcement for production domains
   - Compliance: OWASP MASVS-NETWORK-1, PCI-DSS 4.1-4.2

3. **WebView Security** (CVSS 8.1) - Secure WebView configuration
   - Capacitor default security + network security config
   - File scheme access disabled, HTTPS-only loading

**MEDIUM Priority:**
4. **Hooking Detection** (CVSS 5.7) - Detects Frida, Xposed, Substrate frameworks
5. **Weak PRNG Fixed** (CVSS 6.1) - Cryptographically secure random generation
   - Implementation: `server/utils/secure-random.ts`
   - Replaces Math.random() with crypto.randomBytes()
   - Used for passwords, OTPs, tokens
   - Compliance: OWASP MASVS-CRYPTO-1, HIPAA 164.312(c)(1)

6. **StrandHogg Prevention** (CVSS 6.5) - Task hijacking protection
   - launchMode: singleInstance, taskAffinity: ""
   - Compliance: OWASP MASVS-PLATFORM-3

7. **Screenshot Prevention** (CVSS 6.8) - FLAG_SECURE enabled
   - Prevents screenshots and screen recording
   - Compliance: OWASP MASVS-PLATFORM-3, PCI-DSS 3.1-3.3

**LOW Priority:**
8. **Developer Options Detection** (CVSS 3.4)
9. **ADB Detection** (CVSS 3.4)
10. **Bytecode Obfuscation** (CVSS 2.3) - ProGuard/R8 enabled for release builds
11. **Android Backup Disabled** (CVSS 3.3) - allowBackup: false

### Security Plugins

**SecurityPlugin (Capacitor):**
- `checkRootStatus()` - Real-time root detection
- `checkDeveloperOptions()` - Developer mode detection
- `checkAdbStatus()` - ADB enabled detection
- `checkHookingStatus()` - Hooking framework detection
- `getComprehensiveSecurityStatus()` - Complete security audit

### Compliance Status

✅ **HIPAA** - Administrative, Technical Safeguards (164.308, 164.312)
✅ **PCI-DSS v4.0** - Data Protection, Access Control, Secure Development
✅ **GDPR** - Data Protection by Design (Art-25), Security of Processing (Art-32)
✅ **OWASP MASVS v2** - Resilience, Platform, Crypto, Network standards
✅ **CWE** - Industry-standard vulnerability classifications

### Security Documentation

- Complete implementation guide: `SECURITY_IMPLEMENTATION.md`
- ProGuard configuration: `android/app/proguard-rules.pro`
- Network security: `android/app/src/main/res/xml/network_security_config.xml`

### Build Configuration

**Android Security Settings:**
- Gradle 8.12.1, AGP 8.8.0, SDK 35
- ProGuard obfuscation enabled (release)
- Resource shrinking enabled
- Backup disabled
- FLAG_SECURE enabled
- Certificate pinning configured