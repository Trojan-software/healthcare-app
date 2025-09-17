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
- **Mobile-First Design**: PWA with offline support, mobile-optimized dashboards, device installation without app store, push notifications, and cross-platform compatibility.
- **Data Flow**: Secure JWT authentication, real-time data capture from HC03 devices, data validation and storage, immediate alert generation for critical readings, and an analytics pipeline for insights.
- **Bilingual Support**: Comprehensive Arabic/English internationalization with RTL/LTR layouts across all interfaces, including forms, dashboards, and reports.
- **Advanced Monitoring**: ECG monitoring with interval analysis, arrhythmia detection, and clinical interpretation. Comprehensive battery and blood glucose monitoring systems with real-time data and alerts.
- **Patient Management**: Full CRUD operations for patient records, advanced search and filtering, and comprehensive audit trails.
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