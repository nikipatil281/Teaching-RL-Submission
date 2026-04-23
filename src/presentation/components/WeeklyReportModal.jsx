import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, AlertCircle, Sun, Moon, TableProperties } from 'lucide-react';
import ProfitChart from './ProfitChart';
import RollingNumber from './RollingNumber';
import { WASTAGE_COST_PER_CUP, WEEKLY_START_INVENTORY } from '../../domain/constants/marketConstants';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const roundInventoryDownToHundred = (value) => Math.floor(value / 100) * 100;
const roundInventoryUpToHundred = (value) => Math.ceil(value / 100) * 100;

const formatInventoryRange = (minInventory, maxInventory) => {
  if (minInventory === null || maxInventory === null) {
    return { label: 'N/A', approximate: false };
  }

  if (minInventory === maxInventory) {
    return {
      label: `${roundInventoryDownToHundred(minInventory)}`,
      approximate: true,
    };
  }

  return {
    label: `${roundInventoryDownToHundred(minInventory)} - ${roundInventoryUpToHundred(maxInventory)}`,
    approximate: false,
  };
};
const WEEKLY_GRAPH_TABS = [
  { id: 'Combined', label: 'Profit' },
  { id: 'Rewards', label: 'Rewards' },
  { id: 'RLRewards', label: 'RL Rewards', tutorialOnly: false },
  { id: 'Secondary', label: 'History' },
];
const WEEKLY_GRAPH_TAB_STYLES = {
  Combined: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm',
  Rewards: 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-sm',
  RLRewards: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-sm',
  Secondary: 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm',
};
const WEEKLY_FOOTER_TEXT = {
  1: "Disclaimer: Even if you follow the ML agent's price exactly, your profit can still differ slightly because the environment is stochastic",
  2: "Hint: Compare similar days to each other instead of comparing every day to the last one.",
  3: "Hint: Sunshine does not always mean the same thing. A bright weekday and a bright weekend may to have very different energy."
};
const TUTORIAL_WEEKLY_FOOTER_TEXT = "This marks the end of the orientation week!";

const WeeklyAgentSummaryCard = ({
  name,
  titleClassName,
  total,
  coffeeEarnings,
  sales,
  penalty,
  inventoryLeft,
  theme,
  accentBlobClassName,
  highlight = false,
}) => (
  <div
    className={`group relative flex min-h-[190px] flex-col overflow-hidden rounded-lg bg-coffee-800 text-left shadow-xl outline-none ${highlight ? 'border-2 border-emerald-500/20' : 'border border-coffee-700/50'}`}
    tabIndex={0}
  >
    <div className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full -mr-8 -mt-8 ${accentBlobClassName}`} />

    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-5 text-center transition-opacity duration-200 group-hover:opacity-0 group-focus-within:opacity-0">
      <div className={`max-w-full truncate text-center text-xl font-black ${titleClassName}`} title={name}>
        {name}
      </div>
      <div className={`mt-6 text-[10px] font-black uppercase tracking-widest ${theme === 'theme-latte' ? 'text-coffee-500' : 'text-coffee-300'}`}>
        Gross Profit
      </div>
      <div className="mt-1 font-mono text-3xl font-black leading-none text-coffee-100">
        <RollingNumber value={total} prefix="$" />
      </div>
      <div className={`mt-3 text-sm font-semibold ${theme === 'theme-latte' ? 'text-coffee-500' : 'text-coffee-300'}`}>
        {sales} cups sold
      </div>
    </div>

    <div className={`absolute inset-0 z-20 flex flex-col justify-center px-5 py-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${theme === 'theme-latte' ? 'bg-red-100 text-red-900' : 'bg-red-950/95 text-red-200'}`}>
      <div className="mb-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Wastage Penalty</span>
      </div>
      <div className={`space-y-2 text-xs font-semibold leading-snug ${theme === 'theme-latte' ? 'text-red-800/90' : 'text-red-300/90'}`}>
        <div>Cups sold this week: <StoryNumber>{sales}</StoryNumber> out of <StoryNumber>{WEEKLY_START_INVENTORY}</StoryNumber></div>
        <div>Revenue (after cost): <StoryNumber>${coffeeEarnings?.toFixed(0) || '0'}</StoryNumber></div>
        <div>So, cups unsold this week: <StoryNumber>{inventoryLeft}</StoryNumber></div>
        <div>Wastage Penalty (${WASTAGE_COST_PER_CUP.toFixed(1)} per unsold cup): <StoryNumber>${penalty?.toFixed(2) || '0.00'}</StoryNumber></div>
        <div>Hence, Gross profit: <StoryNumber>${total.toFixed(0)}</StoryNumber></div>
      </div>
    </div>
  </div>
);

const StoryNumber = ({ children }) => (
  <span className="inline-block px-0.5 align-baseline font-mono text-[13px] font-black leading-none text-red-600 dark:text-red-200">
    {children}
  </span>
);


const WeeklyReportModal = ({ isOpen, weekNumber, data, onContinue, onBackToTutorial, theme, toggleTheme, shopName = "You", isTutorial = false, weekHistoryData = [] }) => {
  const [activeWeeklyChartView, setActiveWeeklyChartView] = useState(null);
  if (!isOpen) return null;

  // data = { playerTotal, mlTotal, rlTotal, playerSales, mlSales, rlSales } for the week
  // User Requested: Don't show the user the RL and competitor prices/reports.

  // 1. Build Policy Map from this week's history
  const policyMap = {};
  weekHistoryData.filter(h => h.day !== 'Start').forEach(record => {
    // Only process days where a player actually played/priced
    if (!record.playerPrice) return;

    const stateKey = `${record.weather}_${record.nearbyEvent}_${record.competitorPresent}`;

    if (!policyMap[stateKey]) {
      policyMap[stateKey] = {
        weather: record.weather,
        event: record.nearbyEvent,
        competitor: record.competitorPresent,
        competitorPrices: [],
        playerPrices: [],
        rlPrices: [],
        dayNames: new Set(),
        startInventories: [],
      };
    }

    policyMap[stateKey].playerPrices.push(record.playerPrice);
    if (!isTutorial && record.rlPrice) {
      policyMap[stateKey].rlPrices.push(record.rlPrice);
    }
    if (record.competitorPresent && Number.isFinite(record.competitorPrice)) {
      policyMap[stateKey].competitorPrices.push(record.competitorPrice);
    }
    if (record.dayName) {
      policyMap[stateKey].dayNames.add(record.dayName);
    }
    if (Number.isFinite(record.startInventory)) {
      policyMap[stateKey].startInventories.push(record.startInventory);
    }
  });

  const policyTable = Object.values(policyMap).map(state => {
    const playerMin = state.playerPrices.length > 0 ? Math.min(...state.playerPrices) : null;
    const playerMax = state.playerPrices.length > 0 ? Math.max(...state.playerPrices) : null;
    const competitorMin = state.competitorPrices.length > 0 ? Math.min(...state.competitorPrices) : null;
    const competitorMax = state.competitorPrices.length > 0 ? Math.max(...state.competitorPrices) : null;

    let rlMin = null, rlMax = null;
    if (!isTutorial && state.rlPrices.length > 0) {
      rlMin = Math.min(...state.rlPrices);
      rlMax = Math.max(...state.rlPrices);
    }
    const groupedDays = [...state.dayNames].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    );
    const minInventory = state.startInventories.length > 0 ? Math.min(...state.startInventories) : null;
    const maxInventory = state.startInventories.length > 0 ? Math.max(...state.startInventories) : null;
    const inventoryDisplay = formatInventoryRange(minInventory, maxInventory);

    return {
      ...state,
      groupedDays,
      inventoryRangeString: inventoryDisplay.label,
      inventoryIsApproximate: inventoryDisplay.approximate,
      competitorRangeStr: !state.competitor
        ? 'No'
        : competitorMin === competitorMax
          ? `$${competitorMin?.toFixed(2)}`
          : `$${competitorMin?.toFixed(2)} - $${competitorMax?.toFixed(2)}`,
      playerRangeStr: playerMin === playerMax ? `$${playerMin?.toFixed(2)}` : `$${playerMin?.toFixed(2)} - $${playerMax?.toFixed(2)}`,
      rlRangeStr: rlMin === null ? "Fetching..." : (rlMin === rlMax ? `$${rlMin?.toFixed(2)}` : `$${rlMin?.toFixed(2)} - $${rlMax?.toFixed(2)}`),
      count: state.playerPrices.length
    };
  });

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden ${theme}`}>
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/40 rounded-full blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/40 rounded-full blur-[120px] animate-blob [animation-delay:2s] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-coffee-900 border border-coffee-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className={`p-6 border-b border-coffee-700 relative ${theme === 'theme-latte' ? 'bg-gradient-to-r from-blue-100 via-coffee-900 to-coffee-800' : 'bg-gradient-to-r from-blue-900 to-coffee-900'}`}>
            <h2 className="text-3xl font-bold text-coffee-100 flex items-center gap-3">
              <Award className="text-yellow-400 w-8 h-8" />
              Week {weekNumber} Report
            </h2>
            <p className={`mt-2 ${theme === 'theme-latte' ? 'text-blue-900' : 'text-blue-200'}`}>Performance Summary (Days {(weekNumber - 1) * 7 + 1} - {weekNumber * 7})</p>

            <button
              type="button"
              onClick={toggleTheme}
              className="absolute top-6 right-6 p-2 bg-coffee-800 hover:bg-amber-500 hover:text-coffee-900 rounded-full border border-coffee-700 transition-all text-coffee-200"
            >
              {theme === 'theme-latte' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">


            {/* Comparison Grid (Player vs ML Only) */}
            <p className={`text-center text-xs font-semibold ${theme === 'theme-latte' ? 'text-coffee-600' : 'text-coffee-300'}`}>
              Hover over the below boxes to see how these net profits were calculated
            </p>
            <div className={`grid gap-4 text-center grid-cols-1 ${!isTutorial ? 'md:grid-cols-2' : ''} max-w-4xl mx-auto`}>
              <WeeklyAgentSummaryCard
                name={isTutorial ? "Your Performance" : shopName}
                titleClassName="text-emerald-400"
                total={data.playerTotal}
                coffeeEarnings={data.playerCoffeeEarnings}
                sales={data.playerSales}
                penalty={data.playerPenalty}
                inventoryLeft={data.playerInventoryLeft}
                theme={theme}
                accentBlobClassName="bg-emerald-500/10"
                highlight
              />

              {/* ML Agent - Hide in Tutorial */}
              {!isTutorial && (
                <WeeklyAgentSummaryCard
                  name="ML Agent"
                  titleClassName="text-blue-700"
                  total={data.mlTotal}
                  coffeeEarnings={data.mlCoffeeEarnings}
                  sales={data.mlSales}
                  penalty={data.mlPenalty}
                  inventoryLeft={data.mlInventoryLeft}
                  theme={theme}
                  accentBlobClassName="bg-blue-500/10"
                />
              )}
            </div>

            {/* Shared Chart rendering for Week Data */}
            {weekHistoryData.length > 0 && (
              <div className="bg-coffee-950/50 border border-coffee-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-coffee-900/60 border-b border-coffee-800">
                  <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
                    <div className="text-sm font-bold text-coffee-100">Weekly Graphs</div>
                    <div className="text-xs text-coffee-400">
                      Pick a view below. Clicking the active toggle closes the graph panel.
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {WEEKLY_GRAPH_TABS
                      .filter((tab) => !tab.tutorialOnly || !isTutorial)
                      .filter((tab) => !(isTutorial && tab.id === 'RLRewards'))
                      .map((tab) => {
                        const isActive = activeWeeklyChartView === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveWeeklyChartView((current) => (current === tab.id ? null : tab.id))}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                              isActive
                                ? WEEKLY_GRAPH_TAB_STYLES[tab.id]
                                : 'bg-coffee-900/50 text-coffee-300 hover:text-coffee-100 border-coffee-700/60'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activeWeeklyChartView && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-coffee-800 h-[560px]">
                        <ProfitChart
                          data={weekHistoryData}
                          showRLAgents={!isTutorial}
                          showMLAgent={!isTutorial}
                          shopName={shopName}
                          enableWeeklyRlRewardsToggle={!isTutorial}
                          forcedViewMode={activeWeeklyChartView}
                          hideInternalViewToggles={true}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Policy Summary Table for the week */}
            {policyTable.length > 0 && (
              <div className="w-full flex flex-col mb-4 bg-coffee-800 border border-coffee-700 rounded-xl overflow-hidden mt-8">
                <div className="p-4 bg-coffee-900/50 border-b border-coffee-700">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    <TableProperties className="w-5 h-5" />
                    Week {weekNumber} - Your Pricing Policy Summary
                  </h3>
                  <p className="text-xs text-coffee-400 mt-1">Review your exact prices during the market states encountered this week.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-coffee-200">
                    <thead className="bg-coffee-900/30 text-coffee-400 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Weather</th>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-left whitespace-nowrap">Day(s)</th>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Inventory</th>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Event</th>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-center whitespace-nowrap">Competitor</th>
                        <th className="px-2.5 py-2.5 font-bold border-b border-coffee-700 text-center text-amber-400 whitespace-nowrap">Your Price Range</th>
                        {!isTutorial && (
                          <th className="px-2.5 py-2.5 font-bold border-x-2 border-t-2 border-b-2 border-emerald-400/80 bg-emerald-500/12 text-center text-emerald-300 whitespace-nowrap shadow-[inset_0_0_18px_rgba(16,185,129,0.12)]">RL Agent's Mastered Price</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coffee-700/50">
                      {policyTable.sort((a, b) => b.count - a.count).map((state, idx) => (
                        <tr key={idx} className="hover:bg-coffee-700/20 transition-colors">
                          <td className="px-2.5 py-2.5 whitespace-nowrap">
                            <span className={`font-medium px-2 py-1 rounded bg-coffee-900 border border-coffee-700 ${state.weather === 'Sunny' ? 'text-amber-400' : 'text-blue-300'}`}>
                              {state.weather}
                            </span>
                          </td>
                          <td className="px-2.5 py-2.5 text-left text-xs text-coffee-300 whitespace-nowrap">
                            {state.groupedDays.length > 0 ? state.groupedDays.map((day) => day.slice(0, 2)).join(', ') : 'N/A'}
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-xs text-coffee-300 whitespace-nowrap">
                            <span>{state.inventoryIsApproximate ? `~ ${state.inventoryRangeString}` : state.inventoryRangeString}</span>
                          </td>
                          <td className="px-2.5 py-2.5 text-center">
                            {state.event ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">Yes</span>
                            ) : (
                              <span className="text-coffee-500 text-[10px]">No</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 text-center">
                            {state.competitor ? (
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold whitespace-nowrap">
                                {state.competitorRangeStr}
                              </span>
                            ) : (
                              <span className="text-coffee-500 text-[10px]">No</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-amber-400 font-bold bg-amber-500/5 whitespace-nowrap">
                            {state.playerRangeStr}
                          </td>
                          {!isTutorial && (
                            <td className={`weekly-rl-twinkle relative overflow-hidden px-2.5 py-2.5 text-center font-mono text-emerald-300 font-bold bg-emerald-500/10 whitespace-nowrap border-x-2 border-emerald-400/80 shadow-[inset_0_0_18px_rgba(16,185,129,0.10)] ${idx === policyTable.length - 1 ? 'border-b-2' : ''}`}>
                              <span className="relative z-10">{state.rlRangeStr}</span>
                              <span className="weekly-rl-twinkle-layer" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                                <span />
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="bg-coffee-950 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[12px] md:text-[13px] leading-[1.15] text-coffee-500 md:flex-1 md:min-w-0 md:pr-4">
              {isTutorial ? TUTORIAL_WEEKLY_FOOTER_TEXT : (WEEKLY_FOOTER_TEXT[weekNumber] || '')}
            </p>
            <div className="flex flex-wrap gap-3 shrink-0">
              {isTutorial && onBackToTutorial && (
                <button
                  onClick={onBackToTutorial}
                  className="bg-transparent hover:bg-coffee-800 text-coffee-400 hover:text-coffee-100 text-sm px-5 py-2.5 rounded-lg font-bold border border-coffee-700 transition-colors whitespace-nowrap"
                >
                  Back to Orientation
                </button>
              )}
              <button
                onClick={onContinue}
                className="bg-amber-500 hover:bg-amber-400 text-coffee-900 text-sm px-7 py-2.5 rounded-lg font-bold shadow-lg shadow-amber-500/20 transition-transform active:scale-95 whitespace-nowrap"
              >
                {isTutorial ? "Proceed" : (weekNumber === 3 ? "Show 3 week report" : `Continue to Week ${weekNumber + 1}`)}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WeeklyReportModal;
