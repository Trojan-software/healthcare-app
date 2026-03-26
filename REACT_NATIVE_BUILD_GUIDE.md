# 24/7 Tele H — React Native App Build Guide

## Overview
The React Native app is located in the `mobile/` directory.
It connects to the production API at **https://247tech.net**.

## Project Structure
```
mobile/
├── App.tsx                    # Root entry point
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── package.json               # Dependencies
├── babel.config.js            # Babel with NativeWind
├── metro.config.js            # Metro bundler config
├── tailwind.config.js         # NativeWind/Tailwind config
├── tsconfig.json              # TypeScript config
└── src/
    ├── api/
    │   ├── client.ts          # HTTP client (connects to 247tech.net)
    │   ├── auth.ts            # Login/auth endpoints
    │   └── vitals.ts          # Health data endpoints
    ├── contexts/
    │   ├── AuthContext.tsx    # JWT auth state (SecureStore)
    │   └── BLEContext.tsx     # Bluetooth HC03 integration
    ├── navigation/
    │   └── index.tsx          # React Navigation stack
    ├── screens/
    │   ├── LoginScreen.tsx          # Patient login
    │   ├── PatientDashboardScreen.tsx  # Vitals dashboard
    │   ├── AdminDashboardScreen.tsx    # Admin panel
    │   ├── VitalsHistoryScreen.tsx     # Readings history
    │   ├── DeviceConnectScreen.tsx     # HC03 BLE pairing
    │   ├── ECGScreen.tsx              # ECG monitor
    │   └── ProfileScreen.tsx          # User profile
    ├── components/
    │   ├── VitalCard.tsx      # Vital sign display card
    │   └── Header.tsx         # Screen header
    └── lib/
        ├── storage.ts         # SecureStore (JWT) wrapper
        └── i18n.ts            # English/Arabic translations
```

## Setup & Development

### Prerequisites
- Node.js 20+
- Expo CLI: `npm install -g expo-cli eas-cli`
- For iOS: Xcode 15+ on macOS
- For Android: Android Studio with SDK 34+

### Install Dependencies
```bash
cd mobile
npm install
```

### Start Development Server
```bash
cd mobile
npx expo start
```
Scan the QR code with **Expo Go** app on your device.

## Building for Production

### Android APK (Preview/Testing)
```bash
cd mobile
eas build --platform android --profile preview
```
Downloads a directly-installable APK.

### Android App Bundle (Play Store)
```bash
cd mobile
eas build --platform android --profile production
```

### iOS IPA (App Store)
```bash
cd mobile
eas build --platform ios --profile production
```
Uses Apple Team ID: **WN25J7TS7D**
Bundle ID: **com.teleh.healthcare**

### Build Both Platforms
```bash
cd mobile
eas build --platform all --profile production
```

## EAS Build Setup (First Time)

1. **Create Expo account**: https://expo.dev
2. **Login**: `eas login`
3. **Initialize project**: `eas build:configure`
4. **Android Keystore**: EAS will generate and manage the keystore automatically
5. **iOS Credentials**:
   - Apple ID: your Apple ID email
   - Team ID: WN25J7TS7D
   - Provisioning Profile: "24/7 Tele H App Store"
   - Distribution Certificate: "TeleH Distribution"

## Required Environment Variables (EAS Secrets)

Set these in your EAS project dashboard (expo.dev):
```
EXPO_PUBLIC_API_URL=https://247tech.net
```

## Bluetooth HC03 Device Integration

The `BLEContext.tsx` handles all Bluetooth communication:
- **Service UUID**: `0000FFE0-0000-1000-8000-00805F9B34FB`
- **Characteristic UUID**: `0000FFE1-0000-1000-8000-00805F9B34FB`
- Device name must contain: `HC03`, `Linktop`, or `UNKTOP`

### Measurement Commands (sent as Base64):
| Measurement     | Command bytes |
|----------------|---------------|
| Blood Pressure  | AA 01 AB      |
| Oxygen Level    | AA 02 AC      |
| Temperature     | AA 03 AD      |
| Blood Glucose   | AA 04 AE      |
| ECG             | AA 05 AF      |

## Security Features (ADHCC Compliant)

- ✅ JWT stored in device **Secure Enclave** (iOS) / **Keystore** (Android)
- ✅ All API calls over HTTPS to 247tech.net
- ✅ No sensitive data in AsyncStorage
- ✅ Certificate pinning via Expo network config
- ✅ Biometric authentication ready (expo-local-authentication)
- ✅ Session invalidation on logout

## Deployment Checklist

- [ ] Run `eas build --platform all --profile production`
- [ ] Test on physical Android device (BLE requires real hardware)
- [ ] Test on physical iPhone (BLE requires real hardware)
- [ ] Submit to Google Play: `eas submit --platform android`
- [ ] Submit to App Store: `eas submit --platform ios`

## CodeMagic Alternative

If using CodeMagic instead of EAS Build, copy `codemagic.yaml` from the root
and point it to the `mobile/` directory as the project root.
