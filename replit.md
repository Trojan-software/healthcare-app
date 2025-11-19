# 24/7 Tele H - Health Monitoring System

## Overview
The 24/7 Tele H platform is a comprehensive telemedicine and health monitoring system for healthcare professionals and patients. It provides real-time vital signs monitoring, integrates with HC03 medical devices, and offers a mobile-first Progressive Web App (PWA) experience. The system aims to enhance patient care through continuous monitoring, early alerts, and robust data analytics, improving health outcomes and operational efficiency.

## User Preferences
```
Preferred communication style: Simple, everyday language.
Technical documentation: Comprehensive technology descriptions when requested.
PDF documentation: Professional technical documentation with detailed specifications.
```

## System Architecture
The system employs a modern full-stack architecture. The frontend uses **React 18** with **TypeScript**, **Tailwind CSS** (`shadcn/ui`), **TanStack Query**, and **Wouter**, built with **Vite** and full **PWA** support. The backend uses **Node.js** with **TypeScript** and **Express.js** for its REST API. Data management is handled by **PostgreSQL** (Neon Database) with **Drizzle ORM**. **JWT-based authentication** with `bcrypt` secures user access.

**Key Features and Design Decisions:**
-   **Enhanced Patient Registration**: Comprehensive signup, UAE mobile validation, patient ID generation, Abu Dhabi hospital selection, OTP email verification, secure passwords, and role-based access.
-   **Health Monitoring**: Tracks heart rate, blood pressure, temperature, oxygen, blood glucose, and integrates with HC03 devices via Bluetooth for real-time ECG and blood oxygen monitoring. Includes health analytics and a critical event alert system.
-   **Complete HC03 Bluetooth Architecture (Nov 2025)**: 
    - **Web Bluetooth (PWA)**: Full HC03 protocol in `hc03-sdk.ts` with frame unpacking, multi-packet reconstruction, CRC validation (encryHead/encryTail), and all 6 sensor parsers (Battery, Temperature, Glucose, Oxygen, Pressure, ECG)
    - **Android Native BLE**: BluetoothAdapter + GATT with TRANSPORT_LE flag, proper permission handling (BLUETOOTH_SCAN/CONNECT), GATT error handling (status 133), notification enable verification, onDescriptorWrite callback
    - **iOS Native BLE**: Single CBCentralManager instance, service-agnostic scanning, auto-start on power-on, CoreBluetooth delegates for connection/data
    - **Unified Data Flow**: All platforms feed raw notify bytes → `generalUnpackRawData()` → `routeData()` → sensor parsers → JavaScript events
-   **Multi-Device Bluetooth Integration**: Supports all UNKTOP medical peripherals with a unified SDK wrapper, auto-pairing, and real-time data synchronization for various sensors (ECG, SpO2, BP, glucose, temperature). Features device-specific dashboard widgets with Chart.js.
-   **Mobile-First Design**: PWA with offline support, mobile-optimized dashboards, direct device installation, push notifications, and cross-platform compatibility.
-   **Data Flow**: Secure JWT authentication, real-time data capture from HC03 devices, data validation and storage, immediate alert generation, and an analytics pipeline.
-   **Bilingual Support**: Comprehensive Arabic/English internationalization with RTL/LTR layouts across all interfaces.
-   **Advanced Monitoring**: ECG monitoring with interval analysis, arrhythmia detection, and clinical interpretation using NeuroSky ECG algorithms. Comprehensive battery and blood glucose monitoring.
-   **Patient Management**: Full CRUD operations for patient records, advanced search/filtering, audit trails, and enhanced patient details view with modal interfaces.
-   **Enhanced UI Components**: Interactive health metrics cards with detailed modal views, trend charts, health tips, and status indicators. Professional patient details interface with organized sections.
-   **Security Implementation**: Implemented comprehensive security measures based on ADHCC assessments, including network security (HTTPS-only, certificate pinning), no hardcoded secrets, root detection, secure WebViews, disabled application logs in production, tapjacking protection, hooking detection, cryptographically secure PRNG, StrandHogg prevention, screenshot prevention, and bytecode obfuscation. Achieves compliance with HIPAA, PCI-DSS, GDPR, OWASP MASVS, and CWE.

## External Dependencies
-   **@neondatabase/serverless**: PostgreSQL database connectivity.
-   **drizzle-orm**: Type-safe ORM for database interactions.
-   **@tanstack/react-query**: Server state management and caching.
-   **@radix-ui/***: Accessible UI component primitives.
-   **chart.js**: Data visualization.
-   **bcrypt**: Password hashing.
-   **jsonwebtoken**: JWT authentication.
-   **wouter**: Lightweight client-side routing.
-   **tailwind CSS**: Utility-first CSS framework.
-   **vite**: Frontend build tool.
-   **tsx**: TypeScript execution for development.
-   **esbuild**: JavaScript bundler.
-   **drizzle-kit**: Database schema migrations.
-   **@capacitor/core**: Cross-platform native runtime for web apps.
-   **@capacitor/android**: Android platform support for Capacitor.
-   **@capacitor/ios**: iOS platform support for Capacitor.