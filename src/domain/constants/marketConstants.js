/**
 * Market Simulation Constants
 */

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const NON_SUNNY_WEATHER = ['Cloudy', 'Rainy'];
export const MAIN_SIMULATION_DAYS = 21;

export const LOCAL_EVENTS = [
  'Music Concert',
  'Movie Screening',
  'Carnival',
  'Food Fest',
  'Local Marathon',
  'Street Fair',
  'Art Exhibition'
];

export const PRICE_MIN = 1;
export const PRICE_MAX = 10;
export const WEEKLY_START_INVENTORY = 5000;
export const CUP_COST = 1;
export const WASTAGE_COST_PER_CUP = 1.5;
export const WEEKDAY_SALES_TARGET = 200;
export const WEEKEND_SALES_TARGET = 250;
export const LOW_SALES_PENALTY = 100;

export const STANDARD_COMPETITOR_GAIN_MAX_PRICE = 7;
export const UMBRELLA_PRICING_TRIGGER_PRICE = 8;
export const UMBRELLA_PRICING_BONUS_PER_DOLLAR = 10;

export const DEMAND_RANGES = {
  SET_A: {
    1: [401, 450], 2: [351, 400], 3: [301, 350], 4: [251, 300], 5: [201, 250],
    6: [151, 200], 7: [101, 150], 8: [51, 100], 9: [1, 50], 10: [0, 10]
  },
  SET_B: {
    1: [551, 600], 2: [501, 550], 3: [451, 500], 4: [401, 450], 5: [351, 400],
    6: [301, 350], 7: [251, 300], 8: [201, 250], 9: [151, 200], 10: [0, 150]
  },
  SET_E: {
    1: [251, 300], 2: [201, 250], 3: [151, 200], 4: [101, 150], 5: [13, 15],
    6: [10, 13], 7: [8, 10], 8: [3, 7], 9: [1, 3], 10: [0, 0]
  },
  SET_G: {
    1: [451, 500], 2: [401, 450], 3: [351, 400], 4: [301, 350], 5: [251, 300],
    6: [201, 250], 7: [151, 200], 8: [101, 150], 9: [51, 100], 10: [0, 50]
  }
};
