# 24/7 Tele H - Health Monitoring System

## Overview

This is a comprehensive telemedicine and health monitoring platform built for 24/7 Tele H Technology Services. The application provides healthcare professionals and patients with real-time vital signs monitoring, HC03 device integration, and mobile-first Progressive Web App (PWA) capabilities.

## System Architecture

The system follows a modern full-stack architecture with React frontend, Express.js backend, and PostgreSQL database:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **PWA Support**: Complete Progressive Web App implementation with service workers

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database Provider**: Neon Database (serverless PostgreSQL)

## Key Components

### User Management System
- Role-based access control (Admin/Patient)
- Secure user registration and authentication
- OTP verification system for email confirmation
- Patient profile management with unique patient IDs

### Health Monitoring Features
- **Vital Signs Tracking**: Heart rate, blood pressure, temperature, oxygen levels, blood glucose
- **HC03 Device Integration**: Bluetooth connectivity for medical devices
- **Real-time Data Collection**: ECG, blood oxygen, blood pressure monitoring
- **Health Analytics**: Trend analysis and risk assessment
- **Alert System**: Critical health event notifications

### Mobile-First Design
- Progressive Web App (PWA) with offline capabilities
- Mobile-optimized dashboard and interfaces
- Device installation without app store requirements
- Push notifications for health alerts
- Cross-platform compatibility (Android, iOS, Desktop)

## Data Flow

1. **User Authentication**: JWT tokens validate user sessions and role permissions
2. **Device Integration**: HC03 devices connect via Bluetooth for real-time data capture
3. **Data Processing**: Vital signs are validated, stored, and analyzed for health trends
4. **Alert Generation**: Critical readings trigger immediate notifications to healthcare providers
5. **Analytics Pipeline**: Historical data generates insights and compliance reports

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with schema management
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **chart.js**: Data visualization for health analytics
- **bcrypt**: Password hashing and security
- **jsonwebtoken**: Authentication token management

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **drizzle-kit**: Database schema migrations and management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module for development
- **Hot Reload**: Vite development server with HMR support
- **Port Configuration**: Application runs on port 5000

### Production Deployment
- **Build Process**: Vite builds optimized React bundle, esbuild packages Node.js server
- **Database Migrations**: Drizzle handles schema changes and data migrations
- **PWA Package**: Complete mobile app package with installation flow
- **Scaling**: Autoscale deployment target for production workloads

### PWA Distribution
- Self-hosted PWA package in `pwa-package/` directory
- Professional installation landing page
- Cross-platform mobile app experience
- No app store approval required
- Automatic updates through service workers

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```