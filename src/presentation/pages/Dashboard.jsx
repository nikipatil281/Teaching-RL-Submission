import React, { useState, useEffect, useEffectEvent } from "react";
import { Play, Coffee, Moon, Sun, TrendingUp, Info, CheckCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";

import MarketView from "./MarketView";
import PolicyReviewPage from "./PolicyReviewPage";
import PolicyQuizPage from "./PolicyQuizPage";
import RLPipelinePage from "./RLPipelinePage";
import ProfitChart from "../components/ProfitChart";
import CafeMap from "../components/CafeMap";
import EndGameModal from "../components/EndGameModal";
import WeeklyReportModal from "../components/WeeklyReportModal";
import WeatherEffects from "../components/WeatherEffects";
import EmergencyRestockModal from "../components/EmergencyRestockModal";
import DailyFeedbackModal from "../components/DailyFeedbackModal";

import { MarketService } from "../../domain/services/MarketService";
import { PriceSuggestionService } from "../../domain/services/PriceSuggestionService";
import { MAIN_SIMULATION_DAYS, WEEKLY_START_INVENTORY } from "../../domain/constants/marketConstants";

const createInitialPolicyQuizState = () => ({
  answers: {},
  scenarios: [
    {
      id: 1,
      day: "Monday",
      weather: "Sunny",
      traffic: "normal with no events",
      competitor: "absent",
      competitorPrice: "",
      optimalPrice: "",
    },
  ],
  submitAttempted: false,
  submitted: false,
  nextScenarioId: 2,
});

const COMPACT_DASHBOARD_WIDTH = 900;

const SessionLeaveConfirmModal = ({ isOpen, actionLabel, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        className="w-full max-w-md rounded-2xl border border-coffee-700 bg-coffee-900 p-5 shadow-2xl"
      >
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-400">
          Leave Session?
        </div>
        <h3 className="mt-2 text-xl font-bold text-coffee-100">
          Your current gameplay session will be lost.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-coffee-300">
          If you leave this page now, the progress from the present run will not be saved. Are you sure you want to continue?
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-coffee-700 bg-coffee-800 px-4 py-2.5 text-sm font-bold text-coffee-100 transition-colors hover:bg-coffee-700"
          >
            No, go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500"
          >
            Yes, {actionLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({
  theme,
  toggleTheme,
  shopName,
  userName,
  onRestart,
  onExitToLogin,
  userAvatar = 'Leo',
  backendStatus,
  onSimulationComplete,
  hasRestartedSimulation = false,
}) => {
  const DEFAULT_PLAYER_PRICE = 1;

  // Game State
  const [day, setDay] = useState(1);
  const [conditions, setConditions] = useState(() => {
    MarketService.initMainGameSchedule(true);
    return MarketService.generateMainGameConditions(1);
  });
  const [playerPrice, setPlayerPrice] = useState(DEFAULT_PLAYER_PRICE);

  // Independent Weekly Inventories for Phase 2
  const [playerInventory, setPlayerInventory] = useState(WEEKLY_START_INVENTORY);
  const [mlInventory, setMlInventory] = useState(WEEKLY_START_INVENTORY);
  const [rlInventory, setRlInventory] = useState(WEEKLY_START_INVENTORY);
  const [competitorInventory, setCompetitorInventory] = useState(WEEKLY_START_INVENTORY);

  const [history, setHistory] = useState([
    {
      day: "Start",
      dayName: "",
      playerRevenue: 0,
      playerProfit: 0,
      playerCumulativeGrossProfit: 0,
      playerGrossProfit: 0,
      playerReward: 0,
      mlRevenue: 0,
      mlProfit: 0,
      mlCumulativeGrossProfit: 0,
      mlGrossProfit: 0,
      mlReward: 0,
      rlRevenue: 0,
      rlProfit: 0,
      rlCumulativeGrossProfit: 0,
      rlGrossProfit: 0,
      rlReward: 0,
      competitorRevenue: 0,
      competitorProfit: 0,
      competitorCumulativeGrossProfit: 0,
      competitorGrossProfit: 0,
      playerSales: 0,
      mlSales: 0,
      rlSales: 0,
    },
  ]);

  const [mlSuggestion, setMLSuggestion] = useState(5);
  const [rlSuggestion, setRLSuggestion] = useState({
    price: 5,
    action: "medium",
    isExploring: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weekData, setWeekData] = useState(null);
  const [toast] = useState(null);
  const [gameActive] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [pendingNextDayStr, setPendingNextDayStr] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pendingWeeklyStats, setPendingWeeklyStats] = useState(null);
  const [showPolicyPage, setShowPolicyPage] = useState(false);
  const [showPipelinePage, setShowPipelinePage] = useState(false);
  const [showPolicyQuizPage, setShowPolicyQuizPage] = useState(false);
  const [policyQuizState, setPolicyQuizState] = useState(createInitialPolicyQuizState);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);
  const [useCompactDashboardLayout, setUseCompactDashboardLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < COMPACT_DASHBOARD_WIDTH;
  });
  const mlAvatarUri = React.useMemo(
    () =>
      createAvatar(bottts, {
        seed: "Leo",
        radius: 16,
      }).toDataUri(),
    []
  );

  const toGamePrice = (value) => MarketService.normalizePrice(value);
  const mlReady = backendStatus?.ml?.ready ?? false;
  const rlReady = backendStatus?.rl?.ready ?? false;

  const recallHistory = showPopup ? history.slice(0, -1) : history;

  // Dynamic Memory Recall
  const getMemoryRecall = () => {
    if (day <= 7 || recallHistory.length <= 1) return null;

    // Find past days that have the EXACT same state ID (calculated in generateMainGameConditions)
    const pastSimilarDays = recallHistory.filter((h, index) =>
      index > 0 &&
      typeof h.day === 'string' &&
      h.day.includes("Day ") &&
      h.stateId === conditions.stateId
    );

    if (pastSimilarDays.length > 0) {
      // Find the most recent occurrence (the user usually wants to exploit the most recent or best info)
      // Since states only repeat twice, there will be at most 1 past instance of the same state.
      const lastOccurrence = pastSimilarDays[pastSimilarDays.length - 1];

      return {
        dayNum: lastOccurrence.day.replace("Day ", ""),
        price: lastOccurrence.playerPrice,
        profit: lastOccurrence.playerDailyProfit ?? 0,
        reward: lastOccurrence.playerDailyReward,
        dayName: lastOccurrence.dayName || conditions.day // Fallback
      };
    }
    return null;
  };
  const memoryData = getMemoryRecall();

  const updateSuggestions = useEffectEvent(async () => {
    const currentDayName = conditions.day || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][(day - 1) % 7];

    if (!mlReady || !rlReady) return;

    const suggestion = await PriceSuggestionService.getSuggestions({
      day: currentDayName,
      weather: conditions.weather,
      nearbyEvent: conditions.nearbyEvent,
      competitorPresent: conditions.competitorPresent,
      competitorPrice: conditions.competitorPrice || 0
    });

    if (!suggestion) {
      setMLSuggestion(5);
      setRLSuggestion({
        price: 5,
        action: "price_$5.00",
        isExploring: false,
      });
      return;
    }

    setMLSuggestion(toGamePrice(suggestion.mlPrice));
    setRLSuggestion({
      price: toGamePrice(suggestion.rlPrice),
      action: `price_$${toGamePrice(suggestion.rlPrice).toFixed(2)}`,
      isExploring: false,
    });
  });

  // 2. Update Suggestions when conditions change
  useEffect(() => {
    updateSuggestions();
  }, [conditions, mlReady, rlReady]);

  const openEndgameModal = () => {
    onSimulationComplete?.();
    setModalOpen(true);
  };

  const handleStartDay = () => {
    if (!gameActive || showPopup) return;

    const normalizedPlayerPrice = toGamePrice(playerPrice);
    const normalizedMlPrice = toGamePrice(mlSuggestion);
    const normalizedRlPrice = toGamePrice(rlSuggestion.price);

    if (normalizedPlayerPrice !== playerPrice) {
      setPlayerPrice(normalizedPlayerPrice);
    }

    const currentConditions = { ...conditions };
    const lastRecord = history[history.length - 1];

    const playerDemand = MarketService.calculateDemand(
      normalizedPlayerPrice,
      currentConditions.weather,
      currentConditions.nearbyEvent,
      currentConditions.day,
      currentConditions.competitorPresent,
      currentConditions.competitorPrice
    );
    const playerSales = MarketService.calculateSales(playerDemand, playerInventory);

    const mlDemand = MarketService.calculateDemand(
      normalizedMlPrice,
      currentConditions.weather,
      currentConditions.nearbyEvent,
      currentConditions.day,
      currentConditions.competitorPresent,
      currentConditions.competitorPrice
    );
    const mlSales = MarketService.calculateSales(mlDemand, mlInventory);

    const rlDemand = MarketService.calculateDemand(
      normalizedRlPrice,
      currentConditions.weather,
      currentConditions.nearbyEvent,
      currentConditions.day,
      currentConditions.competitorPresent,
      currentConditions.competitorPrice
    );
    const rlSales = MarketService.calculateSales(rlDemand, rlInventory);

    const normalizedCompetitorPrice = currentConditions.competitorPrice ? toGamePrice(currentConditions.competitorPrice) : null;

    let compSales = 0;
    if (currentConditions.competitorPresent && normalizedCompetitorPrice !== null) {
      const cDemand = MarketService.calculateDemand(
        normalizedCompetitorPrice,
        currentConditions.weather,
        currentConditions.nearbyEvent,
        currentConditions.day,
        true,
        normalizedPlayerPrice
      );
      compSales = MarketService.calculateSales(cDemand, competitorInventory);
    }

    const playerBreakdown = MarketService.calculateDailyProfit(playerSales, normalizedPlayerPrice, currentConditions.day);
    const mlBreakdown = MarketService.calculateDailyProfit(mlSales, normalizedMlPrice, currentConditions.day);
    const rlBreakdown = MarketService.calculateDailyProfit(rlSales, normalizedRlPrice, currentConditions.day);

    const compBreakdown = (currentConditions.competitorPresent && normalizedCompetitorPrice !== null)
      ? MarketService.calculateDailyProfit(compSales, normalizedCompetitorPrice, currentConditions.day)
      : { gross: 0, cogs: 0, penalty: 0, netProfit: 0 };

    const playerRewardComponent = playerBreakdown.gross - playerBreakdown.cogs;
    const mlRewardComponent = mlBreakdown.gross - mlBreakdown.cogs;
    const rlRewardComponent = rlBreakdown.gross - rlBreakdown.cogs;
    const competitorRewardComponent = compBreakdown.gross - compBreakdown.cogs;

    const nextPlayerInv = playerInventory - playerSales;
    const nextMlInv = mlInventory - mlSales;
    const nextRlInv = rlInventory - rlSales;
    const nextCompInv = competitorInventory - compSales;

    let playerDailyProfit = playerBreakdown.netProfit;
    let mlDailyProfit = mlBreakdown.netProfit;
    let rlDailyProfit = rlBreakdown.netProfit;
    let compDailyProfit = compBreakdown.netProfit;

    let playerPenalty = 0;
    let mlPenalty = 0;
    let rlPenalty = 0;
    let competitorPenalty = 0;

    if (day % 7 === 0) {
      playerPenalty = MarketService.calculateWeekWastagePenalty(nextPlayerInv);
      mlPenalty = MarketService.calculateWeekWastagePenalty(nextMlInv);
      rlPenalty = MarketService.calculateWeekWastagePenalty(nextRlInv);
      competitorPenalty = MarketService.calculateWeekWastagePenalty(nextCompInv);
    }

    const playerPenaltyComponent = playerBreakdown.penalty + playerPenalty;
    const mlPenaltyComponent = mlBreakdown.penalty + mlPenalty;
    const rlPenaltyComponent = rlBreakdown.penalty + rlPenalty;

    const playerRewardData = MarketService.calculateReward(playerRewardComponent);
    const mlRewardData = MarketService.calculateReward(mlRewardComponent);
    const rlRewardData = MarketService.calculateReward(rlRewardComponent);
    const playerNetRewardData = MarketService.calculateNetReward(playerRewardComponent, playerPenaltyComponent);
    const mlNetRewardData = MarketService.calculateNetReward(mlRewardComponent, mlPenaltyComponent);
    const rlNetRewardData = MarketService.calculateNetReward(rlRewardComponent, rlPenaltyComponent);

    const playerDailyReward = playerNetRewardData.total;
    const mlDailyReward = mlNetRewardData.total;
    const rlDailyReward = rlNetRewardData.total;

    const mappedWeatherStr = currentConditions.weather.charAt(0).toUpperCase() + currentConditions.weather.slice(1);

    const newRecord = {
      day: `Day ${day}`,

      // Rewards
      playerReward: (lastRecord.playerReward || 0) + playerDailyReward,
      mlReward: (lastRecord.mlReward || 0) + mlDailyReward,
      rlReward: (lastRecord.rlReward || 0) + rlDailyReward,
      playerDailyReward,
      mlDailyReward,
      rlDailyReward,
      playerDailyRewardPoints: playerRewardData.total,
      playerDailyPenaltyPoints: parseFloat(playerPenaltyComponent.toFixed(2)),
      mlDailyRewardPoints: mlRewardData.total,
      mlDailyPenaltyPoints: parseFloat(mlPenaltyComponent.toFixed(2)),
      rlDailyRewardPoints: rlRewardData.total,
      rlDailyPenaltyPoints: parseFloat(rlPenaltyComponent.toFixed(2)),

      // Cumulative Revenue
      playerRevenue: (lastRecord.playerRevenue || 0) + playerBreakdown.gross,
      mlRevenue: (lastRecord.mlRevenue || 0) + mlBreakdown.gross,
      rlRevenue: (lastRecord.rlRevenue || 0) + rlBreakdown.gross,
      competitorRevenue: (lastRecord.competitorRevenue || 0) + compBreakdown.gross,

      // Cumulative Profit (chart compatibility)
      playerProfit: (lastRecord.playerProfit || 0) + playerDailyProfit,
      mlProfit: (lastRecord.mlProfit || 0) + mlDailyProfit,
      rlProfit: (lastRecord.rlProfit || 0) + rlDailyProfit,
      competitorProfit: (lastRecord.competitorProfit || 0) + compDailyProfit,
      playerCumulativeGrossProfit: (lastRecord.playerCumulativeGrossProfit || 0) + playerDailyProfit - playerPenalty,
      mlCumulativeGrossProfit: (lastRecord.mlCumulativeGrossProfit || 0) + mlDailyProfit - mlPenalty,
      rlCumulativeGrossProfit: (lastRecord.rlCumulativeGrossProfit || 0) + rlDailyProfit - rlPenalty,
      competitorCumulativeGrossProfit: (lastRecord.competitorCumulativeGrossProfit || 0) + compDailyProfit - competitorPenalty,
      playerGrossProfit: (lastRecord.playerGrossProfit || 0) + playerRewardComponent,
      mlGrossProfit: (lastRecord.mlGrossProfit || 0) + mlRewardComponent,
      rlGrossProfit: (lastRecord.rlGrossProfit || 0) + rlRewardComponent,
      competitorGrossProfit: (lastRecord.competitorGrossProfit || 0) + competitorRewardComponent,

      // Daily Gross Revenue
      playerDailyRevenue: playerBreakdown.gross,
      mlDailyRevenue: mlBreakdown.gross,
      rlDailyRevenue: rlBreakdown.gross,
      competitorDailyRevenue: compBreakdown.gross,

      // Daily Net Profit
      playerDailyProfit,
      mlDailyProfit,
      rlDailyProfit,
      competitorDailyProfit: compDailyProfit,
      playerDailyGrossProfit: playerRewardComponent,
      mlDailyGrossProfit: mlRewardComponent,
      rlDailyGrossProfit: rlRewardComponent,
      competitorDailyGrossProfit: competitorRewardComponent,

      // Daily Sales
      playerSales,
      mlSales,
      rlSales,
      competitorSales: compSales,

      // Penalties
      playerLowSalesPenalty: playerBreakdown.penalty,
      mlLowSalesPenalty: mlBreakdown.penalty,
      rlLowSalesPenalty: rlBreakdown.penalty,
      competitorLowSalesPenalty: compBreakdown.penalty,
      playerPenalty,
      mlPenalty,
      rlPenalty,
      competitorPenalty,

      // Inventories
      startInventory: playerInventory,
      mlStartInventory: mlInventory,
      rlStartInventory: rlInventory,
      competitorStartInventory: competitorInventory,

      // Price and state trace
      rlDemand,
      rlPrice: normalizedRlPrice,
      mlPrice: normalizedMlPrice,
      playerPrice: normalizedPlayerPrice,
      weather: mappedWeatherStr,
      nearbyEvent: currentConditions.nearbyEvent,
      competitorPresent: currentConditions.competitorPresent,
      competitorPrice: normalizedCompetitorPrice,
      stateId: currentConditions.stateId,
      dayName: currentConditions.day,

      // Cumulative Sales
      playerTotalSales: (lastRecord.playerTotalSales || 0) + playerSales,
      mlTotalSales: (lastRecord.mlTotalSales || 0) + mlSales,
      rlTotalSales: (lastRecord.rlTotalSales || 0) + rlSales,
      competitorTotalSales: (lastRecord.competitorTotalSales || 0) + compSales
    };

    const updatedHistory = [...history, newRecord];
    setHistory(updatedHistory);

    if (day % 7 === 0) {
      const weekSlice = updatedHistory.slice(-7);
      const startOfWeek = updatedHistory[updatedHistory.length - 8] || {
        playerProfit: 0,
        mlProfit: 0,
        rlProfit: 0,
        competitorProfit: 0,
        playerRevenue: 0,
        mlRevenue: 0,
        rlRevenue: 0,
        competitorRevenue: 0,
        playerGrossProfit: 0,
        mlGrossProfit: 0,
        rlGrossProfit: 0,
        competitorGrossProfit: 0
      };

      const weeklyStats = {
        playerTotal: ((newRecord.playerProfit || 0) - (startOfWeek.playerProfit || 0)) - playerPenalty,
        mlTotal: ((newRecord.mlProfit || 0) - (startOfWeek.mlProfit || 0)) - mlPenalty,
        rlTotal: ((newRecord.rlProfit || 0) - (startOfWeek.rlProfit || 0)) - rlPenalty,
        competitorTotal: ((newRecord.competitorProfit || 0) - (startOfWeek.competitorProfit || 0)) - competitorPenalty,
        playerRevenue: (newRecord.playerRevenue || 0) - (startOfWeek.playerRevenue || 0),
        mlRevenue: (newRecord.mlRevenue || 0) - (startOfWeek.mlRevenue || 0),
        rlRevenue: (newRecord.rlRevenue || 0) - (startOfWeek.rlRevenue || 0),
        competitorRevenue: (newRecord.competitorRevenue || 0) - (startOfWeek.competitorRevenue || 0),
        playerCoffeeEarnings: (newRecord.playerGrossProfit || 0) - (startOfWeek.playerGrossProfit || 0),
        mlCoffeeEarnings: (newRecord.mlGrossProfit || 0) - (startOfWeek.mlGrossProfit || 0),
        rlCoffeeEarnings: (newRecord.rlGrossProfit || 0) - (startOfWeek.rlGrossProfit || 0),
        competitorCoffeeEarnings: (newRecord.competitorGrossProfit || 0) - (startOfWeek.competitorGrossProfit || 0),
        playerPenalty,
        mlPenalty,
        rlPenalty,
        competitorPenalty,
        playerInventoryLeft: nextPlayerInv,
        mlInventoryLeft: nextMlInv,
        rlInventoryLeft: nextRlInv,
        competitorInventoryLeft: nextCompInv,
        playerSales: weekSlice.reduce((sum, d) => sum + (d.playerSales || 0), 0),
        mlSales: weekSlice.reduce((sum, d) => sum + (d.mlSales || 0), 0),
        rlSales: weekSlice.reduce((sum, d) => sum + (d.rlSales || 0), 0),
        competitorSales: weekSlice.reduce((sum, d) => sum + (d.competitorSales || 0), 0)
      };

      setPendingWeeklyStats(weeklyStats);
    } else {
      setPendingWeeklyStats(null);
    }

    setPendingNextDayStr({
      nextDayNum: day + 1,
      pInv: nextPlayerInv,
      mInv: nextMlInv,
      rInv: nextRlInv,
      cInv: nextCompInv
    });

    setFeedback({
      color: 'blue',
      icon: <Info />,
      title: 'Daily Results',
      value: playerDailyProfit,
      playerSales,
      playerReward: playerDailyReward,
      showZeroMarginInsight: normalizedPlayerPrice === 1
    });

    setShowPopup(true);
  };

  const handleContinue = () => {
    setShowPopup(false);

    if (day % 7 === 0 && pendingWeeklyStats) {
      setWeekData(pendingWeeklyStats);
      setWeeklyModalOpen(true);
      return;
    }

    // End Game Trap
    if (day >= MAIN_SIMULATION_DAYS) {
      openEndgameModal();
      return;
    }

    if (!pendingNextDayStr) {
      advanceDay(day + 1);
      return;
    }

    advanceDay(pendingNextDayStr.nextDayNum, pendingNextDayStr.pInv, pendingNextDayStr.mInv, pendingNextDayStr.rInv, pendingNextDayStr.cInv);
  };

  const advanceDay = (
    nextDayNum,
    pInv = WEEKLY_START_INVENTORY,
    mInv = WEEKLY_START_INVENTORY,
    rInv = WEEKLY_START_INVENTORY,
    cInv = WEEKLY_START_INVENTORY
  ) => {
    setDay(nextDayNum);
    setPlayerPrice(DEFAULT_PLAYER_PRICE);
    const nextConditions = MarketService.generateMainGameConditions(nextDayNum);
    setConditions(nextConditions);

    // Weekly Refill logic
    if (nextDayNum % 7 === 1) {
      setPlayerInventory(WEEKLY_START_INVENTORY);
      setMlInventory(WEEKLY_START_INVENTORY);
      setRlInventory(WEEKLY_START_INVENTORY);
      setCompetitorInventory(WEEKLY_START_INVENTORY);
    } else {
      setPlayerInventory(pInv);
      setMlInventory(mInv);
      setRlInventory(rInv);
      setCompetitorInventory(cInv);
    }
  };

  const handleNextWeek = () => {
    // Close modal and start next day
    setWeeklyModalOpen(false);

    if (pendingNextDayStr) {
      const nextDayNum = pendingNextDayStr.nextDayNum;

      // End game after week 3 report
      if (day === MAIN_SIMULATION_DAYS) {
        openEndgameModal();
        return;
      }

      advanceDay(nextDayNum, pendingNextDayStr.pInv, pendingNextDayStr.mInv, pendingNextDayStr.rInv, pendingNextDayStr.cInv);
    } else {
      if (day === MAIN_SIMULATION_DAYS) {
        openEndgameModal();
      } else {
        advanceDay(day + 1);
      }
    }
  };

  const handleEmergencyRestock = () => {
    // Emergency restock is removed in the new mechanics.
    setShowRestockModal(false);
  };

  const handleBackToWeekly = () => {
    setModalOpen(false);
    setWeeklyModalOpen(true);
  };

  const handleRestart = () => {
    if (hasRestartedSimulation) return;

    setPendingLeaveAction("restart");
  };

  const handleExitSession = () => {
    setPendingLeaveAction("exit");
  };

  const handleConfirmLeave = () => {
    if (pendingLeaveAction === "restart") {
      if (onRestart) {
        onRestart();
      } else {
        window.location.reload();
      }
    }

    if (pendingLeaveAction === "exit") {
      onExitToLogin?.();
    }

    setPendingLeaveAction(null);
  };

  useEffect(() => {
    const updateDashboardViewport = () => {
      setUseCompactDashboardLayout(
        window.innerWidth < COMPACT_DASHBOARD_WIDTH
      );
    };

    updateDashboardViewport();
    window.addEventListener("resize", updateDashboardViewport);
    return () => window.removeEventListener("resize", updateDashboardViewport);
  }, []);

  if (showPolicyQuizPage) {
    return (
      <>
        <PolicyQuizPage
          theme={theme}
          toggleTheme={toggleTheme}
          onBackToPolicyReview={() => {
            setShowPolicyQuizPage(false);
          }}
          onRestart={handleRestart}
          onExitToLogin={handleExitSession}
          hasRestartedSimulation={hasRestartedSimulation}
          quizState={policyQuizState}
          setQuizState={setPolicyQuizState}
          history={history}
        />
        <AnimatePresence>
          <SessionLeaveConfirmModal
            isOpen={pendingLeaveAction !== null}
            actionLabel={pendingLeaveAction === "restart" ? "run it again" : "leave"}
            onCancel={() => setPendingLeaveAction(null)}
            onConfirm={handleConfirmLeave}
          />
        </AnimatePresence>
      </>
    );
  }

  if (showPipelinePage) {
    return (
      <>
        <RLPipelinePage
          theme={theme}
          toggleTheme={toggleTheme}
          onBackToPolicyReview={() => {
            setShowPipelinePage(false);
          }}
          onGoToQuiz={() => {
            setShowPolicyQuizPage(true);
            setShowPipelinePage(false);
          }}
          onRestart={handleRestart}
          onExitToLogin={handleExitSession}
          hasRestartedSimulation={hasRestartedSimulation}
        />
        <AnimatePresence>
          <SessionLeaveConfirmModal
            isOpen={pendingLeaveAction !== null}
            actionLabel={pendingLeaveAction === "restart" ? "run it again" : "leave"}
            onCancel={() => setPendingLeaveAction(null)}
            onConfirm={handleConfirmLeave}
          />
        </AnimatePresence>
      </>
    );
  }

  if (showPolicyPage) {
    return (
      <>
        <PolicyReviewPage
          history={history}
          shopName={shopName}
          onBackToDebrief={() => setShowPolicyPage(false)}
          onNext={() => {
            setShowPipelinePage(true);
          }}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <AnimatePresence>
          <SessionLeaveConfirmModal
            isOpen={pendingLeaveAction !== null}
            actionLabel={pendingLeaveAction === "restart" ? "run it again" : "leave"}
            onCancel={() => setPendingLeaveAction(null)}
            onConfirm={handleConfirmLeave}
          />
        </AnimatePresence>
      </>
    );
  }

  return (
    <div
      className={`${useCompactDashboardLayout ? 'h-screen overflow-y-auto' : 'h-screen overflow-hidden'} bg-coffee-900 text-coffee-100 p-4 font-sans relative overflow-x-hidden transition-colors duration-500 flex flex-col ${theme}`}
    >
      {/* Doodle Pattern Overlay */}
      <div className={`absolute inset-0 pointer-events-none bg-doodle-mask z-0 transition-all duration-500 ${theme === 'theme-black-coffee' ? 'bg-amber-100 opacity-[0.08] mix-blend-screen' : 'bg-amber-900 opacity-[0.15] mix-blend-luminosity'}`} />

      {/* Dynamic Background */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${theme === 'theme-black-coffee' ? 'opacity-30 mix-blend-screen' : 'opacity-50 mix-blend-color-burn'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-900/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/30 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-coffee-800/20 rounded-full blur-[100px] animate-slow-spin opacity-50" />
      </div>

      <WeatherEffects weather={conditions.weather} />

      <header className="mb-4 flex flex-col md:flex-row items-center justify-between relative z-10 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-coffee-100 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            Coffee Shop Reinforcement Learning Simulation
          </h1>
          <p className="text-coffee-300 font-medium text-sm">
            Master the art of pricing with the assistance of an Machine Learning agent.
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-8 justify-end w-full md:w-auto">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-coffee-700 bg-coffee-800 hover:bg-coffee-700 transition-colors text-xs font-bold shadow-md"
          >
            {theme === "theme-black-coffee" ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" /> Latte
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-300" /> Black Coffee
              </>
            )}
          </button>
          <div className="text-right">
            <motion.div
              key={`badge-${day}`}
              initial={{ scale: 1.5, color: "#f59e0b" }}
              animate={{ scale: 1, color: "#10b981" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-xl font-bold"
            >
              Day {day} / {MAIN_SIMULATION_DAYS}
            </motion.div>
            <div className="text-xs font-semibold text-coffee-400">
              {conditions.day}
            </div>
            {!rlReady && (
              <div className="text-[10px] font-semibold text-red-400">
                Advisor suggestions are still loading. A safe fallback price is temporarily in use.
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="w-full flex gap-4 lg:gap-6 flex-grow min-h-0 relative z-10 pr-2">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col gap-4 flex-grow min-h-0">
            {/* Tier 1: Conditions (Full Width) */}
            <div className="w-full shrink-0 transition-all duration-300">
              <MarketView
                day={conditions.day}
                weather={conditions.weather}
                inventory={showPopup && pendingNextDayStr ? pendingNextDayStr.pInv : playerInventory}
                nearbyEvent={conditions.nearbyEvent}
                eventName={conditions.eventName}
                competitorPresent={conditions.competitorPresent}
                competitorPrice={conditions.competitorPrice}
                specialEvent={conditions.specialEvent}
              />
            </div>

            {/* Main dashboard workspace: graph on the left, market and pricing on the right */}
            <div className={`w-full ${useCompactDashboardLayout ? 'flex-none' : 'flex-grow min-h-0'} grid gap-4 lg:gap-6 ${useCompactDashboardLayout ? 'grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]'}`}>
              <div className={`${useCompactDashboardLayout ? 'w-full h-[420px]' : 'h-full min-h-0'} bg-coffee-800/50 rounded-2xl border border-coffee-700/50 flex flex-col overflow-hidden`}>
                <div className="flex-grow w-full">
                  <ProfitChart data={history} showRLAgents={true} shopName={shopName} hideRLLine={true} hideMLReward={true} hideRLRewardLine={true} />
                </div>
              </div>

              <div className={`${useCompactDashboardLayout ? '' : 'h-full min-h-0'} flex flex-col gap-4`}>
                {/* Animation / Simulation Box */}
                <div className={`${useCompactDashboardLayout ? 'w-full h-[320px] md:h-[360px]' : 'flex-1 min-h-[320px]'} bg-coffee-800/50 rounded-2xl flex flex-col overflow-hidden relative group transition-all duration-300`}>
                  <div className="absolute inset-0 w-full h-full xl:bg-coffee-900/80 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 w-full h-full">
                      <CafeMap shopName={shopName} weather={conditions.weather} competitorPresent={conditions.competitorPresent} userAvatar={userAvatar} />
                    </div>
                    <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAaaAE0lEQVQIW2PAwn/MfxjA1MAAAwANJwH++eK/eQAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                  </div>
                </div>

                <div className={`grid items-stretch gap-4 ${useCompactDashboardLayout ? 'grid-cols-1' : 'grid-cols-[minmax(150px,0.42fr)_minmax(0,1fr)]'}`}>
                  <div className={`${theme === 'theme-latte'
                    ? 'border-amber-500/55 bg-amber-50/85 ring-amber-500/20 shadow-amber-500/10'
                    : 'border-amber-400/35 bg-coffee-800/80 ring-amber-300/20 shadow-amber-900/10'
                    } flex min-w-0 flex-col justify-between gap-3 rounded-xl border p-4 ring-1 shadow-xl transition-all duration-300 ${mlReady ? '' : 'opacity-80'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className={`rounded-lg border p-1.5 ${mlReady ? 'border-amber-500/30 bg-amber-500/20' : 'border-coffee-600 bg-coffee-700/50'}`}>
                        <TrendingUp className={`h-4 w-4 ${mlReady ? 'text-amber-400' : 'text-coffee-500'}`} />
                      </div>
                      <img src={mlAvatarUri} alt="ML Agent Avatar" className="h-9 w-9 shrink-0 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-s font-black uppercase tracking-widest text-coffee-100">ML Suggestion</div>
                      <div className="mt-1 text-xs leading-snug text-coffee-400">
                        {mlReady ? 'Advisor price for this state.' : 'Loading advisor...'}
                      </div>
                    </div>
                    <div className={`text-3xl font-black leading-none ${mlReady ? (theme === 'theme-latte' ? 'text-amber-900' : 'text-amber-50') : 'text-coffee-400'}`}>
                      {mlReady ? `$${mlSuggestion.toFixed(2)}` : '---'}
                    </div>
                  </div>

                  {/* Price Selection & Settings */}
                  <div className={`${theme === 'theme-latte'
                    ? 'bg-gradient-to-br from-amber-100/85 via-amber-50/80 to-orange-100/75 border-amber-500/70 ring-amber-500/35 shadow-amber-500/20'
                    : 'bg-gradient-to-br from-amber-700/35 via-coffee-700/85 to-coffee-800/85 border-amber-400/55 ring-amber-300/35 shadow-amber-900/20'
                    } p-4 rounded-xl border ring-1 shadow-xl relative overflow-hidden flex min-w-0 flex-col gap-3 transition-all duration-300`}>
                    {/* Decor */}
                    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl pointer-events-none ${theme === 'theme-latte' ? 'bg-amber-300/45' : 'bg-amber-400/30'}`} />

                    {/* TOP: Labels, Slider, Input Side-by-Side */}
                    <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center">
                      <span className={`text-sm font-extrabold uppercase tracking-wider shrink-0 bg-amber-200/10 border border-amber-300/30 px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${theme === 'theme-latte' ? 'text-amber-900' : 'text-amber-50'}`}>Set Price for the day:</span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={playerPrice}
                          onChange={(e) => setPlayerPrice(parseFloat(e.target.value))}
                          className="h-2 min-w-0 flex-grow appearance-none rounded-lg bg-coffee-950/80 accent-amber-400 shadow-inner"
                        />
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-lg text-amber-300 font-black">$</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={playerPrice}
                            onChange={(e) => setPlayerPrice(e.target.value)}
                            onBlur={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val)) val = 1;
                              val = Math.round(val);
                              if (val < 1) val = 1;
                              if (val > 10) val = 10;
                              setPlayerPrice(val);
                            }}
                            className={`w-16 bg-coffee-900/80 border border-amber-600/40 text-base font-black rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-400 transition-colors shadow-inner ${theme === 'theme-latte' ? 'text-amber-900' : 'text-amber-200'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE: Memory Retrieval Box (Full Width) */}
                    <div className="relative z-10 w-full">
                      {memoryData && !showPopup && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg text-[10px] lg:text-[11px] text-blue-200 leading-snug w-full text-left">
                          <div className="font-bold text-blue-800 dark:text-blue-400 mb-0.5 flex items-center gap-1"><Info className="w-3 h-3" /> If you want to try exploiting...</div>
                          <span className="text-blue-900 dark:text-blue-200">
                            On a previous {memoryData.dayName}, a similar state gave a profit of <span className="font-bold text-blue-900 dark:text-white">${memoryData.profit?.toFixed(0)}</span> and net reward of <span className="font-bold text-blue-900 dark:text-white">{memoryData.reward?.toFixed(0)} Pts</span> at the price per cup of <span className="font-bold text-blue-900 dark:text-white">${memoryData.price.toFixed(2)}</span>.
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* BOTTOM: Action Button (Full Width) */}
                    <motion.button
                      whileHover={{ scale: (gameActive && playerPrice > 0 && !showPopup) ? 1.01 : 1 }}
                      whileTap={{ scale: (gameActive && playerPrice > 0 && !showPopup) ? 0.99 : 1 }}
                      onClick={handleStartDay}
                      disabled={!gameActive || !playerPrice || playerPrice <= 0 || showPopup}
                      className={`relative z-10 w-full px-4 py-3 rounded-xl text-white font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg mt-auto ${(gameActive && playerPrice > 0)
                        ? "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20"
                        : "bg-coffee-700 text-coffee-500 cursor-not-allowed opacity-50"
                        }`}
                    >
                      {gameActive ? (
                        <>
                          <Play className="fill-current w-4 h-4 shrink-0" />
                          <span>Action: Set price for today</span>
                        </>
                      ) : (
                        "ENDED"
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar: Timeline (Desktop Only) specifically for 21 Days */}
        <div className={`${useCompactDashboardLayout ? 'hidden' : 'hidden lg:flex'} flex-col items-center w-[60px] shrink-0 min-h-0 self-stretch`}>
          <div className="flex flex-col items-center w-full bg-coffee-800/30 py-4 px-2 rounded-2xl border border-coffee-700/50 relative overflow-hidden h-full min-h-0">

            <div className="text-[10px] font-bold text-coffee-400 relative z-10 tracking-widest uppercase mb-4 text-center leading-tight">
              Day<br /><span className="text-blue-400 text-sm">{day}</span>
            </div>

            <div className="relative w-full flex-1 min-h-0 flex flex-col items-center mb-2 overflow-y-auto no-scrollbar scroll-smooth">
              {/* Timeline continuous axis */}
              <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-0.5 bg-coffee-700/40 z-0 h-full" />

              {/* Nodes for all 21 days with spacing */}
              <div className="relative z-10 flex flex-col h-auto w-full items-center gap-1.5 py-2">
                {Array.from({ length: MAIN_SIMULATION_DAYS }, (_, i) => i + 1).map((d) => {
                  const isPast = d < day;
                  const isCurrent = d === day;
                  const isLocked = false;
                  return (
                    <div key={d} className="flex items-center justify-center relative group w-full bg-transparent shrink-0">
                      <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-500 relative z-10 ${isPast ? 'border-amber-500/50 text-amber-500 bg-[#1e130d] shadow-[0_0_8px_rgba(245,158,11,0.1)]' :
                        isCurrent ? 'border-blue-500/80 bg-blue-500/20 dark:bg-blue-900/40 shadow-[0_0_12px_rgba(96,165,250,0.3)] scale-125' :
                          isLocked ? 'border-coffee-700/30 bg-coffee-800/50 opacity-40' :
                            'border-coffee-500/30 bg-coffee-900/50'
                        }`}>
                        {isPast ? (
                          <CheckCircle className="w-3 h-3 opacity-80" />
                        ) : isLocked ? (
                          <Lock className="w-2.5 h-2.5 text-coffee-500" />
                        ) : (
                          <span className={`text-[9px] font-bold ${isCurrent ? 'opacity-100 text-blue-700 dark:text-blue-400' : 'opacity-80 text-coffee-300'}`}>{d}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DailyFeedbackModal
        isOpen={showPopup}
        feedback={feedback}
        theme={theme}
        day={day}
        finalDay={MAIN_SIMULATION_DAYS}
        onContinue={handleContinue}
      />

      <EndGameModal
        isOpen={modalOpen}
        onRestart={handleRestart}
        history={history}
        theme={theme}
        toggleTheme={toggleTheme}
        shopName={shopName}
        userName={userName}
        onBackToWeeklyReport={handleBackToWeekly}
        onShowPolicyPage={setShowPolicyPage}
      />

      <WeeklyReportModal
        isOpen={weeklyModalOpen}
        weekNumber={Math.ceil(day / 7)}
        data={
          weekData || {
            playerTotal: 0,
            mlTotal: 0,
            rlTotal: 0,
            competitorTotal: 0,
            playerSales: 0,
            mlSales: 0,
            rlSales: 0,
            competitorSales: 0,
          }
        }
        onContinue={handleNextWeek}
        theme={theme}
        toggleTheme={toggleTheme}
        shopName={shopName}
        isTutorial={false}
        weekHistoryData={history.slice(-7)}
      />

      <EmergencyRestockModal
        isOpen={showRestockModal}
        onRestock={handleEmergencyRestock}
        theme={theme}
      />

      <AnimatePresence>
        <SessionLeaveConfirmModal
          isOpen={pendingLeaveAction !== null}
          actionLabel={pendingLeaveAction === "restart" ? "run it again" : "leave"}
          onCancel={() => setPendingLeaveAction(null)}
          onConfirm={handleConfirmLeave}
        />
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-emerald-900/90 backdrop-blur-md border border-emerald-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-start gap-4 max-w-sm"
          >
            <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-500/30 shrink-0">
              {toast.icon === 'play' ? (
                <Play className="w-8 h-8 text-amber-400" />
              ) : (
                <Info className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <h4 className="text-emerald-100 font-bold text-lg mb-1">{toast.title}</h4>
              <p className="text-emerald-200/80 text-sm leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
