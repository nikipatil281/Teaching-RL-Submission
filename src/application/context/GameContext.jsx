import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PriceSuggestionService } from '../../domain/services/PriceSuggestionService';

const GameContext = createContext();

export const ACTIVE_MODEL_PHASES = new Set([
  'pre-tutorial',
  'orientation-instructions',
  'tutorial',
  'pre-simulation',
  'transition',
  'simulation',
]);

const initialBackendState = {
  ml: { ready: false, state: 'idle' },
  rl: { ready: false, state: 'idle' },
};

/**
 * GameProvider manages the global state and lifecycle of the simulation game.
 */
export const GameProvider = ({ children }) => {
  const [phase, setPhase] = useState('login');
  const [theme, setTheme] = useState('theme-black-coffee');
  const [shopName, setShopName] = useState('You');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('Leo');
  const [backendStatus, setBackendStatus] = useState(initialBackendState);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [hasRestartedSimulation, setHasRestartedSimulation] = useState(false);

  const shouldManageModels = useMemo(
    () => ACTIVE_MODEL_PHASES.has(phase) && !simulationComplete,
    [phase, simulationComplete]
  );

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'theme-black-coffee' ? 'theme-latte' : 'theme-black-coffee'));
  };

  const setGameJoinDetails = (sName, uName) => {
    if (sName && sName.trim()) setShopName(sName.trim());
    if (uName && uName.trim()) setUserName(uName.trim());
    setPhase('landing');
  };

  const restartSimulation = () => {
    if (hasRestartedSimulation) return false;

    setHasRestartedSimulation(true);
    setSimulationComplete(false);
    setPhase('pre-simulation');
    return true;
  };

  const exitToLogin = () => {
    setShopName('You');
    setUserName('');
    setUserAvatar('Leo');
    setHasRestartedSimulation(false);
    setSimulationComplete(false);
    setPhase('login');
  };

  /**
   * Warm up ML/RL models (loads suggestion engine).
   */
  useEffect(() => {
    if (!shouldManageModels) return undefined;

    let cancelled = false;
    const warmupModels = async () => {
      setBackendStatus((current) => ({
        ml: current.ml.ready ? current.ml : { ready: false, state: 'warming' },
        rl: current.rl.ready ? current.rl : { ready: false, state: 'warming' },
      }));

      const suggestionsReady = await PriceSuggestionService.init();

      if (cancelled) return;

      setBackendStatus({
        ml: { ready: suggestionsReady, state: suggestionsReady ? 'ready' : 'offline' },
        rl: { ready: suggestionsReady, state: suggestionsReady ? 'ready' : 'offline' },
      });
    };

    warmupModels();

    return () => { cancelled = true; };
  }, [phase, shouldManageModels]);

  const value = {
    phase, setPhase,
    theme, toggleTheme,
    shopName, setShopName,
    userName, setUserName,
    userAvatar, setUserAvatar,
    backendStatus,
    simulationComplete, setSimulationComplete,
    hasRestartedSimulation,
    setGameJoinDetails,
    restartSimulation,
    exitToLogin
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/**
 * Hook to use the Game context.
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
