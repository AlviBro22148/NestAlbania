# NestAlbania — Full-Stack Real Estate Platform

> A production-ready real estate platform built for the Albanian market, delivering property listings, community features, and market intelligence across a mobile app, admin dashboard, and REST API.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend (ReState API)](#backend-restate-api)
  - [Mobile App](#mobile-app)
  - [Admin Dashboard](#admin-dashboard)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security](#security)
- [Performance](#performance)
- [Internationalization](#internationalization)
- [License](#license)

---

## Overview

NestAlbania is a three-tier real estate platform composed of:

| Layer | Technology | Purpose |
|---|---|---|
| **API** | ASP.NET Core 9 + PostgreSQL | Central data layer, auth, business logic |
| **Mobile App** | React Native + Expo | Cross-platform iOS/Android client |
| **Admin Dashboard** | React + Vite | Property and user management |

The platform supports four user roles — **Admin**, **CityAdmin**, **Agent**, and **User** — with role-based access enforced at the API level. It ships with Albanian and English localization, real-time push notifications, an in-app chat system, and market analysis tooling.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  ┌──────────────────┐          ┌──────────────────────────┐ │
│  │  React Native    │          │    Admin Dashboard       │ │
│  │  Mobile App      │          │    React + Vite          │ │
│  └────────┬─────────┘          └────────────┬─────────────┘ │
└───────────┼────────────────────────────────┼───────────────┘
            │                HTTP/REST        │
┌───────────▼────────────────────────────────▼───────────────┐
│                  ASP.NET Core 9 REST API                    │
│         JWT Auth │ Rate Limiting │ Response Compression     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                            │
├──────────────┬──────────────────────────────┬──────────────┤
│  PostgreSQL  │         Redis Cache          │  Cloudinary  │
│  (Primary DB)│    (Distributed Caching)     │  (Images)    │
└──────────────┴──────────────────────────────┴──────────────┘
```

**Key architectural decisions:**

- **Service layer** sits between controllers and data access, keeping controllers thin and business logic testable.
- **Redis caching** with in-memory fallback reduces database pressure on high-traffic routes (e.g., city lists cached for 5 minutes, home feed for 60 seconds).
- **React Query** on both frontend targets manages server state, deduplication, and background refetching; persisted to MMKV on mobile for offline resilience.
- **File-based routing** via Expo Router gives the mobile app type-safe navigation and deeply linkable screens.

---

## Tech Stack

### Backend — `ReState/`

| Concern | Choice |
|---|---|
| Framework | ASP.NET Core 9.0 |
| Language | C# |
| ORM | Entity Framework Core 9 |
| Database | PostgreSQL |
| Cache | Redis (StackExchange.Redis) |
| Auth | JWT Bearer + Google OAuth 2.0 + TOTP 2FA |
| File Storage | Cloudinary |
| Email | SMTP (Gmail) |
| API Docs | Swagger / OpenAPI |
| Compression | Brotli + Gzip |
| Rate Limiting | ASP.NET Core built-in rate limiter |

### Mobile App — `React_Native_R.estate/`

| Concern | Choice |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript |
| Routing | Expo Router (file-based, typed) |
| Server State | TanStack React Query 5 |
| Local State | Zustand 5 |
| Persistence | MMKV |
| Styling | NativeWind (Tailwind for React Native) |
| Maps | React Native Maps |
| Charts | React Native Chart Kit |
| Notifications | Expo Push Notifications |
| Auth | Expo Auth Session + Google Sign-In |
| Forms | React Hook Form |
| HTTP | Axios |
| i18n | i18next |

### Admin Dashboard — `admin-dashboard/`

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Server State | TanStack React Query 5 |
| Charts | Recharts |
| Routing | React Router DOM 7 |
| Forms | React Hook Form |
| i18n | i18next |

---

## Project Structure

```
NestAlbania/
├── ReState/                        # Backend
│   ├── ReState/
│   │   ├── Controllers/            # 16 REST controllers
│   │   ├── Services/               # Business logic
│   │   ├── Entities/               # EF Core models (19 entities)
│   │   ├── Data/                   # DbContext + migrations
│   │   ├── Models/                 # DTOs & request/response types
│   │   ├── Filters/                # Action filters & attributes
│   │   ├── Program.cs              # DI container & middleware pipeline
│   │   └── appsettings.json        # Configuration
│   ├── docker-compose.yml          # Redis container
│   └── ReState.sln
│
├── React_Native_R.estate/          # Mobile app
│   ├── app/
│   │   ├── (root)/
│   │   │   ├── (tabs)/             # Bottom-tab screens
│   │   │   ├── (screens)/          # Modal & detail screens
│   │   │   ├── (admin)/            # Admin-gated screens
│   │   │   ├── auth/               # Login / registration
│   │   │   └── chat/               # Messaging
│   ├── components/                 # 23+ shared components
│   ├── contexts/                   # Auth, Chat, Alert, Theme contexts
│   ├── services/                   # API clients + external integrations
│   └── lib/                        # Query client, storage helpers
│
└── admin-dashboard/                # Web dashboard
    └── src/
        ├── pages/                  # 13 page components
        ├── components/             # Shared UI components
        ├── services/               # Axios API services
        ├── store/                  # Zustand slices
        ├── contexts/               # Context providers
        └── i18n/                   # EN / SQ translations
```

---

## Features

### Property Management
- Full CRUD for property listings with rich metadata (price, rooms, area, type, city, amenities)
- Advanced filtering and full-text search
- Property price history tracking
- Cloudinary-backed image uploads

### Green Homes
- Dedicated category for eco-certified properties
- Attribute tracking: solar panels, LED lighting, energy-efficient appliances

### User System
- Registration, login, JWT refresh token flow
- Google OAuth single sign-on
- Two-Factor Authentication (TOTP)
- Role hierarchy: `Admin → CityAdmin → Agent → User`
- Agent application workflow with admin approval
- User ban and report system

### Community & Engagement
- Social posts with comments and likes
- Property reviews with star ratings
- User favorites / saved properties
- Testimonials for local services

### Communication
- In-app chat between users and property owners
- Expo push notifications with per-user preference management
- SMTP email notifications

### Content
- Blog articles with categories, tags, featured flags, and view counters
- Aggregated RSS news feeds via CodeHollow.FeedReader
- Market analysis: price trends and insights by city

### Local Services Directory
- Curated directory of handymen, inspectors, and other real-estate-adjacent services

### Admin Dashboard
- Property moderation and management
- User management (roles, bans, agent requests)
- Blog and news editorial tools
- Feedback and report queue
- Analytics and market data visualization

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| .NET SDK | 9.0 |
| Node.js | 18 LTS |
| PostgreSQL | 14 |
| Redis | 6 |
| Docker (optional) | 24 |
| Expo CLI | latest |

---

### Backend (ReState API)

```bash
cd ReState

# Start Redis via Docker (optional — skip if you have Redis running locally)
docker-compose up -d

# Restore dependencies
dotnet restore

# Apply database migrations
dotnet ef database update --project ReState

# Run the API (default port 5175)
dotnet run --project ReState
```

Swagger UI is available at `http://localhost:5175/swagger` in development.

---

### Mobile App

```bash
cd React_Native_R.estate

npm install

# Create local environment file
echo "EXPO_PUBLIC_API_URL=http://<your-local-ip>:5175" > .env

# Start Expo dev server
npm start

# Platform-specific runners
npm run android
npm run ios
npm run web
```

> **Note:** Use your machine's LAN IP (not `localhost`) in `EXPO_PUBLIC_API_URL` so the device or emulator can reach the API.

---

### Admin Dashboard

```bash
cd admin-dashboard

npm install

# Start Vite dev server (port 5173)
npm run dev

# Production build
npm run build
```

---

## Environment Variables

### Backend — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Database=...;Username=...;Password=..."
  },
  "AppSettings": {
    "Token": "<jwt-secret>",
    "Issuer": "<issuer>",
    "Audience": "<audience>"
  },
  "Google": {
    "ClientId": "<client-id>",
    "ClientSecret": "<client-secret>"
  },
  "Cloudinary": {
    "CloudName": "...",
    "ApiKey": "...",
    "ApiSecret": "..."
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "Port": 587,
    "Username": "...",
    "Password": "..."
  }
}
```

### Mobile App — `.env`

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5175
```

---

## API Reference

The API exposes 16 controllers under the base URL `http://localhost:5175/api`:

| Controller | Prefix | Responsibilities |
|---|---|---|
| `AuthController` | `/auth` | Register, login, refresh, Google SSO, 2FA |
| `PropertiesController` | `/properties` | Listings CRUD, search, filters |
| `BlogController` | `/blog` | Articles, categories, tags |
| `ChatController` | `/chat` | Conversations and messages |
| `CommunityController` | `/community` | Posts, comments, likes |
| `ReviewsController` | `/reviews` | Property and user reviews |
| `NotificationsController` | `/notifications` | Push notification dispatch |
| `LocalServicesController` | `/localservices` | Service directory |
| `MarketAnalysisController` | `/marketanalysis` | Price trends |
| `NewsController` | `/news` | RSS-aggregated news |
| `LikedPropertiesController` | `/likedproperties` | Favorites |
| `ReportsController` | `/reports` | User reports |
| `SupportController` | `/support` | Support tickets |
| `FeedbackController` | `/feedback` | User feedback |
| `TestimonialsController` | `/testimonials` | Service testimonials |
| `TwoFactorController` | `/2fa` | 2FA enrollment and verification |

Full interactive documentation available at `/swagger` when running in development.

---

## Security

| Mechanism | Implementation |
|---|---|
| Authentication | JWT Bearer tokens with refresh token rotation |
| Social Login | Google OAuth 2.0 via Expo Auth Session |
| 2FA | TOTP (Time-based One-Time Password) |
| Authorization | Role-based (`[Authorize(Roles = "Admin,...")]`) |
| Rate Limiting | IP-based, configurable per endpoint |
| Password Storage | Hashed (BCrypt via ASP.NET Core Identity) |
| CORS | Configured per environment |
| Input Validation | Data annotations + model validation filters |
| Content Moderation | Admin report queue and user ban system |

---

## Performance

### API
- **Redis distributed cache** — city data (5 min TTL), home feed (60 s TTL)
- **Response compression** — Brotli (primary) + Gzip (fallback)
- **Kestrel tuning** — 1 000 concurrent connection limit
- **Rate limiting** — protects against traffic spikes and abuse

### Mobile
- **React Query + MMKV** — persistent server state cache, survives app restart
- **FlashList** — virtualized lists replace FlatList for large datasets
- **Debounced search** — reduces API calls during user input
- **Component memoization** — selective `React.memo` and `useMemo`

---

## Internationalization

The platform ships with full **English (EN)** and **Albanian (SQ)** support across all three surfaces:

- **API** — error messages and email templates
- **Mobile App** — all UI strings via `i18next` + `react-i18next`
- **Admin Dashboard** — all UI strings via `i18next`

Language files live in:
- `React_Native_R.estate/locales/`
- `admin-dashboard/src/i18n/`

---

## License

This project is proprietary. All rights reserved.
