import * as Constants from '../constants/marketConstants';

/**
 * MarketService handles the core simulation logic for the coffee shop market.
 */
export class MarketService {
  /** @private */
  static mainGameSchedule = null;

  /**
   * Normalizes the weather string to a standard format.
   * @param {string} weather 
   * @returns {string}
   */
  static normalizeWeather(weather) {
    const normalized = String(weather || '').trim().toLowerCase();
    if (normalized === 'sunny') return 'Sunny';
    if (normalized === 'cloudy') return 'Cloudy';
    if (normalized === 'rainy') return 'Rainy';
    return 'Sunny';
  }

  /**
   * Clamps a value between a minimum and maximum.
   * @param {number} value 
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  static clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Normalizes the player price to the nearest 0.5 increment within bounds.
   * @param {number} price 
   * @returns {number}
   */
  static normalizePrice(price) {
    const numeric = Number(price);
    if (!Number.isFinite(numeric)) return Constants.PRICE_MIN;
    return this.clamp(Math.round(numeric * 2) / 2, Constants.PRICE_MIN, Constants.PRICE_MAX);
  }

  /**
   * Normalizes the competitor price.
   * @param {number} price 
   * @returns {number}
   */
  static normalizeCompetitorPrice(price) {
    const numeric = Number(price);
    if (!Number.isFinite(numeric)) return 0;
    return this.clamp(Math.round(numeric), 3, 10);
  }

  /**
   * Generates a random integer between min and max inclusive.
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  static randomIntInclusive(min, max) {
    const safeMin = Math.ceil(Math.min(min, max));
    const safeMax = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
  }

  /**
   * Samples a value from a range array [min, max].
   * @param {number[]} range 
   * @returns {number}
   */
  static sampleFromRange(range) {
    if (!Array.isArray(range) || range.length !== 2) return 0;
    return this.randomIntInclusive(range[0], range[1]);
  }

  /**
   * Checks if a day is a weekend.
   * @param {string} dayName 
   * @returns {boolean}
   */
  static isWeekend(dayName) {
    return dayName === 'Saturday' || dayName === 'Sunday';
  }

  /**
   * Determines the demand set key based on conditions.
   * @returns {string|null}
   */
  static getSetKey(dayName, weather, nearbyEvent, competitorPresent) {
    const sunny = this.normalizeWeather(weather) === 'Sunny';
    const weekday = !this.isWeekend(dayName);

    if (weekday && !sunny && !competitorPresent && !nearbyEvent) return 'A';
    if (weekday && !sunny && !competitorPresent && nearbyEvent) return 'B';
    if (weekday && !sunny && competitorPresent && !nearbyEvent) return 'C';
    if (weekday && !sunny && competitorPresent && nearbyEvent) return 'D';
    if (weekday && sunny && !competitorPresent && !nearbyEvent) return 'E';
    if (!weekday && !sunny && competitorPresent && nearbyEvent) return 'F';
    if (!weekday && sunny && !competitorPresent && nearbyEvent) return 'G';

    return null;
  }

  /**
   * Calculates the base demand for a given set and price.
   * @returns {number}
   */
  static getBaseDemandForSet(setKey, price) {
    const p = this.normalizePrice(price);
    
    if (setKey === 'A' || setKey === 'C') return this.sampleFromRange(Constants.DEMAND_RANGES.SET_A[p]);
    if (setKey === 'B' || setKey === 'D' || setKey === 'F') return this.sampleFromRange(Constants.DEMAND_RANGES.SET_B[p]);
    if (setKey === 'E') return this.sampleFromRange(Constants.DEMAND_RANGES.SET_E[p]);
    if (setKey === 'G') return this.sampleFromRange(Constants.DEMAND_RANGES.SET_G[p]);

    return 0;
  }

  /**
   * Applies competitor adjustment to base demand.
   * @returns {number}
   */
  static applyCompetitorAdjustment(baseDemand, setKey, playerPrice, competitorPrice) {
    const p = this.normalizePrice(playerPrice);
    const t = this.normalizeCompetitorPrice(competitorPrice);

    let factor = 0;
    if (setKey === 'C') factor = 20;
    if (setKey === 'D') factor = 30;
    if (setKey === 'F') factor = 50;

    if (factor === 0) return baseDemand;

    const diff = Math.abs(t - p);

    if (t > Constants.UMBRELLA_PRICING_TRIGGER_PRICE && p > t) {
      return Math.max(0, Math.floor(baseDemand + (diff * Constants.UMBRELLA_PRICING_BONUS_PER_DOLLAR)));
    }

    const adjusted = t >= p && t <= Constants.STANDARD_COMPETITOR_GAIN_MAX_PRICE
      ? baseDemand + (diff * factor)
      : t >= p
        ? baseDemand
        : baseDemand - (diff * factor);

    return Math.max(0, Math.floor(adjusted));
  }

  /**
   * Calculates demand based on current conditions.
   */
  static calculateDemand(price, weather, nearbyEvent, day, competitorPresent, competitorPrice) {
    const normalizedDay = Constants.DAYS.includes(day) ? day : Constants.DAYS[0];
    const normalizedWeather = this.normalizeWeather(weather);
    const setKey = this.getSetKey(normalizedDay, normalizedWeather, !!nearbyEvent, !!competitorPresent);
    
    if (!setKey) return 0;

    const baseDemand = this.getBaseDemandForSet(setKey, price);
    return this.applyCompetitorAdjustment(baseDemand, setKey, price, competitorPrice);
  }

  /**
   * Calculates actual sales based on demand and inventory.
   */
  static calculateSales(demand, inventory) {
    const safeDemand = Math.max(0, Math.floor(Number(demand) || 0));
    const safeInventory = Math.max(0, Math.floor(Number(inventory) || 0));
    return Math.min(safeDemand, safeInventory);
  }

  /**
   * Calculates daily penalty for not meeting sales targets.
   */
  static calculateDailyPenalty(sales, dayName) {
    const sold = Math.max(0, Math.floor(Number(sales) || 0));
    const target = this.isWeekend(dayName) ? Constants.WEEKEND_SALES_TARGET : Constants.WEEKDAY_SALES_TARGET;
    return sold < target ? Constants.LOW_SALES_PENALTY : 0;
  }

  /**
   * Calculates daily profit breakdown.
   */
  static calculateDailyProfit(sales, price, dayName) {
    const sold = Math.max(0, Math.floor(Number(sales) || 0));
    const normalizedPrice = this.normalizePrice(price);
    const gross = sold * normalizedPrice;
    const cogs = sold * Constants.CUP_COST;
    const baseProfit = gross - cogs;
    
    return {
      gross,
      cogs,
      penalty: this.calculateDailyPenalty(sold, dayName),
      netProfit: baseProfit
    };
  }

  /**
   * Calculates penalty for wastage at the end of the week.
   */
  static calculateWeekWastagePenalty(remainingInventory) {
    const safeInventory = Math.max(0, Math.floor(Number(remainingInventory) || 0));
    return safeInventory * Constants.WASTAGE_COST_PER_CUP;
  }

  /**
   * Calculates total reward points based on profit.
   */
  static calculateReward(dailyProfit) {
    const value = Number(dailyProfit) || 0;
    return {
      total: parseFloat(value.toFixed(2)),
      rewardPoints: parseFloat(Math.max(0, value).toFixed(2)),
      penaltyPoints: parseFloat(Math.max(0, -value).toFixed(2))
    };
  }

  /**
   * Calculates net reward points after penalties.
   */
  static calculateNetReward(rewardPoints, penaltyPoints) {
    const reward = Number(rewardPoints) || 0;
    const penalty = Number(penaltyPoints) || 0;
    const value = reward - penalty;

    return {
      total: parseFloat(value.toFixed(2)),
      rewardPoints: parseFloat(Math.max(0, reward).toFixed(2)),
      penaltyPoints: parseFloat(Math.max(0, penalty).toFixed(2))
    };
  }

  /**
   * Generates daily conditions for a specific day number.
   */
  static generateDailyConditions(dayNumber) {
    const safeDayNumber = Math.max(1, Math.floor(Number(dayNumber) || 1));
    const dayName = Constants.DAYS[(safeDayNumber - 1) % 7];
    return {
      ...this.createRandomStateForDay(dayName),
      dayNumber: safeDayNumber
    };
  }

  /**
   * Generates or retrieves main game conditions for a specific day number.
   */
  static generateMainGameConditions(dayNumber) {
    const schedule = this.initMainGameSchedule();
    const index = Math.max(0, Math.min(Constants.MAIN_SIMULATION_DAYS - 1, Math.floor(Number(dayNumber) || 1) - 1));
    return { ...schedule[index] };
  }

  /**
   * Initializes the main game schedule (21 days).
   */
  static initMainGameSchedule(forceReset = false) {
    if (this.mainGameSchedule && !forceReset) return this.mainGameSchedule;
    // Logic for buildConstrainedMainSchedule would go here or be called from a private method
    // Re-implementing for the class:
    this.mainGameSchedule = this.buildConstrainedMainSchedule();
    return this.mainGameSchedule;
  }

  /** @private */
  static buildConstrainedMainSchedule() {
    while (true) {
      const statesByDay = {};
      for (const dayName of Constants.DAYS) {
        const first = this.createRandomStateForDay(dayName);
        let second = this.createRandomStateForDay(dayName);
        let guard = 0;
        while (this.buildStateId(second) === this.buildStateId(first) && guard < 20) {
          second = this.createRandomStateForDay(dayName);
          guard += 1;
        }
        statesByDay[dayName] = this.shuffleArray([first, first, second, second]);
      }

      const candidate = [];
      for (let i = 0; i < Constants.MAIN_SIMULATION_DAYS; i++) {
        const dayName = Constants.DAYS[i % 7];
        const weekIndex = Math.floor(i / 7);
        const baseState = statesByDay[dayName][weekIndex];
        candidate.push({
          ...baseState,
          dayNumber: i + 1,
          stateId: this.buildStateId(baseState)
        });
      }

      if (this.scheduleMeetsWeeklyConstraints(candidate)) return candidate;
    }
  }

  /** @private */
  static createRandomStateForDay(dayName) {
    const weekday = !this.isWeekend(dayName);
    if (weekday) {
      const sunny = Math.random() < 0.35;
      if (sunny) {
        const state = {
          day: dayName, weather: 'Sunny', nearbyEvent: false, competitorPresent: false,
          competitorPrice: null, eventName: null, specialEvent: null, setKey: 'E'
        };
        return { ...state, stateId: this.buildStateId(state) };
      }
      const weather = Constants.NON_SUNNY_WEATHER[Math.floor(Math.random() * Constants.NON_SUNNY_WEATHER.length)];
      const bucket = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
      const nearbyEvent = bucket === 'B' || bucket === 'D';
      const competitorPresent = bucket === 'C' || bucket === 'D';
      const state = {
        day: dayName, weather, nearbyEvent, competitorPresent,
        competitorPrice: competitorPresent ? this.randomIntInclusive(3, 10) : null,
        eventName: nearbyEvent ? Constants.LOCAL_EVENTS[Math.floor(Math.random() * Constants.LOCAL_EVENTS.length)] : null,
        specialEvent: null, setKey: bucket
      };
      return { ...state, stateId: this.buildStateId(state) };
    }

    const sunny = Math.random() < 0.5;
    if (sunny) {
      const state = {
        day: dayName, weather: 'Sunny', nearbyEvent: true, competitorPresent: false,
        competitorPrice: null, eventName: Constants.LOCAL_EVENTS[Math.floor(Math.random() * Constants.LOCAL_EVENTS.length)],
        specialEvent: null, setKey: 'G'
      };
      return { ...state, stateId: this.buildStateId(state) };
    }

    const weather = Constants.NON_SUNNY_WEATHER[Math.floor(Math.random() * Constants.NON_SUNNY_WEATHER.length)];
    const state = {
      day: dayName, weather, nearbyEvent: true, competitorPresent: true,
      competitorPrice: this.randomIntInclusive(3, 10),
      eventName: Constants.LOCAL_EVENTS[Math.floor(Math.random() * Constants.LOCAL_EVENTS.length)],
      specialEvent: null, setKey: 'F'
    };
    return { ...state, stateId: this.buildStateId(state) };
  }

  /** @private */
  static buildStateId(state) {
    const compPart = state.competitorPresent ? String(state.competitorPrice) : 'NA';
    return `${state.setKey}-${state.day}-${state.weather}-${state.nearbyEvent ? 1 : 0}-${state.competitorPresent ? 1 : 0}-${compPart}`;
  }

  /** @private */
  static shuffleArray(array) {
    const next = [...array];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  /** @private */
  static scheduleMeetsWeeklyConstraints(schedule) {
    const totalWeeks = Math.ceil(schedule.length / Constants.DAYS.length);

    for (let week = 0; week < totalWeeks; week++) {
      const weekSlice = schedule.slice(week * 7, (week + 1) * 7);
      const competitorDays = weekSlice.filter((s) => s.competitorPresent).length;
      const eventDays = weekSlice.filter((s) => s.nearbyEvent).length;
      if (competitorDays < 3 || eventDays < 0.5) { // Adjusted logic to match original's (eventDays < 1)
        if (competitorDays < 3 || eventDays < 1) return false;
      }
    }
    return true;
  }
}
