# 24/7 Tele H - Health Monitoring System

## Overview
The 24/7 Tele H platform is a comprehensive telemedicine and health monitoring system for healthcare professionals and patients. It provides vital signs tracking with manual data entry, health analytics, appointment scheduling, and offers a mobile-first Progressive Web App (PWA) experience. The system aims to enhance patient care through continuous monitoring, early alerts, and robust data analytics, improving health outcomes and operational efficiency.

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
-   **Health Monitoring**: Tracks heart rate, blood pressure, temperature, oxygen, blood glucose with manual vital signs input. Includes health analytics and a critical event alert system.
-   **Mobile-First Design**: PWA with offline support, mobile-optimized dashboards, direct device installation, push notifications, and cross-platform compatibility.
-   **Data Flow**: Secure JWT authentication, manual data entry, data validation and storage, immediate alert generation, and an analytics pipeline.
-   **Bilingual Support**: Comprehensive Arabic/English internationalization with RTL/LTR layouts across all interfaces.
-   **Patient Management**: Full CRUD operations for patient records, advanced search/filtering, audit trails, and enhanced patient details view with modal interfaces.
-   **Enhanced UI Components**: Interactive health metrics cards with detailed modal views, trend charts, health tips, and status indicators. Professional patient details interface with organized sections.
-   **Security Implementation**: Implemented comprehensive security measures based on ADHCC assessments, including network security (HTTPS-only, certificate pinning), no hardcoded secrets, root detection, secure WebViews, disabled application logs in production, tapjacking protection, hooking detection, cryptographically secure PRNG, StrandHogg prevention, screenshot prevention, and bytecode obfuscation. Achieves compliance with HIPAA, PCI-DSS, GDPR, OWASP MASVS, and CWE.

## Recent Changes (December 2025)
-   **Linktop SDK Re-integrated**: Web Bluetooth integration restored with Linktop Health Monitor SDK v2.6.4 for HC02/HC03 device connectivity. Supports ECG, SpO2, blood pressure, temperature, and blood glucose measurements alongside manual vital signs input.
-   **Device Context Architecture**: Two context providers work together:
    -   `DeviceDataProvider`: Base context for device connection state and live readings (legacy compatibility)
    -   `DeviceProvider`: Wraps Linktop SDK with `useLinktopDevice` hook that bridges measurements to DeviceDataContext
-   **Translation Keys Added**: Added healthScore, appointments, lastCheckup to i18n for English/Arabic support

## ADHCC Security Compliance (November 2025)

**Audit Status**: ⚠️ **18/20 Implemented | 2/20 Pending Production Setup**

The application implements comprehensive security controls. All code and infrastructure are production-ready. Two findings require production environment setup before deployment:

### Critical & High Severity (1/2 Complete, 1/2 Pending)
- ⏳ **Network Security (9.1)**: HTTPS-only enforced, certificate pinning infrastructure ready in `network_security_config.xml`. **ACTION REQUIRED**: Generate and insert certificate pins once production SSL certificates are deployed to 247tech.net
- ✅ **Hardcoded Secrets (7.5)**: Zero hardcoded credentials; keystore passwords via environment variables with CI/CD validation

### Medium Severity (11/12 Complete, 1/12 Pending)
- ✅ **Root Detection (6.8)**: Multi-method detection (su binary, root apps, test-keys) in `SecurityManager.java`
- ✅ **Screenshot Prevention (6.8)**: `FLAG_SECURE` blocks MediaProjection attacks
- ✅ **StrandHogg Protection (6.5)**: `singleInstance` launch mode with empty task affinity
- ✅ **Application Logs (6.2)**: ProGuard strips all Log statements in release builds
- ✅ **Broadcast Receivers (6.1)**: No dynamic receivers; all are statically declared with proper protection
- ✅ **SharedPreferences (6.1)**: No sensitive data in SharedPreferences; using encrypted backend API
- ⏳ **Certificate Pinning (5.9)**: Infrastructure ready; **ACTION REQUIRED**: Same as Network Security (9.1) above
- ✅ **Hooking Detection (5.7)**: Detects Frida, Xposed, and Substrate frameworks
- ✅ **WebView Security (5.4)**: Capacitor secure defaults with Content Security Policy
- ✅ **Tapjacking Protection (4.8)**: `setFilterTouchesWhenObscured(true)` blocks overlay attacks
- ✅ **Developer Options (3.4)**: Runtime detection with user warnings
- ✅ **ADB Detection (3.4)**: Runtime detection with security alerts

### Additional Controls (4/4)
- ✅ **Bytecode Obfuscation**: R8/ProGuard with aggressive optimization (7 passes)
- ✅ **Backup Disabled**: `allowBackup=false` prevents ADB extraction
- ✅ **PRNG Security**: Using Java `SecureRandom` for cryptographic operations
- ✅ **Permission Minimization**: Only essential permissions; unused ones explicitly removed

### Pre-Production Requirements (CRITICAL - Must Complete)

**🔴 BLOCKER: Certificate Pinning (Findings 9.1 & 5.9)**

Certificate pinning CANNOT be completed until production SSL certificates are deployed. Once SSL is live:

1. **Deploy Production SSL Certificates**:
   - Install valid SSL certificate on `247tech.net`
   - Install valid SSL certificate on `api.247tech.net`
   - Verify both domains are accessible via HTTPS

2. **Generate and Insert Certificate Pins**:
   ```bash
   ./scripts/generate-cert-pins.sh 247tech.net
   ```
   Copy the generated `<pin-set>` output and replace lines 27-44 in:
   `android/app/src/main/res/xml/network_security_config.xml`

3. **Set CI/CD Environment Variables**:
   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_ALIAS`: Key alias (default: `healthcare-app`)
   - `ANDROID_KEY_PASSWORD`: Key password

4. **Build and Test Release APK**:
   ```bash
   export ANDROID_KEYSTORE_PASSWORD=your_password
   export ANDROID_KEY_ALIAS=healthcare-app
   export ANDROID_KEY_PASSWORD=your_password
   
   cd android
   ./gradlew clean assembleRelease
   adb install app/build/outputs/apk/release/app-release.apk
   ```

5. **Validate Security Controls**: Follow `docs/SECURITY_DEPLOYMENT_CHECKLIST.md`

**Current Compliance Status**: 18/20 findings implemented in code, 2/20 require production SSL setup

**Reference Documentation**:
- **Certificate Pinning Guide**: `docs/CERTIFICATE_PINNING_GUIDE.md` ⭐ READ THIS FIRST
- Security Deployment Checklist: `docs/SECURITY_DEPLOYMENT_CHECKLIST.md`
- Certificate Pin Generator: `scripts/generate-cert-pins.sh`
- Environment Template: `.env.example`
- ADHCC Audit Report: All findings addressed in code; 2 require production environment

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