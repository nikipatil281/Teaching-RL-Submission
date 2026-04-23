import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Coffee,
  DollarSign,
  Info,
  Moon,
  Package,
  Play,
  Store,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';

const TOUR_CALLOUTS = {
  dashboard: {
    tone: 'ink',
    text: 'This is the dashboard you will use during orientation and the 21-day challenge.',
  },
  progress: {
    tone: 'green',
    text: "Track simulation progress and days remaining.",
  },
  today: {
    tone: 'gold',
    text: "Review market conditions before setting your price.",
  },
  market: {
    tone: 'cyan',
    text: 'This is the live market viewport. You will see the coffee shop come alive during the simulation.',
  },
  ledger: {
    tone: 'coral',
    text: 'Track financial performance and market history.',
  },
  advisor: {
    tone: 'purple',
    text: 'Machine Learning algorithm price recommendation.',
  },
  price: {
    tone: 'orange',
    text: 'Set the price for the day here. Adjust the slider or type a value.',
  },
  memory: {
    tone: 'blue',
    text: 'View pricing hints from similar past states',
  },
  insight: {
    tone: 'blue',
    text: 'Daily debrief: Review performance metrics and key takeaways from your decisions.',
  },
};

const TOUR_STEPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    highlightIds: ['dashboard'],
    calloutIds: ['dashboard'],
  },
  {
    id: 'progress',
    label: 'Progress',
    highlightIds: ['progress'],
    calloutIds: ['progress'],
  },
  {
    id: 'today',
    label: "Today's State",
    highlightIds: ['today'],
    calloutIds: ['today'],
  },
  {
    id: 'market',
    label: 'Market Scene',
    highlightIds: ['market'],
    calloutIds: ['market'],
  },
  {
    id: 'ledger',
    label: 'Graph & History',
    highlightIds: ['ledger'],
    calloutIds: ['ledger'],
  },
  {
    id: 'advisor',
    label: 'ML Suggestion',
    highlightIds: ['advisor'],
    calloutIds: ['advisor'],
  },
  {
    id: 'price',
    label: 'Price Choice',
    highlightIds: ['price'],
    calloutIds: ['price'],
  },
  {
    id: 'memory',
    label: 'Memory Hint',
    highlightIds: ['memory'],
    calloutIds: ['memory'],
  },
  {
    id: 'insight',
    label: '',
    highlightIds: ['insight'],
    calloutIds: ['insight'],
  },
];

const historyRows = [
  Array(10).fill('-'),
  Array(10).fill('-'),
  Array(10).fill('-'),
  Array(10).fill('-'),
  Array(10).fill('-'),
  Array(10).fill('-'),
];

const Phase1Instructions = ({ onComplete, theme, toggleTheme }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const goPrevious = () => {
    setCurrentStepIndex((step) => Math.max(0, step - 1));
  };

  const goNext = () => {
    setCurrentStepIndex((step) => Math.min(TOUR_STEPS.length - 1, step + 1));
  };

  return (
    <div className={`tour-page h-screen bg-coffee-900 text-coffee-100 ${theme}`}>
      <style>{tourStyles}</style>

      <div className="tour-bg-doodles" aria-hidden="true" />

      <button
        type="button"
        onClick={toggleTheme}
        className="tour-theme-toggle"
        aria-label="Toggle theme"
      >
        {theme === 'theme-latte' ? <Moon size={18} /> : <Sun size={18} />}
        <span>{theme === 'theme-latte' ? 'Black Coffee' : 'Latte'}</span>
      </button>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="tour-shell"
      >
        <div className="tour-heading">
          <p className="tour-kicker">Dashboard Tour</p>
          <h1>Let's walk through the simulation dashboard!</h1>
        </div>

        <section
          className="tour-canvas"
          aria-label={`Tour step: ${currentStep.label}`}
        >
          <TourDashboardMock theme={theme} currentStepId={currentStep.id} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="tour-overlay"
            >
              {currentStep.calloutIds.map((id) => (
                <TourCallout key={id} id={id} callout={TOUR_CALLOUTS[id]} />
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="tour-controls">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isFirstStep}
            className="tour-nav-button"
            aria-label="Previous tour step"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="tour-step-meta">
            <span>Step {currentStepIndex + 1} / {TOUR_STEPS.length}</span>
            {isLastStep && (
              <button type="button" onClick={onComplete} className="tour-start-button">
                <Play size={14} fill="currentColor" />
                Start Orientation
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={isLastStep}
            className="tour-nav-button"
            aria-label="Next tour step"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.main>
    </div>
  );
};

const TourCallout = ({ id, callout }) => (
  <div className={`tour-callout tour-callout--${id} tour-tone-${callout.tone}`}>
    <p>{callout.text}</p>
  </div>
);

const TourDashboardMock = ({ theme, currentStepId }) => {
  const isLight = theme === 'theme-latte';
  const getFocusClass = (id) => {
    const tone = TOUR_CALLOUTS[id]?.tone || 'ink';
    const isActive = currentStepId === id;
    const keepParentReadable = id === 'price' && currentStepId === 'memory';
    const isMuted = currentStepId !== 'dashboard' && !isActive && !keepParentReadable;

    return `tour-focus tour-focus-tone-${tone} ${isActive ? 'is-active' : ''} ${isMuted ? 'is-muted' : ''}`;
  };

  return (
    <div className={`tour-dashboard ${currentStepId === 'dashboard' ? 'tour-focus tour-focus-tone-ink is-active' : ''}`}>
      <div className={`tour-dashboard-header ${currentStepId === 'dashboard' ? '' : 'is-muted'}`}>
        <div className="tour-dashboard-title">
          <Coffee size={18} />
          <strong>Phase 1: Orientation Phase</strong>
          <span>Learn how the market reacts to your prices. Maximise your <b>Rewards</b> and avoid <i>Penalties</i>.</span>
        </div>
        <div className="tour-theme-pill">
          {isLight ? <Moon size={13} /> : <Sun size={13} />}
          {isLight ? 'Dark Mode' : 'Latte'}
        </div>
      </div>

      <div className={`tour-state-panel ${getFocusClass('today')}`}>
        <div className="tour-section-label">
          <CalendarDays size={15} />
          Today's State
        </div>
        <div className="tour-state-grid">
          <StateTile label="Day and Weather" value="Sunday" icon={<CloudRain size={24} />} badge="Rainy" />
          <StateTile
            label="Inventory"
            value="606"
            unit="cups"
            icon={<Package size={25} />}
          />
          <StateTile label="Competition" value="Competitor Alert" icon={<Users size={24} />} badge="Competitor electricity out." danger />
          <StateTile label="Local Events" value="Quiet Street" icon={<Info size={24} />} badge="Normal traffic levels" />
        </div>
      </div>

      <div className="tour-main-grid">
        <div className={`tour-ledger ${getFocusClass('ledger')}`}>
          <div className="tour-ledger-head">
            <div>
              <h2>Daily Ledger & Market Data</h2>
              <p>Hover over the header icons to see the full column titles.</p>
            </div>
            <div className="tour-tabs">
              <span>Overview</span>
              <span>Rewards</span>
              <b>History</b>
            </div>
          </div>
          <div className="tour-ledger-icons">
            <CalendarDays size={15} />
            <CloudRain size={15} />
            <DollarSign size={15} />
            <Store size={15} />
            <Package size={15} />
            <Coffee size={15} />
            <DollarSign size={15} />
            <BarChart3 size={15} />
            <Info size={15} />
            <CheckCircle size={15} />
          </div>
          <div className="tour-ledger-table">
            {historyRows.map((row, rowIndex) => (
              <div className="tour-ledger-row" key={`history-row-${rowIndex}`}>
                {row.map((cell, index) => (
                  <span key={`history-cell-${rowIndex}-${index}`} className={cell === 'ok' ? 'tour-ok' : cell === 'x' ? 'tour-bad' : ''}>
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="tour-right-stack">
          <div className={`tour-market-scene ${getFocusClass('market')}`} aria-label="Market animation preview">
            <img src="/animation_screenshot.webp" alt="Market animation preview" />
          </div>

          <div className="tour-decision-grid">
            <div className={`tour-advisor-card ${getFocusClass('advisor')}`}>
              <div className="tour-advisor-top">
                <span><TrendingUp size={16} /></span>
                <b>ML</b>
              </div>
              <strong>ML Suggestion</strong>
              <small>Advisor price for this state.</small>
              <em>$5.00</em>
            </div>

            <div className={`tour-price-panel ${getFocusClass('price')} ${currentStepId === 'memory' ? 'is-memory-parent' : ''}`}>
              <div className="tour-price-row">
                <span>Set Price For The Day:</span>
                <div className="tour-slider"><b /></div>
                <strong>$ 1</strong>
              </div>
              <div className={`tour-memory-box ${getFocusClass('memory')}`}>
                <b>If you want to try exploiting...</b>
                <span>On a previous Sunday, a similar state gave a profit of $0 and reward of 0 Pts at the price per cup of $1.00</span>
              </div>
              <button type="button">
                <Play size={13} fill="currentColor" />
                Action: Set price for today
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentStepId === 'insight' && (
        <div className={`tour-insight-popup ${getFocusClass('insight')}`}>
          <Info size={20} />
          <strong>Daily insight pop-up</strong>
          <span>Sales, profit, reward, penalty, and decision feedback appear after each day.</span>
        </div>
      )}

      <div className={`tour-progress-rail ${getFocusClass('progress')}`}>
        <strong>Day<br /><span>7</span></strong>
        {Array.from({ length: 21 }, (_, index) => (
          <span key={index} className={index === 6 ? 'is-current' : index < 6 ? 'is-done' : ''}>
            {index < 6 ? <CheckCircle size={9} /> : index + 1}
          </span>
        ))}
      </div>
    </div>
  );
};

const StateTile = ({ label, value, unit, icon, badge = null, sideContent = null, danger = false }) => (
  <div className={`tour-state-tile ${danger ? 'is-danger' : ''}`}>
    <div className="tour-state-copy">
      <span>{label}</span>
      <strong>{value} {unit && <small>{unit}</small>}</strong>
      <em>{badge}</em>
    </div>
    <div className="tour-state-side">
      {icon}
      {sideContent}
    </div>
  </div>
);

const tourStyles = `
  .tour-page {
    --tour-bg: rgb(var(--color-coffee-900));
    --tour-text: rgb(var(--color-coffee-100));
    --tour-muted: rgb(var(--color-coffee-300));
    --tour-soft: rgb(var(--color-coffee-800));
    --tour-panel: rgba(var(--color-coffee-800), 0.74);
    --tour-panel-strong: rgba(var(--color-coffee-950), 0.82);
    --tour-border: rgba(var(--color-coffee-600), 0.7);
    --tour-shadow: rgba(0, 0, 0, 0.32);
    --tone-ink: #f5e6d3;
    --tone-green: #8bd48f;
    --tone-gold: #f7d56c;
    --tone-cyan: #67d7e8;
    --tone-coral: #ff9a9a;
    --tone-orange: #f4a64f;
    --tone-blue: #8bb9ff;
    --tone-purple: #b69cff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    overflow: hidden;
    color: var(--tour-text);
    background:
      radial-gradient(circle at 14% 14%, rgba(245, 158, 11, 0.18), transparent 28%),
      radial-gradient(circle at 82% 76%, rgba(20, 184, 166, 0.12), transparent 30%),
      var(--tour-bg);
  }

  .theme-latte.tour-page {
    --tour-shadow: rgba(120, 53, 15, 0.16);
    --tone-ink: #2d241e;
    --tone-green: #2f7d36;
    --tone-gold: #a36b11;
    --tone-cyan: #277f8e;
    --tone-coral: #bc4a4a;
    --tone-orange: #b96d20;
    --tone-blue: #315fa8;
    --tone-purple: #7257bf;
  }

  .tour-bg-doodles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      radial-gradient(circle at 8% 18%, rgba(245, 158, 11, 0.12) 0 2px, transparent 3px),
      radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.08) 0 2px, transparent 3px),
      radial-gradient(circle at 70% 16%, rgba(245, 158, 11, 0.11) 0 2px, transparent 3px),
      radial-gradient(circle at 86% 68%, rgba(255, 255, 255, 0.08) 0 2px, transparent 3px);
    background-size: 140px 140px;
    opacity: 0.65;
  }

  .theme-latte .tour-bg-doodles {
    opacity: 0.42;
  }

  .tour-shell {
    position: relative;
    z-index: 1;
    width: min(1600px, 100%);
    height: min(900px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .tour-theme-toggle {
    position: absolute;
    top: 22px;
    right: 24px;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 8px 13px;
    border: 1px solid var(--tour-border);
    border-radius: 8px;
    color: var(--tour-text);
    background: var(--tour-panel-strong);
    box-shadow: 0 12px 30px var(--tour-shadow);
    font-size: 12px;
    font-weight: 800;
    transition: transform 160ms ease, border-color 160ms ease;
  }

  .tour-theme-toggle:hover {
    transform: translateY(-1px);
    border-color: rgba(245, 158, 11, 0.75);
  }

  .tour-heading {
    text-align: center;
    max-width: 880px;
    flex: 0 0 auto;
  }

  .tour-kicker {
    margin: 0 0 4px;
    color: #f59e0b;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .tour-heading h1 {
    margin: 0;
    color: var(--tour-text);
    font-size: 32px;
    line-height: 1.05;
    font-weight: 900;
  }

  .tour-heading p:last-child {
    margin: 8px 0 0;
    color: var(--tour-muted);
    font-size: 15px;
    font-weight: 600;
  }

  .tour-canvas {
    position: relative;
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    border: 1px solid var(--tour-border);
    border-radius: 8px;
    background: rgba(var(--color-coffee-950), 0.36);
    box-shadow: 0 22px 70px var(--tour-shadow);
    overflow: hidden;
  }

  .tour-dashboard {
    position: absolute;
    left: 16%;
    right: 16%;
    top: 2%;
    bottom: 9%;
    display: grid;
    grid-template-rows: 52px 132px minmax(0, 1fr);
    gap: 12px;
    padding: 12px 70px 12px 12px;
    border: 2px solid rgba(var(--color-coffee-500), 0.72);
    border-radius: 8px;
    color: var(--tour-text);
    font-size: 12px;
    background:
      linear-gradient(180deg, rgba(var(--color-coffee-950), 0.72), rgba(var(--color-coffee-900), 0.78)),
      repeating-linear-gradient(135deg, rgba(var(--color-coffee-500), 0.08) 0 1px, transparent 1px 46px);
  }

  .theme-latte .tour-dashboard {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(253, 248, 245, 0.88)),
      repeating-linear-gradient(135deg, rgba(146, 64, 14, 0.08) 0 1px, transparent 1px 46px);
  }

  .tour-dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 0 12px;
    border-left: 4px solid #f59e0b;
    border-radius: 8px;
    background: rgba(var(--color-coffee-800), 0.42);
    transition: opacity 180ms ease, filter 180ms ease;
  }

  .tour-dashboard-header.is-muted {
    opacity: 0.28;
    filter: saturate(0.62);
  }

  .tour-dashboard-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .tour-dashboard-title strong {
    font-size: 14px;
    white-space: nowrap;
  }

  .tour-dashboard-title span {
    color: var(--tour-muted);
    font-size: 10px;
    font-weight: 700;
  }

  .tour-dashboard-title b {
    color: #34d399;
  }

  .tour-dashboard-title i {
    color: #f87171;
    font-style: normal;
  }

  .tour-theme-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 92px;
    justify-content: center;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid var(--tour-border);
    background: rgba(var(--color-coffee-950), 0.45);
    font-size: 10px;
    font-weight: 900;
  }

  .theme-latte .tour-theme-pill {
    background: rgba(255, 255, 255, 0.72);
  }

  .tour-state-panel {
    padding: 12px;
    border: 1px solid var(--tour-border);
    border-radius: 8px;
    background: rgba(var(--color-coffee-800), 0.58);
  }

  .tour-section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--tour-muted);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .tour-state-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.18fr) minmax(0, 0.92fr) minmax(0, 0.98fr);
    gap: 12px;
  }

  .tour-state-tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    min-height: 70px;
    padding: 12px;
    border: 1px solid rgba(var(--color-coffee-700), 0.58);
    border-radius: 8px;
    background: rgba(var(--color-coffee-950), 0.24);
  }

  .tour-state-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .tour-state-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .theme-latte .tour-state-tile {
    background: rgba(255, 255, 255, 0.45);
  }

  .tour-state-tile.is-danger {
    border-color: rgba(248, 113, 113, 0.68);
    color: #f87171;
  }

  .tour-state-tile span,
  .tour-state-tile em {
    display: block;
    color: var(--tour-muted);
    font-size: 8px;
    font-style: normal;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .tour-state-tile em {
    font-size: 9px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
    text-transform: none;
  }

  .tour-inventory-week-badge {
    width: 90px;
    padding: 7px 6px;
    border: 1px solid rgba(var(--color-coffee-600), 0.7);
    border-radius: 8px;
    background: rgba(var(--color-coffee-950), 0.55);
    text-align: center;
    box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.18);
  }

  .tour-inventory-week-badge strong {
    display: block;
    margin: 0;
    color: #fbbf24;
    font-size: 18px;
    line-height: 1;
    white-space: normal;
  }

  .tour-inventory-week-badge span,
  .tour-inventory-week-badge small {
    display: block;
    margin-top: 3px;
    color: var(--tour-muted);
    font-size: 8px;
    line-height: 1.2;
    font-weight: 800;
    text-transform: none;
  }

  .tour-state-tile strong {
    display: block;
    margin: 5px 0 3px;
    font-size: 14px;
    line-height: 1;
    white-space: nowrap;
  }

  .tour-state-tile small {
    color: var(--tour-muted);
    font-size: 9px;
  }

  .tour-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 0.9fr);
    gap: 14px;
    min-height: 0;
  }

  .tour-ledger,
  .tour-market-scene,
  .tour-advisor-card,
  .tour-price-panel,
  .tour-insight-popup {
    min-width: 0;
    border: 1px solid var(--tour-border);
    border-radius: 8px;
    background: rgba(var(--color-coffee-800), 0.58);
    overflow: hidden;
  }

  .tour-ledger {
    padding: 16px;
  }

  .tour-focus {
    --tour-focus-color: var(--tone-ink);
    transition: opacity 180ms ease, filter 180ms ease, border-color 180ms ease, outline-color 180ms ease, box-shadow 180ms ease;
  }

  .tour-focus.is-muted {
    opacity: 0.28;
    filter: saturate(0.62);
  }

  .tour-focus.is-active {
    opacity: 1;
    filter: none;
    border-color: var(--tour-focus-color);
    outline: 2px solid var(--tour-focus-color);
    outline-offset: 3px;
    box-shadow: 0 0 18px rgba(245, 230, 211, 0.18);
  }

  .tour-focus-tone-ink { --tour-focus-color: var(--tone-ink); }
  .tour-focus-tone-green { --tour-focus-color: var(--tone-green); }
  .tour-focus-tone-gold { --tour-focus-color: var(--tone-gold); }
  .tour-focus-tone-cyan { --tour-focus-color: var(--tone-cyan); }
  .tour-focus-tone-coral { --tour-focus-color: var(--tone-coral); }
  .tour-focus-tone-orange { --tour-focus-color: var(--tone-orange); }
  .tour-focus-tone-blue { --tour-focus-color: var(--tone-blue); }
  .tour-focus-tone-purple { --tour-focus-color: var(--tone-purple); }

  .tour-right-stack {
    display: grid;
    grid-template-rows: minmax(0, 1fr) 146px;
    gap: 14px;
    min-height: 0;
  }

  .tour-decision-grid {
    display: grid;
    grid-template-columns: minmax(128px, 0.42fr) minmax(0, 1fr);
    gap: 12px;
    min-height: 0;
  }

  .tour-ledger-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .tour-ledger h2 {
    margin: 0;
    font-size: 15px;
    line-height: 1.1;
  }

  .tour-ledger p {
    margin: 4px 0 0;
    color: var(--tour-muted);
    font-size: 9px;
    font-weight: 700;
  }

  .tour-tabs {
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: 4px;
    padding: 3px;
    border-radius: 8px;
    background: rgba(var(--color-coffee-950), 0.28);
  }

  .tour-tabs span,
  .tour-tabs b {
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 8px;
    font-weight: 900;
  }

  .tour-tabs b {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.18);
  }

  .tour-ledger-icons,
  .tour-ledger-row {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    align-items: center;
    gap: 5px;
    text-align: center;
  }

  .tour-ledger-icons {
    padding: 9px 8px;
    border-bottom: 1px solid var(--tour-border);
    color: #fbbf24;
    font-size: 9px;
    font-weight: 900;
  }

  .tour-ledger-row {
    min-height: 26px;
    border-bottom: 1px solid rgba(var(--color-coffee-700), 0.26);
    color: var(--tour-muted);
    font-size: 9px;
    font-weight: 900;
  }

  .tour-ok {
    color: #34d399;
  }

  .tour-bad {
    color: #f87171;
  }

  .tour-market-scene {
    position: relative;
    border-style: dashed;
    background: rgba(var(--color-coffee-950), 0.28);
  }

  .tour-market-scene img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .tour-advisor-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 7px;
    padding: 12px;
    border-color: rgba(245, 158, 11, 0.45);
    background: rgba(var(--color-coffee-800), 0.76);
  }

  .tour-advisor-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tour-advisor-top span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid rgba(245, 158, 11, 0.38);
    border-radius: 8px;
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.16);
  }

  .tour-advisor-top b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    color: #7c2d12;
    background: #fcd34d;
    font-size: 13px;
  }

  .tour-advisor-card strong {
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .tour-advisor-card small {
    color: var(--tour-muted);
    font-size: 8px;
    font-weight: 800;
    line-height: 1.2;
  }

  .tour-advisor-card em {
    color: #fef3c7;
    font-size: 22px;
    font-style: normal;
    font-weight: 900;
    line-height: 1;
  }

  .tour-price-panel {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 12px;
    border-color: rgba(245, 158, 11, 0.55);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(var(--color-coffee-800), 0.72));
  }

  .tour-price-row {
    display: grid;
    grid-template-columns: minmax(96px, auto) minmax(0, 1fr) 58px;
    align-items: center;
    gap: 12px;
  }

  .tour-price-row span,
  .tour-price-row strong {
    padding: 6px 8px;
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: 6px;
    background: rgba(var(--color-coffee-950), 0.32);
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .tour-price-row span {
    line-height: 1.1;
  }

  .tour-slider {
    height: 7px;
    border-radius: 999px;
    background: rgba(var(--color-coffee-950), 0.72);
  }

  .tour-slider b {
    display: block;
    width: 18px;
    height: 18px;
    margin-top: -5px;
    border-radius: 50%;
    background: #fbbf24;
  }

  .tour-memory-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 9px;
    border: 1px solid rgba(96, 165, 250, 0.42);
    border-radius: 6px;
    color: #bfdbfe;
    background: rgba(30, 64, 175, 0.22);
    font-size: 7px;
    line-height: 1.25;
  }

  .theme-latte .tour-memory-box {
    color: #1e3a8a;
    background: rgba(191, 219, 254, 0.72);
  }

  .tour-price-panel.is-memory-parent > :not(.tour-memory-box) {
    opacity: 0.28;
    filter: saturate(0.62);
    transition: opacity 180ms ease, filter 180ms ease;
  }

  .tour-price-panel button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 28px;
    border: 0;
    border-radius: 8px;
    color: white;
    background: linear-gradient(90deg, #d97706, #f97316);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .tour-insight-popup {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 360px;
    min-height: 154px;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: var(--tour-muted);
    border-color: rgba(96, 165, 250, 0.62);
    background: rgba(var(--color-coffee-950), 0.9);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.34);
    z-index: 2;
  }

  .tour-insight-popup strong {
    font-size: 12px;
    text-transform: uppercase;
  }

  .tour-insight-popup span {
    max-width: 280px;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
  }

  .tour-progress-rail {
    position: absolute;
    top: 78px;
    right: 12px;
    bottom: 12px;
    width: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 5px;
    border: 1px solid var(--tour-border);
    border-radius: 999px;
    background: rgba(var(--color-coffee-950), 0.36);
  }

  .tour-progress-rail strong {
    color: var(--tour-muted);
    text-align: center;
    font-size: 9px;
    line-height: 1.1;
    text-transform: uppercase;
  }

  .tour-progress-rail strong span {
    color: #60a5fa;
    font-size: 15px;
  }

  .tour-progress-rail > span {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(var(--color-coffee-500), 0.5);
    border-radius: 50%;
    color: var(--tour-muted);
    background: rgba(var(--color-coffee-900), 0.62);
    font-size: 7px;
    font-weight: 900;
  }

  .tour-progress-rail .is-done {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.68);
  }

  .tour-progress-rail .is-current {
    color: #60a5fa;
    border-color: #60a5fa;
    transform: scale(1.12);
  }

  .tour-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .tour-highlight {
    position: absolute;
    border: 3px solid currentColor;
    border-radius: 8px;
    box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.34), 0 0 22px currentColor;
    background: rgba(255,255,255,0.03);
  }

  .theme-latte .tour-highlight {
    box-shadow: 0 0 0 999px rgba(255, 255, 255, 0.58), 0 0 18px currentColor;
  }

  .tour-canvas--all .tour-highlight {
    box-shadow: 0 0 14px currentColor;
    background: transparent;
  }

  .tour-tone-border-ink { color: var(--tone-ink); }
  .tour-tone-border-green { color: var(--tone-green); }
  .tour-tone-border-gold { color: var(--tone-gold); }
  .tour-tone-border-cyan { color: var(--tone-cyan); }
  .tour-tone-border-coral { color: var(--tone-coral); }
  .tour-tone-border-orange { color: var(--tone-orange); }
  .tour-tone-border-blue { color: var(--tone-blue); }
  .tour-tone-border-purple { color: var(--tone-purple); }

  .tour-highlight--dashboard {
    left: 16%;
    right: 16%;
    top: 9%;
    bottom: 9%;
  }

  .tour-highlight--today {
    left: 16.8%;
    right: 19.8%;
    top: 18.5%;
    height: 14.5%;
  }

  .tour-highlight--ledger {
    left: 16.8%;
    top: 35%;
    width: 30.4%;
    height: 53.6%;
  }

  .tour-highlight--market {
    left: 48.3%;
    top: 35%;
    width: 31.8%;
    height: 36.5%;
  }

  .tour-highlight--advisor {
    left: 48.3%;
    bottom: 10.4%;
    width: 10.2%;
    height: 18%;
  }

  .tour-highlight--price {
    left: 59.4%;
    bottom: 10.4%;
    width: 20.7%;
    height: 18%;
  }

  .tour-highlight--memory {
    left: 60%;
    bottom: 18.1%;
    width: 19.5%;
    height: 5.7%;
  }

  .tour-highlight--insight {
    left: 38.8%;
    top: 38%;
    width: 22.4%;
    height: 24%;
  }

  .tour-highlight--progress {
    right: 16.8%;
    top: 18.5%;
    width: 3.4%;
    height: 72%;
    border-radius: 999px;
  }

  .tour-callout {
    position: absolute;
    width: 244px;
    color: currentColor;
    font-family: "Comic Sans MS", "Marker Felt", "Bradley Hand", cursive;
    font-size: 30px;
    line-height: 1.38;
    font-weight: 700;
  }

  .tour-callout p {
    margin: 0;
  }

  .tour-callout-line {
    position: absolute;
    display: block;
    border-color: currentColor;
  }

  .tour-tone-ink { color: var(--tone-ink); }
  .tour-tone-green { color: var(--tone-green); }
  .tour-tone-gold { color: var(--tone-gold); }
  .tour-tone-cyan { color: var(--tone-cyan); }
  .tour-tone-coral { color: var(--tone-coral); }
  .tour-tone-orange { color: var(--tone-orange); }
  .tour-tone-blue { color: var(--tone-blue); }
  .tour-tone-purple { color: var(--tone-purple); }

  .tour-callout--dashboard {
    left: 50%;
    bottom: 2%;
    width: 1000px;
    transform: translateX(-50%);
    text-align: center;
    font-size: 20px;
  }

  .tour-callout--dashboard .tour-callout-line {
    left: 50%;
    bottom: 100%;
    width: 0;
    height: 56px;
    border-left: 4px solid;
    border-radius: 999px;
  }

  .tour-callout--progress {
    right: 1.5%;
    top: 40%;
    width: 220px;
    font-size: 20px;
  }

  .tour-callout--progress .tour-callout-line {
    right: 100%;
    top: 20px;
    width: 100px;
    height: 68px;
    border-top: 4px solid;
    border-left: 4px solid;
    border-radius: 40px 0 0 0;
  }

  .tour-callout--today {
    right: 1%;
    top: 15%;
    width: 230px;
    font-size: 20px;
  }

  .tour-callout--today .tour-callout-line {
    right: 100%;
    top: 42px;
    width: 180px;
    height: 72px;
    border-top: 4px solid;
    border-left: 4px solid;
    border-radius: 60px 0 0 0;
  }

  .tour-callout--market {
    right: 3%;
    top: 38%;
    width: 180px;
    font-size: 20px;
  }

  .tour-callout--market .tour-callout-line {
    right: 100%;
    top: 28px;
    width: 136px;
    border-top: 4px solid;
  }

  .tour-callout--ledger {
    left: 5%;
    top: 45%;
    width: 200px;
    font-size: 20px;
  }

  .tour-callout--ledger .tour-callout-line {
    left: 100%;
    top: 122px;
    width: 128px;
    border-top: 4px solid;
  }

  .tour-callout--advisor {
    right: 25%;
    bottom: 3%;
    width: 500px;
    font-size: 20px;
  }

  .tour-callout--advisor .tour-callout-line {
    right: 100%;
    top: 38px;
    width: 136px;
    border-top: 4px solid;
  }

  .tour-callout--price {
    right: 1.3%;
    bottom: 15%;
    width: 220px;
    font-size: 20px;
  }

  .tour-callout--price .tour-callout-line {
    right: 100%;
    bottom: 54px;
    width: 110px;
    height: 42px;
    border-bottom: 4px solid;
    border-right: 4px solid;
    border-radius: 0 0 36px 0;
  }

  .tour-callout--memory {
    left: 58%;
    bottom: 3%;
    width: 450px;
    font-size: 20px;
  }

  .tour-callout--memory .tour-callout-line {
    left: 58%;
    bottom: 100%;
    width: 0;
    height: 62px;
    border-left: 4px solid;
  }

  .tour-callout--insight {
    left: 63%;
    bottom: 46%;
    width: 230px;
    text-align: center;
    font-size: 20px;
  }

  .tour-callout--insight .tour-callout-line {
    left: 50%;
    bottom: 100%;
    width: 0;
    height: 66px;
    border-left: 4px solid;
  }

  .tour-controls {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 12px;
    flex: 0 0 auto;
    min-height: 46px;
  }

  .tour-nav-button,
  .tour-start-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    border-radius: 8px;
    font-weight: 900;
    transition: transform 160ms ease, opacity 160ms ease, border-color 160ms ease;
  }

  .tour-nav-button {
    width: 34px;
    border: 1px solid var(--tour-border);
    color: var(--tour-text);
    background: var(--tour-panel);
  }

  .tour-nav-button:not(:disabled):hover,
  .tour-start-button:hover {
    transform: translateY(-1px);
    border-color: rgba(245, 158, 11, 0.75);
  }

  .tour-nav-button:disabled {
    cursor: not-allowed;
    opacity: 0.38;
  }

  .tour-step-meta {
    min-width: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding-top: 10px;
    color: var(--tour-muted);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .tour-step-meta strong {
    color: var(--tour-text);
    font-size: 14px;
  }

  .tour-start-button {
    gap: 7px;
    min-height: 38px;
    margin-top: 5px;
    padding: 0 20px;
    border: 1px solid rgba(245, 158, 11, 0.75);
    color: #1c1208;
    background: linear-gradient(90deg, #fbbf24, #f97316);
    box-shadow: 0 14px 32px rgba(245, 158, 11, 0.24);
    text-transform: uppercase;
    letter-spacing: 0;
    font-size: 13px;
  }

  @media (max-width: 1200px) {
    .tour-heading h1 {
      font-size: 26px;
    }

    .tour-dashboard {
      left: 10%;
      right: 10%;
    }

    .tour-highlight--dashboard { left: 10%; right: 10%; }
    .tour-highlight--today { left: 10.8%; right: 14%; }
    .tour-highlight--ledger { left: 10.8%; width: 35.6%; }
    .tour-highlight--market { left: 48.8%; width: 35.8%; }
    .tour-highlight--advisor { left: 48.8%; width: 11.8%; }
    .tour-highlight--price { left: 61.4%; width: 23.2%; }
    .tour-highlight--memory { left: 62%; width: 21.8%; }
    .tour-highlight--insight { left: 35.5%; width: 29%; }
    .tour-highlight--progress { right: 10.8%; width: 3.8%; }

    .tour-callout {
      width: 210px;
      font-size: 15px;
    }

    .tour-callout--dashboard {
      width: 420px;
      font-size: 18px;
    }
  }
`;

export default Phase1Instructions;
