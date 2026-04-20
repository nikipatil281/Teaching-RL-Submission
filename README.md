# TeachingRL — Learn Reinforcement Learning Through a Coffee Shop

---

## What is this?

**TeachingRL** is an interactive, browser-based simulation designed to teach the core concepts of **Reinforcement Learning (RL)** through a fun and tangible metaphor — running your own coffee shop.

Instead of reading theory, you *experience* it. You set the price of coffee each day, watch the market react, face competitors, unpredictable weather, and local events — and slowly build the intuition behind why RL agents learn the way they do.

---

## How it works

The app is structured into two phases:

### Phase 1 — Training Mode (Tutorial)
A guided 7-day trading week where you run your coffee shop solo. Each day introduces a new RL concept through actual gameplay:

| Day | Concept Introduced |
|-----|--------------------|
| 1   | State, Agent & Action |
| 2   | Environment |
| 3   | Sequential Learning |
| 4   | Reward |
| 5   | Exploration |
| 6   | Penalty |
| 7   | Exploration vs Exploitation |

At the end of the week, you get a **Weekly Report** with a pricing policy summary showing how your decisions compared across different market conditions.

### Phase 2 — Main Simulation (28 Days)
Now you play alongside two AI agents — an **ML Agent** (pattern-based predictor) and an **RL Agent** (Q-learning) — experiencing the same market conditions you do. At the end of each week, you review a performance report comparing your profit, sales, and pricing policy against the agents.

You can also customise the simulation by toggling which market variables are active (Weather, Local Events, Competitor).

---

## Key Concepts Demonstrated

- **State / Action / Reward** — the core RL loop, made tangible
- **Exploration vs Exploitation** — when to try new prices vs. rely on what worked
- **Sequential Decision Making** — how today's inventory affects tomorrow's options
- **Penalties** — sell-out (emergency restock) and overstock (disposal fee) consequences
- **Policy Review** — compare your pricing strategy against the RL agent's optimal range

---

## Tech Stack

- **React** (Vite)
- **Framer Motion** — animations & transitions
- **Tailwind CSS** — styling
- **Lucide React** — icons
- **Bundled browser inference** — trained ML and RL models run directly in the frontend
- **Deployed on Vercel**

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open the local Vite URL shown in the terminal.

This version is frontend-only at runtime:

- No Python server is required
- No ML or RL API needs to be started
- ML and RL price suggestions are read from `public/valid_state_price_suggestions.csv`

## Production Build

```bash
npm run build
npm run preview
```

## Project Structure

The project follows **Clean Architecture** principles to separate business logic from the UI.

```
src/
├── domain/            # Core business logic (Market Service, Constants)
├── infrastructure/    # External data handling (CSV Data Sources)
├── application/       # State management (Context API, Hooks)
├── presentation/      # UI Layer (Pages, Components, Theme)
│   ├── pages/         # High-level screens (Dashboard, Tutorial, Login)
│   └── components/    # Reusable UI molecules
├── generated/         # Automated asset manifests
└── App.jsx            # Multi-phase router
```

---

*Built as an educational tool to make Reinforcement Learning approachable and intuitive — no maths degree required.*
