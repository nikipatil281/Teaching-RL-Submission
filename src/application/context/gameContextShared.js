import { createContext } from 'react';

export const GameContext = createContext();

export const ACTIVE_MODEL_PHASES = new Set([
  'pre-tutorial',
  'orientation-instructions',
  'tutorial',
  'pre-simulation',
  'transition',
  'simulation',
]);
