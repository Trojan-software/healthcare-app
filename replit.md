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

## HC03 Native Bluetooth Implementation
The system includes a Capacitor-based native Android plugin for reliable HC03 Bluetooth connectivity:

**Android Components:**
- **NskAlgoSdk.jar**: NeuroSky algorithm library for ECG signal processing (v1.0)
- **EcgManager.java**: Singleton manager for ECG data processing with algorithm callbacks
- **HC03BluetoothPlugin.java**: Capacitor plugin bridge between native Android and React
- **Native Libraries**: ARM64, ARMv7, x86, x86_64 .so libraries for signal processing

**TypeScript Integration:**
- **HC03BluetoothPlugin**: Capacitor plugin TypeScript definitions
- **HC03NativeService**: Hybrid service that uses native plugin on Android and Web Bluetooth API in browsers
- Automatic fallback mechanism for cross-platform compatibility

**Features:**
- Real-time ECG waveform processing (512Hz sampling rate)
- Heart rate and HRV (Heart Rate Variability) calculation
- Mood index analysis (1-100 scale: chill to excitement/anxiety)
- Respiratory rate detection
- RR interval analysis for cardiac health
- Stress level assessment
- Finger touch detection for signal quality
- Signal quality monitoring

**Bluetooth Permissions (AndroidManifest.xml):**
- BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_SCAN, BLUETOOTH_CONNECT
- ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION (required for BLE on Android)

**Build Configuration:**
- JAR library integration in android/app/build.gradle
- Native .so libraries in android/app/src/main/jniLibs/
- Minimum SDK: 21 (Android 5.0)
- Target SDK: Latest Android version