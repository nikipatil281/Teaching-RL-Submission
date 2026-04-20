# Technical Specifications — TeachingRL

This document outlines the technical architecture, dependencies, and requirements for the **TeachingRL (Coffee Shop Simulation)** application.

## 1. Project Overview
**TeachingRL** is a high-performance, browser-based educational simulation designed to teach Reinforcement Learning (RL) concepts. It utilizes React-based frontend inference to run ML and RL models without requiring a dedicated backend server.

## 2. Core Architecture
The application follows the **Clean Architecture** pattern, ensuring high maintainability and separation of concerns.

- **Domain Layer**: Contains core business logic (Market Engine, Pricing Constants).
- **Infrastructure Layer**: Manages external data (CSV-based inference repository).
- **Application Layer**: Manages global state and use cases via React Context API.
- **Presentation Layer**: Optimized UI components built with React and Tailwind CSS.

## 3. Technology Stack
| Component | Technology | Version |
| :--- | :--- | :--- |
| **Framework** | React | 19.x |
| **Build Tool** | Vite | 7.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Animations** | Framer Motion | 12.x |
| **State Management** | React Context API | Native |
| **Icons** | Lucide React | 0.5xx |
| **Charts** | Recharts | 3.7.x |
| **PDF Generation** | jsPDF / html2canvas | 4.x / 1.x |

## 4. Inference Mechanism
The application performs "Front-End Inference":
- **Source**: `public/valid_state_price_suggestions.csv`
- **Method**: The `PriceSuggestionService` parses pre-computed ML/RL state-action pairs into a lookup table.
- **Performance**: High-speed, offline-capable, and results in zero server-side computation.

## 5. Security & Privacy
- **Client-Side Storage**: All game state is volatile (held in memory) or stored in LocalStorage.
- **Authentication**: Current implementation uses a mock login phase for session personalization.
- **External Requests**: None. All logic and assets are bundled in the build.

## 6. Hosting Requirements
- **Server Type**: Any static file server (Nginx, Apache, Vercel, AWS S3, etc.)
- **HTTPS**: Recommended for modern browser features.
- **Resources**: Minimal. The bundled application is approximately < 5MB (excluding assets).
