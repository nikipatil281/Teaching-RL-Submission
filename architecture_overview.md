# Architecture & Refactoring Documentation

This document provides a comprehensive overview of the architectural changes made to the **Teaching RL Front-End** project. The project has been transitioned from a basic prototype into a professional, modular, and deployable codebase based on **Clean Architecture** principles.

## Architectural Layers

The codebase is organized into layers to separate business logic, application state, and UI.

### 1. Domain Layer (`src/domain`)
**Responsibility**: Core business rules and logic. It is independent of the UI or any external services.
- **Constants (`/constants/marketConstants.js`)**: All hardcoded business values (pricing limits, inventory targets, wastage costs) are centralized here.
- **Services (`/services/`)**:
    - `MarketService.js`: A static class capturing the "Market Engine" logic. It calculates demand, sales, profits, and penalties.
    - `PriceSuggestionService.js`: Handles the parsing and lookup of ML-suggested prices for the user.

### 2. Infrastructure Layer (`src/infrastructure`)
**Responsibility**: External integrations and data persistence.
- **Models (`/models/PriceSuggestionRepository.js`)**: Handles communication with external assets, specifically fetching the `valid_state_price_suggestions.csv` file.

### 3. Application Layer (`src/application`)
**Responsibility**: Orchestrates the interaction between the Domain and Presentation layers.
- **Context (`/context/GameContext.jsx`)**: Implements the **State Manager** pattern using React Context API. It holds the global state (current phase, user details etc.) and utility functions (restart game, join session).

### 4. Presentation Layer (`src/presentation`)
**Responsibility**: UI Components and Styling.
- **Pages (`/pages/`)**: Top-level components that represent a full screen (e.g., `Dashboard`, `Tutorial`, `Login`).
- **Components (`/components/`)**: Reusable UI molecules and organisms (e.g., `CafeMap`, `ProfitChart`, `Modals`).
- **Theme (`/theme/`)**: Global CSS and theme configuration.


## Key Refactoring Tasks Completed

### 1. Centralized State Management
- **Previous**: State was scattered across `App.jsx` and `Dashboard.jsx`, leading to complex "prop-drilling".
- **New**: `GameContext` now provides a single source of truth. Any component can access the game's state using the `useGame()` hook.

### 2. Class-Based Services
- **Previous**: Procedures were defined in flat files like `MarketEngine.js`.
- **New**: Logic is encapsulated in static classes (`MarketService`). This improves readability and makes the code modular for future server-side porting if needed.

### 3. Separation of Pages and Components
- **Previous**: All components were in a single flat directory.
- **New**: Divided into `pages/` (smart components) and `components/` (view components), making the project structure predictable for professional teams.

### 4. Dependency Cleanup
- All legacy logic files were removed or refactored.
- Relative imports were standardized across all modules to use the new directory structure.



